/**
 * Personel panel polling endpoint'i — kurban bazlı görevler.
 *
 * GET /api/tv/personel-gorevler
 *
 * Kullanıcının görev alanına (Kullanici.gorev) göre aşama-filtreli
 * kurban listesi döner. PersonelAnaClient bunu 5sn'de bir çağırır.
 */

import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import {
  GOREV_ASAMALARI,
  gorevGecerliMi,
} from "@/modules/tv/lib/personel-gorev";

export const dynamic = "force-dynamic";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.kullaniciId },
    select: { gorev: true, rol: true },
  });

  const gorev = gorevGecerliMi(kullanici?.gorev);
  const asamalar = GOREV_ASAMALARI[gorev];

  // "beklemede" durumu da gözüksün ki personel ilerletebilsin (genel görev için)
  const aktifAsamalar =
    gorev === "genel" ? Array.from(new Set([...asamalar, "beklemede"])) : asamalar;

  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: { in: aktifAsamalar },
    },
    select: {
      id: true,
      kesimSirasi: true,
      kesimDurumu: true,
      ilerlemeYuzde: true,
      hisseGrubu: true,
      asama: true,
      operasyonSira: true,
      kesimBaslama: true,
      hisseler: {
        where: { silindiMi: false },
        select: {
          id: true,
          no: true,
          musteriId: true,
          vekaletAlindi: true,
          paketDurumu: true,
          paketKg: true,
          teslimDurumu: true,
          musteri: {
            select: { id: true, adSoyad: true, telefon: true },
          },
        },
        orderBy: { no: "asc" },
      },
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
  });

  const ks = (durum: string) => kurbanlar.filter((k) => k.kesimDurumu === durum);
  const sayim = {
    hepsi: kurbanlar.length,
    vekalet: ks("vekalet_bekliyor").length,
    kesim: kurbanlar.filter((k) =>
      ["siradaki", "hazirlik", "kesimde", "deri_yuzme", "parcalama"].includes(
        k.kesimDurumu,
      ),
    ).length,
    tartim: ks("tartimda").length,
    paketleme: ks("paketleme").length,
    teslim: kurbanlar.filter((k) =>
      ["teslime_hazir", "tamamlandi"].includes(k.kesimDurumu),
    ).length,
  };

  return NextResponse.json({ gorev, kurbanlar, sayim });
}
