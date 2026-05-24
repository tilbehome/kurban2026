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
 * Tek transaction'da çoklu atama yapar.
 * Tüm hisseler için musteriId=null kontrolü yapılır;
 * doluysa fail-safe ile o atama atlanır (raporda gösterilir).
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

  const hisseIds = veri.atamalar.map((a) => a.hisseId);
  const hisseler = await prisma.hisse.findMany({
    where: { id: { in: hisseIds } },
    select: { id: true, musteriId: true, no: true },
  });
  const hisseMap = new Map(hisseler.map((h) => [h.id, h]));

  const basarili: string[] = [];
  const atlananlar: { hisseId: string; sebep: string }[] = [];

  for (const a of veri.atamalar) {
    const mevcut = hisseMap.get(a.hisseId);
    if (!mevcut) {
      atlananlar.push({ hisseId: a.hisseId, sebep: "Hisse bulunamadı" });
      continue;
    }
    if (mevcut.musteriId !== null) {
      atlananlar.push({
        hisseId: a.hisseId,
        sebep: `Hisse #${mevcut.no} zaten dolu`,
      });
      continue;
    }
    await prisma.hisse.update({
      where: { id: a.hisseId },
      data: {
        musteriId: a.musteriId,
        hisseFiyati: yuvarla(a.hisseFiyati),
      },
    });
    basarili.push(a.hisseId);
  }

  await auditLog({
    eylem: "hisse-toplu-atama",
    model: "Hisse",
    kayitId: basarili[0] ?? veri.atamalar[0].hisseId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      toplam: veri.atamalar.length,
      basarili: basarili.length,
      atlanan: atlananlar.length,
      atlananDetay: atlananlar,
    },
  });

  if (basarili.length > 0) {
    yayinla("hisse:toplu-atandi", { hisseIds: basarili });
  }

  return NextResponse.json({
    basarili: true,
    basariliAtama: basarili.length,
    atlanan: atlananlar.length,
    atlananDetay: atlananlar,
  });
}
