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
import { hisseBorcDurumu } from "@/shared/lib/hisse-bakiye";

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
      asamaBaslangic: true,
      kalanSureDk: true,
      toplamKg: true,
      hisseSayisi: true,
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
          hisseFiyati: true,
          musteri: {
            select: { id: true, adSoyad: true, telefon: true },
          },
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true },
          },
        },
        orderBy: { no: "asc" },
      },
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
  });

  // PersonelKurbanVeri formatına flatten — page.tsx server query'siyle uyumlu
  const kurbanlarOut = kurbanlar.map((k) => ({
    id: k.id,
    kesimSirasi: k.kesimSirasi,
    operasyonSira: k.operasyonSira,
    kesimDurumu: k.kesimDurumu,
    asama: k.asama,
    ilerlemeYuzde: k.ilerlemeYuzde,
    kalanSureDk: k.kalanSureDk,
    toplamKg: k.toplamKg ?? null,
    hisseSayisi: k.hisseSayisi,
    hisseGrubu: k.hisseGrubu ?? null,
    asamaBaslangic: k.asamaBaslangic?.toISOString() ?? null,
    hisseler: k.hisseler.map((h) => ({
      id: h.id,
      no: h.no,
      musteriAdi: h.musteri?.adSoyad ?? null,
      musteriTel: h.musteri?.telefon ?? null,
      vekaletAlindi: h.vekaletAlindi,
      paketDurumu: h.paketDurumu,
      paketKg: h.paketKg,
      teslimDurumu: h.teslimDurumu,
      hisseFiyati: h.hisseFiyati,
      borcDurumu: hisseBorcDurumu(h.hisseFiyati, h.odemeler),
    })),
  }));

  const ks = (durum: string) =>
    kurbanlarOut.filter((k) => k.kesimDurumu === durum);
  const sayim = {
    hepsi: kurbanlarOut.length,
    vekalet: ks("vekalet_bekliyor").length,
    kesim: kurbanlarOut.filter((k) =>
      ["siradaki", "hazirlik", "kesimde", "deri_yuzme", "parcalama"].includes(
        k.kesimDurumu,
      ),
    ).length,
    tartim: ks("tartimda").length,
    paketleme: ks("paketleme").length,
    teslim: kurbanlarOut.filter((k) =>
      ["teslime_hazir", "tamamlandi"].includes(k.kesimDurumu),
    ).length,
  };

  return NextResponse.json({ gorev, kurbanlar: kurbanlarOut, sayim });
}
