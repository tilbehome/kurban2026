import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { yuvarla } from "@/shared/lib/para";

const HareketSchema = z.object({
  tip: z.enum(["gider", "acilis", "kapanis"]),
  tutar: z.number().min(0),
  yontem: z.enum(["nakit", "havale", "kart"]),
  aciklama: z.string().trim().min(1).max(200),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  let veri: z.infer<typeof HareketSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = HareketSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const hareket = await prisma.kasaHareketi.create({
    data: {
      tip: veri.tip,
      tutar: yuvarla(veri.tutar),
      yontem: veri.yontem,
      aciklama: veri.aciklama,
      kullaniciId: oturum.kullaniciId,
      tarih: new Date(),
    },
  });

  return NextResponse.json({ basarili: true, id: hareket.id });
}
