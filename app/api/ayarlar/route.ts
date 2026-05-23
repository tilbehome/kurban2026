import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/permissions";
import { ayarlariToplu, tumAyarlar } from "@/modules/_core/ayarlar/ayar.service";

const AyarlarSchema = z.record(z.string(), z.string());

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }
  const ayarlar = await tumAyarlar();
  return NextResponse.json({ ayarlar });
}

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  let veri: Record<string, string>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AyarlarSchema.parse(govde);
  } catch {
    return NextResponse.json({ hata: "Geçersiz veri" }, { status: 400 });
  }

  await ayarlariToplu(veri);
  return NextResponse.json({ basarili: true });
}
