import { NextRequest, NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import {
  hedefMusterileri,
  tumEtiketler,
} from "@/modules/whatsapp/lib/whatsapp.service";
import type { MusteriFiltresi } from "@/modules/whatsapp/types";

export const dynamic = "force-dynamic";

/**
 * Toplu gönderim için filtreli müşteri listesi.
 * Query: durum, etiket, minBorc, maxBorc
 * Yanıt: { veri: HedefMusteri[], etiketler: string[], telefonsuzSayisi: number }
 */
export async function GET(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "whatsapp.gonderim")) {
    return NextResponse.json(
      { basarili: false, hata: "Gönderim yetkiniz yok" },
      { status: 403 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const durum = (sp.get("durum") ?? "tum") as MusteriFiltresi["durum"];
  const etiket = sp.get("etiket") || undefined;
  const minBorc = sp.get("minBorc")
    ? Number(sp.get("minBorc"))
    : undefined;
  const maxBorc = sp.get("maxBorc")
    ? Number(sp.get("maxBorc"))
    : undefined;

  if (!["tum", "borclu", "tahsil-edildi", "telefonsuz"].includes(durum)) {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz durum" },
      { status: 400 },
    );
  }

  try {
    const [musteriler, etiketler] = await Promise.all([
      hedefMusterileri({ durum, etiket, minBorc, maxBorc }),
      tumEtiketler(),
    ]);

    const telefonsuzSayisi = musteriler.filter(
      (m) => !m.telefon || m.telefon.trim().length === 0,
    ).length;

    return NextResponse.json({
      basarili: true,
      veri: musteriler,
      etiketler,
      telefonsuzSayisi,
    });
  } catch (e) {
    console.error("musteriler-filtre hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
