import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import {
  ayniIsimSayisi,
} from "@/modules/musteriler/lib/musteri.service";
import { musteriAktiviteleri } from "@/modules/musteriler/lib/aktivite.service";
import { MusteriHero } from "@/modules/musteriler/components/MusteriHero";
import { MusteriDetayClient } from "@/modules/musteriler/components/MusteriDetayClient";
import type { MusteriTabId } from "@/modules/musteriler/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MusteriDetayPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "musteriler.goruntule")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Müşteri görüntüleme yetkiniz yok.</p>
        </div>
      </AppShell>
    );
  }

  // Tek query — tüm tab'lara veri sağlar
  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          kurban: { select: { kesimSirasi: true, kupeNo: true } },
          vekalet: {
            include: {
              // olusturan adını almak için audit'ten join yapamadığımız için
              // kullanici ilişkisi yok — şimdilik id ile gösterilir
            },
          },
          odemeler: {
            orderBy: { tarih: "desc" },
            include: { kullanici: { select: { adSoyad: true } } },
          },
        },
        orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
      },
    },
  });
  if (!musteri) notFound();

  // Paralel yardımcı sorgular
  const [ayniIsim, aktiviteler, notlar] = await Promise.all([
    ayniIsimSayisi(musteri.adSoyad),
    musteriAktiviteleri(id, 5),
    prisma.not.findMany({
      where: { musteriId: id, silindiMi: false },
      orderBy: [{ sabitlendiMi: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  // Notları olusturan kullanıcı adlarıyla zenginleştir
  const notUserIds = Array.from(new Set(notlar.map((n) => n.olusturanId)));
  const notUsers = await prisma.kullanici.findMany({
    where: { id: { in: notUserIds } },
    select: { id: true, adSoyad: true },
  });
  const userMap = new Map(notUsers.map((u) => [u.id, u.adSoyad]));

  const notlarZengin = notlar.map((n) => ({
    id: n.id,
    icerik: n.icerik,
    renk: n.renk,
    sabitlendiMi: n.sabitlendiMi,
    olusturanId: n.olusturanId,
    olusturanAdSoyad: userMap.get(n.olusturanId) ?? "—",
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));

  // İstatistik hesabı
  const toplamBedel = yuvarla(topla(...musteri.hisseler.map((h) => h.hisseFiyati)));
  const toplamOdenen = yuvarla(
    topla(
      ...musteri.hisseler.flatMap((h) =>
        h.odemeler.filter((o) => !o.iptal).map((o) => o.toplamTutar),
      ),
    ),
  );
  const kalan = yuvarla(toplamBedel - toplamOdenen);
  const tahsilatYuzde =
    toplamBedel > 0 ? Math.round((toplamOdenen / toplamBedel) * 100) : 0;
  const kayitYil = new Date().getFullYear() - musteri.createdAt.getFullYear();

  // Hisse listesi — HisselerTab için
  const hisselerForListe = musteri.hisseler.map((h) => {
    const odenen = yuvarla(
      topla(...h.odemeler.filter((o) => !o.iptal).map((o) => o.toplamTutar)),
    );
    const hKalan = yuvarla(h.hisseFiyati - odenen);
    const durum: "tamamlandi" | "kismi" | "borclu" | "iptal" =
      h.musteriId === null
        ? "iptal"
        : hKalan <= 0
          ? "tamamlandi"
          : odenen > 0
            ? "kismi"
            : "borclu";
    return {
      id: h.id,
      kurbanKesimSirasi: h.kurban.kesimSirasi,
      kurbanKupeNo: h.kurban.kupeNo,
      hisseNo: h.no,
      hisseFiyati: h.hisseFiyati,
      odenen,
      kalan: hKalan,
      durum,
      atanmaTarihi: h.createdAt,
      vekaletVar: !!h.vekalet && !h.vekalet.silindiMi,
    };
  });

  // Hisse listesi — HizliOdemePanel için (sadece kalan > 0 olanlar)
  const hisselerForOdeme = hisselerForListe
    .filter((h) => h.kalan > 0)
    .map((h) => ({
      id: h.id,
      no: h.hisseNo,
      kurbanKesimSirasi: h.kurbanKesimSirasi,
      hisseFiyati: h.hisseFiyati,
      kalan: h.kalan,
    }));

  // Tahsilatlar — TahsilatlarTab için
  const tahsilatlar = musteri.hisseler
    .flatMap((h) =>
      h.odemeler.map((o) => ({
        id: o.id,
        tkrNo: o.dekontNo,
        tarih: o.tarih,
        tutar: o.toplamTutar,
        yontem: o.yontem,
        nakit: o.nakit,
        havale: o.havale,
        kart: o.kart,
        kasiyerAdi: o.kullanici.adSoyad,
        iptalMi: o.iptal,
        iptalSebep: o.iptalSebep,
        hisseEtiket: `#${h.kurban.kesimSirasi}.${h.no}`,
      })),
    )
    .sort((a, b) => b.tarih.getTime() - a.tarih.getTime());

  const aktifTahsilatlar = tahsilatlar.filter((t) => !t.iptalMi);
  const tahsilatOzet = {
    toplam: yuvarla(topla(...aktifTahsilatlar.map((t) => t.tutar))),
    islemSayisi: aktifTahsilatlar.length,
    sonOdeme: aktifTahsilatlar[0]?.tarih ?? null,
    iptalSayisi: tahsilatlar.filter((t) => t.iptalMi).length,
  };

  // Vekalet satırları — VekaletlerTab için
  // Vekalet yükleyen kullanıcı adı için ek sorgu
  const vekaletKullaniciIds = Array.from(
    new Set(
      musteri.hisseler
        .map((h) => h.vekalet?.olusturanId)
        .filter((id): id is string => !!id),
    ),
  );
  const vekaletKullanicilari = await prisma.kullanici.findMany({
    where: { id: { in: vekaletKullaniciIds } },
    select: { id: true, adSoyad: true },
  });
  const vUserMap = new Map(vekaletKullanicilari.map((u) => [u.id, u.adSoyad]));

  const vekaletSatirlari = musteri.hisseler.map((h) => ({
    hisseId: h.id,
    kurbanKesimSirasi: h.kurban.kesimSirasi,
    hisseNo: h.no,
    vekalet:
      h.vekalet && !h.vekalet.silindiMi
        ? {
            id: h.vekalet.id,
            dosyaUrl: h.vekalet.dosyaUrl,
            dosyaTipi: h.vekalet.dosyaTipi,
            dosyaBoyutu: h.vekalet.dosyaBoyutu,
            yukleyenAdSoyad: vUserMap.get(h.vekalet.olusturanId) ?? "—",
            createdAt: h.vekalet.createdAt,
          }
        : null,
  }));

  // Son notlar — GenelTab için (max 3)
  const sonNotlar = notlarZengin.slice(0, 3).map((n) => ({
    id: n.id,
    icerik: n.icerik,
    renk: n.renk,
    createdAt: n.createdAt,
  }));

  // İzin matrisi
  const izinler = {
    tahsilat: izinKontrol(oturum, "tahsilat.olustur"),
    iade: izinKontrol(oturum, "tahsilat.olustur"), // basit: tahsilat alabilen iade de düşünebilir
    guncelle: izinKontrol(oturum, "musteriler.guncelle"),
    iletisim: izinKontrol(oturum, "musteriler.iletisim") || izinKontrol(oturum, "musteriler.goruntule"),
    hisseAta: izinKontrol(oturum, "hisseler.ata"),
    etiket: izinKontrol(oturum, "musteriler.etiket"),
    sil: adminMi(oturum.rol),
    notlar: {
      oku: izinKontrol(oturum, "musteriler.notlar.oku"),
      yaz: izinKontrol(oturum, "musteriler.notlar.yaz"),
      admin: adminMi(oturum.rol),
    },
    vekalet: {
      oku: izinKontrol(oturum, "musteriler.vekalet.oku"),
      yaz: izinKontrol(oturum, "musteriler.vekalet.yaz"),
    },
    hisse: {
      iptal: izinKontrol(oturum, "hisseler.iptal"),
      transfer: izinKontrol(oturum, "hisseler.transfer"),
    },
    tahsilatGoruntule: izinKontrol(oturum, "tahsilat.goruntule"),
  };

  // Hangi tab'lar görünür (izinli olanlar)
  const gorunenTabIdleri: MusteriTabId[] = ["genel", "hisseler"];
  if (izinler.tahsilatGoruntule) gorunenTabIdleri.push("tahsilatlar");
  if (izinler.vekalet.oku) gorunenTabIdleri.push("vekaletler");
  if (izinler.notlar.oku) gorunenTabIdleri.push("notlar");

  return (
    <AppShell>
      <MusteriHero
        musteri={{
          id: musteri.id,
          adSoyad: musteri.adSoyad,
          telefon: musteri.telefon,
          tcKimlik: musteri.tcKimlik,
          adres: musteri.adres,
          createdAt: musteri.createdAt,
        }}
        ayniIsim={ayniIsim}
        hisseSayisi={musteri.hisseler.length}
        toplamBedel={toplamBedel}
        toplamOdenen={toplamOdenen}
        kalan={kalan}
        tahsilatYuzde={tahsilatYuzde}
        kayitYil={kayitYil}
      />

      <MusteriDetayClient
        musteri={{
          id: musteri.id,
          adSoyad: musteri.adSoyad,
          telefon: musteri.telefon,
          tcKimlik: musteri.tcKimlik,
          adres: musteri.adres,
          etiketler: musteri.etiketler,
          createdAt: musteri.createdAt,
          updatedAt: musteri.updatedAt,
        }}
        oturumKullaniciId={oturum.kullaniciId}
        izinler={izinler}
        istatistik={{
          hisseSayisi: musteri.hisseler.length,
          toplamBedel,
          odenen: toplamOdenen,
          kalan,
        }}
        hisselerForOdeme={hisselerForOdeme}
        hisselerForListe={hisselerForListe}
        tahsilatlar={tahsilatlar}
        tahsilatOzet={tahsilatOzet}
        vekaletSatirlari={vekaletSatirlari}
        notlar={notlarZengin}
        aktiviteler={aktiviteler}
        sonNotlar={sonNotlar}
        gorunenTabIdleri={gorunenTabIdleri}
      />
    </AppShell>
  );
}
