import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yuvarla } from "@/shared/lib/para";
import { yayinla } from "@/shared/lib/events";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const TopluAtamaSchema = z.object({
  atamalar: z
    .array(
      z.object({
        hisseId: z.string().min(1),
        musteriId: z.string().min(1),
        hisseFiyati: z.number().positive(),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * Toplu hisse atama — Hızlı Mod için.
 * İşlem all-or-nothing transaction içinde yürür; herhangi bir hisse eksik,
 * dolu veya eşzamanlı doldurulmuşsa hiçbir atama kalıcı olmaz.
 */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return NextResponse.json(
      { basarili: false, hata: "Atama yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof TopluAtamaSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = TopluAtamaSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  try {
    const basarili = await prisma.$transaction(async (tx) => {
      const hisseIds = veri.atamalar.map((a) => a.hisseId);
      const hisseler = await tx.hisse.findMany({
        where: { id: { in: hisseIds }, silindiMi: false },
        select: { id: true, musteriId: true, no: true },
      });
      const hisseMap = new Map(hisseler.map((h) => [h.id, h]));

      for (const a of veri.atamalar) {
        const mevcut = hisseMap.get(a.hisseId);
        if (!mevcut) throw new Error("HISSE_YOK");
        if (mevcut.musteriId !== null) {
          throw new Error(`HISSE_DOLU:${mevcut.no}`);
        }
      }

      const basarili: string[] = [];
      for (const a of veri.atamalar) {
        const guncelleme = await tx.hisse.updateMany({
          where: { id: a.hisseId, musteriId: null, silindiMi: false },
          data: {
            musteriId: a.musteriId,
            hisseFiyati: yuvarla(a.hisseFiyati),
          },
        });

        if (guncelleme.count === 0) {
          throw new Error("HISSE_ESZAMANLI_ATANDI");
        }

        basarili.push(a.hisseId);
      }

      await auditLog({
        tx,
        eylem: "hisse-toplu-atama",
        model: "Hisse",
        kayitId: basarili[0] ?? veri.atamalar[0].hisseId,
        kullaniciId: oturum.kullaniciId,
        ip: ipCikar(req),
        detaylar: {
          toplam: veri.atamalar.length,
          basarili: basarili.length,
          hisseIds: basarili,
        },
      });

      return basarili;
    });

    yayinla("hisse:toplu-atandi", { hisseIds: basarili });

    return NextResponse.json({
      basarili: true,
      basariliAtama: basarili.length,
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "HISSE_YOK") {
        return NextResponse.json(
          { basarili: false, hata: "Hisseler bulunamadı" },
          { status: 404 },
        );
      }
      if (e.message.startsWith("HISSE_DOLU:")) {
        return NextResponse.json(
          {
            basarili: false,
            hata: `Hisse #${e.message.slice("HISSE_DOLU:".length)} zaten dolu`,
          },
          { status: 409 },
        );
      }
      if (e.message === "HISSE_ESZAMANLI_ATANDI") {
        return NextResponse.json(
          {
            basarili: false,
            hata: "Hisselerden biri eşzamanlı başka kullanıcı tarafından dolduruldu. Listeyi yenileyip tekrar deneyin.",
          },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { basarili: false, hata: "Toplu atama tamamlanamadı" },
      { status: 500 },
    );
  }
}
