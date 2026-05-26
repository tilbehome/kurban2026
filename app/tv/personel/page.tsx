import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { PersonelAnaClient } from "@/modules/tv/components/personel/PersonelAnaClient";
import {
  gorevGecerliMi,
  type PersonelGorev,
} from "@/modules/tv/lib/personel-gorev";
import { hisseBorcDurumu, type BorcDurumu } from "@/shared/lib/hisse-bakiye";

export const dynamic = "force-dynamic";

export interface PersonelHisseVeri {
  id: string;
  no: number;
  musteriAdi: string | null;
  musteriTel: string | null;
  vekaletAlindi: boolean;
  paketDurumu: string | null;
  paketKg: number | null;
  teslimDurumu: string | null;
  hisseFiyati: number;
  borcDurumu: BorcDurumu;
}

export interface PersonelKurbanVeri {
  id: string;
  kesimSirasi: number;
  operasyonSira: number | null;
  kesimDurumu: string;
  asama: string | null;
  ilerlemeYuzde: number;
  kalanSureDk: number | null;
  toplamKg: number | null;
  hisseSayisi: number;
  hisseGrubu: string | null;
  asamaBaslangic: string | null;
  hisseler: PersonelHisseVeri[];
}

export default async function TvPersonelPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <div className="bg-slate-50 flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Personel paneli için TV kontrol yetkiniz gerekiyor.
        </p>
      </div>
    );
  }

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.kullaniciId },
    select: { gorev: true },
  });

  const baslangicGorev: PersonelGorev = gorevGecerliMi(kullanici?.gorev);

  const kurbanlarRaw = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: {
        in: [
          // SPRINT-FIX-3: "beklemede" eklendi — "Hepsi" sekmesinde henüz iş
          // başlamamış kurbanlar da görünsün.
          "beklemede",
          "vekalet_bekliyor",
          "siradaki",
          "hazirlik",
          "kesimde",
          "deri_yuzme",
          "parcalama",
          "tartimda",
          "paketleme",
          "teslime_hazir",
        ],
      },
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
    take: 60,
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { adSoyad: true, telefon: true } },
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
  });

  const kurbanlar: PersonelKurbanVeri[] = kurbanlarRaw.map((k) => ({
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

  return (
    <PersonelAnaClient
      kullaniciAd={oturum.adSoyad}
      kullaniciId={oturum.kullaniciId}
      baslangicGorev={baslangicGorev}
      kurbanlar={kurbanlar}
    />
  );
}
