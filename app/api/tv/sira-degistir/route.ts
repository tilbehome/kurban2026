import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { siralamaGuncelle } from "@/modules/tv/lib/kurban-asama.service";

const SiraSchema = z.object({
  sira: z
    .array(
      z.object({
        kurbanId: z.string().min(1),
        operasyonSira: z.number().int().min(0).max(1000),
      }),
    )
    .min(1)
    .max(100),
});

/**
 * Drag-drop sıra güncellemesi — admin'in TV operasyon sırasını yeniden düzenlemesi.
 */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json(
      { basarili: false, hata: "TV kontrol yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof SiraSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = SiraSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  try {
    const etkilenen = await siralamaGuncelle(veri.sira);

    await auditLog({
      eylem: "tv-sira-degisikligi",
      model: "Kurban",
      kullaniciId: oturum.kullaniciId,
      ip: ipCikar(req),
      detaylar: { etkilenen, sira: veri.sira.length },
    });

    return NextResponse.json({ basarili: true, etkilenen });
  } catch (e) {
    console.error("sira-degistir hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Sıra güncellenemedi" },
      { status: 500 },
    );
  }
}
