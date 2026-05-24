/**
 * Dashboard veri servisleri — KPI, trend, kasa, son işlemler vs.
 *
 * Tüm fonksiyonlar paralel olarak Promise.all ile çağrılır (page.tsx).
 * Cache YOK — anlık veri (bayram günü saniyelik fark önemli).
 *
 * KUTSAL prensip: prisma sorgular salt-okunur, mevcut akışı bozmaz.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import type {
  DashboardKpiKart,
  TahsilatTrend,
  TahsilatTrendNoktasi,
  TrendAraligi,
  KesimAkisi,
  SonIslem,
  KasaDurumu,
  WhatsAppMetrik,
} from "../types";

// =============================================================================
// 1) KPI KARTLARI — 6 kart
// =============================================================================

export async function kpiVerileri(): Promise<DashboardKpiKart[]> {
  const [
    musteriToplam,
    musteriBuAy,
    kurbanToplam,
    hisseToplam,
    hisseDolu,
    bugunkuOdeme,
    bugunkuOncekiGun,
    borcMusteriler,
    kasaToplam,
  ] = await Promise.all([
    prisma.musteri.count({ where: { silindiMi: false } }),
    prisma.musteri.count({
      where: { silindiMi: false, createdAt: { gte: ayBaslangici() } },
    }),
    prisma.kurban.count({ where: { silindiMi: false } }),
    prisma.hisse.count({ where: { silindiMi: false } }),
    prisma.hisse.count({
      where: { silindiMi: false, musteriId: { not: null } },
    }),
    bugunkuToplamTahsilat(),
    duneToplamTahsilat(),
    borcluMusterileri(),
    kasaNetBakiye(),
  ]);

  const dolulukYuzde =
    hisseToplam > 0 ? Math.round((hisseDolu / hisseToplam) * 100) : 0;
  const tahsilatTrend =
    bugunkuOncekiGun > 0
      ? Math.round(((bugunkuOdeme - bugunkuOncekiGun) / bugunkuOncekiGun) * 100)
      : 0;
  const musteriTrend =
    musteriToplam > 0
      ? Math.round((musteriBuAy / musteriToplam) * 100)
      : 0;

  return [
    {
      id: "musteri",
      baslik: "Toplam Müşteri",
      sayi: musteriToplam,
      birim: "",
      altMetin: `Bu ay yeni: ${musteriBuAy}`,
      trend:
        musteriTrend > 0
          ? { yon: "yukari", yuzde: musteriTrend, pozitifMi: true }
          : undefined,
      renk: "yesil",
      href: "/musteriler",
    },
    {
      id: "kurban",
      baslik: "Toplam Kurban",
      sayi: kurbanToplam,
      birim: "",
      altMetin: `Toplam hisse: ${hisseToplam}`,
      renk: "mavi",
      href: "/hayvanlar",
    },
    {
      id: "hisse-doluluk",
      baslik: "Hisse Doluluk",
      sayi: dolulukYuzde,
      birim: "%",
      altMetin: `${hisseDolu} / ${hisseToplam} dolu`,
      progressYuzde: dolulukYuzde,
      renk: "mor",
      href: "/hayvanlar",
    },
    {
      id: "tahsilat",
      baslik: "Bugünkü Tahsilat",
      sayi: bugunkuOdeme,
      birim: "₺",
      altMetin: `Dün: ${formatKisa(bugunkuOncekiGun)} ₺`,
      trend:
        tahsilatTrend !== 0
          ? {
              yon: tahsilatTrend > 0 ? "yukari" : "asagi",
              yuzde: Math.abs(tahsilatTrend),
              pozitifMi: tahsilatTrend > 0,
            }
          : undefined,
      renk: "turuncu",
      href: "/tahsilat/bugun",
    },
    {
      id: "borc",
      baslik: "Bekleyen Borç",
      sayi: borcMusteriler.toplam,
      birim: "₺",
      altMetin: `${borcMusteriler.sayi} müşteri borçlu`,
      renk: "kirmizi",
      href: "/musteriler/borclular",
    },
    {
      id: "kasa",
      baslik: "Kasa Bakiyesi",
      sayi: kasaToplam,
      birim: "₺",
      altMetin: "Net bakiye",
      renk: "yesil",
      href: "/kasa",
    },
  ];
}

// =============================================================================
// 2) TAHSİLAT TREND — bugün/7gün/30gün
// =============================================================================

export async function tahsilatTrendVerisi(
  aralik: TrendAraligi,
): Promise<TahsilatTrend> {
  const odemeler = await odemeleriCek(aralik);
  const noktalar = gruplaNoktalar(odemeler, aralik);
  const toplam = yuvarla(topla(...noktalar.map((n) => n.tutar)));
  const islemToplam = noktalar.reduce((s, n) => s + n.islem, 0);
  const ortalama = islemToplam > 0 ? yuvarla(toplam / islemToplam) : 0;

  // Önceki dönem karşılaştırması
  const oncekiAralik = await oncekiAralikToplami(aralik);
  const trend =
    oncekiAralik > 0
      ? Math.round(((toplam - oncekiAralik) / oncekiAralik) * 100)
      : 0;

  return {
    noktalar,
    toplam,
    ortalama,
    basariOrani: 100, // iptal edilmemiş ödemeler — şu an 100
    trend,
  };
}

// =============================================================================
// 3) KESİM AKIŞI — demo veri (gerçek modül Faz 2)
// =============================================================================

export async function kesimAkisiVerisi(): Promise<KesimAkisi> {
  // Gerçek kesim modülü henüz yok — toplam hisse sayısından demo dağılım üret
  const toplamHisse = await prisma.hisse.count({
    where: { silindiMi: false, musteriId: { not: null } },
  });

  const t = toplamHisse;
  // Pipeline benzeri dağılım (gerçek modül kurulunca DB'den gelecek)
  return {
    asamalar: [
      asama(
        "vekalet",
        "Vekalet / Onay",
        Math.round(t * 0.43),
        Math.round(t * 1.0),
        "turuncu",
      ),
      asama(
        "kesim-alani",
        "Kesim Alanı",
        Math.round(t * 0.32),
        Math.round(t * 0.48),
        "sari",
      ),
      asama(
        "kesimde",
        "Kesimde",
        Math.round(t * 0.11),
        Math.round(t * 0.24),
        "kirmizi",
      ),
      asama(
        "parcalama",
        "Parçalama",
        Math.round(t * 0.16),
        Math.round(t * 0.28),
        "mor",
      ),
      asama(
        "tartim",
        "Tartım",
        Math.round(t * 0.16),
        Math.round(t * 0.28),
        "mavi",
      ),
      asama(
        "paketleniyor",
        "Paketleniyor",
        Math.round(t * 0.16),
        Math.round(t * 0.28),
        "yesil-koyu",
      ),
      asama(
        "teslim-hazir",
        "Teslim Hazır",
        Math.round(t * 0.25),
        Math.round(t * 0.3),
        "yesil",
      ),
    ],
    sonGuncelleme: new Date().toISOString(),
    canli: true,
  };
}

// =============================================================================
// 4) SON İŞLEMLER FEED — son 10 ödeme (iptal hariç)
// =============================================================================

export async function sonIslemler(limit = 10): Promise<SonIslem[]> {
  const odemeler = await prisma.odeme.findMany({
    where: { iptal: false, silindiMi: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      toplamTutar: true,
      yontem: true,
      dekontNo: true,
      tarih: true,
      hisse: {
        select: {
          no: true,
          kurban: { select: { kesimSirasi: true } },
          musteri: {
            select: {
              id: true,
              adSoyad: true,
              etiketler: true,
            },
          },
        },
      },
    },
  });

  return odemeler
    .filter((o) => o.hisse.musteri !== null)
    .map((o) => {
      const m = o.hisse.musteri!;
      const rozetler = ["+tahsilat"];
      if (o.yontem !== "nakit") rozetler.push(o.yontem);
      if (m.etiketler?.toLowerCase().includes("vip")) rozetler.push("vip");
      return {
        id: o.id,
        musteriId: m.id,
        musteriAdSoyad: m.adSoyad,
        musteriBashar: basharlariAl(m.adSoyad),
        rozetler,
        tutar: o.toplamTutar,
        yontem: o.yontem as SonIslem["yontem"],
        hisseEtiket: `#${o.hisse.kurban.kesimSirasi}.${o.hisse.no}`,
        dekontNo: o.dekontNo,
        tarih: o.tarih.toISOString(),
      };
    });
}

// =============================================================================
// 5) KASA DURUMU — nakit/banka/POS
// =============================================================================

export async function kasaDurumu(): Promise<KasaDurumu> {
  // İptal edilmemiş ödemelerden yöntem bazında topla
  const odemeler = await prisma.odeme.aggregate({
    where: { iptal: false, silindiMi: false },
    _sum: { nakit: true, havale: true, kart: true },
  });

  const nakit = yuvarla(odemeler._sum.nakit ?? 0);
  const banka = yuvarla(odemeler._sum.havale ?? 0);
  const pos = yuvarla(odemeler._sum.kart ?? 0);

  // Bugünkü hareketler
  const bugunBaslangic = gunBaslangici();
  const bugunHareketler = await prisma.kasaHareketi.findMany({
    where: {
      silindiMi: false,
      tarih: { gte: bugunBaslangic },
    },
    select: { tip: true, tutar: true },
  });

  const bugunkuGiris = yuvarla(
    topla(
      ...bugunHareketler.filter((h) => h.tip === "tahsilat").map((h) => h.tutar),
    ),
  );
  const bugunkuCikis = yuvarla(
    topla(
      ...bugunHareketler.filter((h) => h.tip === "gider").map((h) => h.tutar),
    ),
  );

  return {
    nakit,
    banka,
    pos,
    toplam: yuvarla(nakit + banka + pos),
    bugunkuGiris,
    bugunkuCikis,
  };
}

// =============================================================================
// 6) WHATSAPP METRIK — şimdilik 0 (Faz 2'de gelecek)
// =============================================================================

export async function whatsappMetrik(): Promise<WhatsAppMetrik> {
  return { yeniMesaj: 0, kuyruk: 0, basarili: 0, hata: 0 };
}

// =============================================================================
// İÇ YARDIMCILAR
// =============================================================================

function gunBaslangici(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function gunSonu(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function ayBaslangici(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function gunEkle(d: Date, sayi: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + sayi);
  return r;
}

async function bugunkuToplamTahsilat(): Promise<number> {
  const sonuc = await prisma.odeme.aggregate({
    where: {
      iptal: false,
      silindiMi: false,
      tarih: { gte: gunBaslangici(), lte: gunSonu() },
    },
    _sum: { toplamTutar: true },
  });
  return yuvarla(sonuc._sum.toplamTutar ?? 0);
}

async function duneToplamTahsilat(): Promise<number> {
  const dun = gunEkle(new Date(), -1);
  const sonuc = await prisma.odeme.aggregate({
    where: {
      iptal: false,
      silindiMi: false,
      tarih: { gte: gunBaslangici(dun), lte: gunSonu(dun) },
    },
    _sum: { toplamTutar: true },
  });
  return yuvarla(sonuc._sum.toplamTutar ?? 0);
}

async function borcluMusterileri(): Promise<{ sayi: number; toplam: number }> {
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    select: {
      id: true,
      hisseler: {
        where: { silindiMi: false, musteriId: { not: null } },
        select: {
          hisseFiyati: true,
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
  });

  let sayi = 0;
  let toplam = 0;
  for (const m of musteriler) {
    if (m.hisseler.length === 0) continue;
    const bedel = m.hisseler.reduce((s, h) => s + h.hisseFiyati, 0);
    const odenen = m.hisseler.reduce(
      (s, h) => s + h.odemeler.reduce((a, o) => a + o.toplamTutar, 0),
      0,
    );
    const kalan = bedel - odenen;
    if (kalan > 0.01) {
      sayi++;
      toplam += kalan;
    }
  }
  return { sayi, toplam: yuvarla(toplam) };
}

async function kasaNetBakiye(): Promise<number> {
  const hareketler = await prisma.kasaHareketi.findMany({
    where: { silindiMi: false },
    select: { tip: true, tutar: true },
  });
  const giris = topla(
    ...hareketler
      .filter((h) => h.tip === "tahsilat" || h.tip === "acilis")
      .map((h) => h.tutar),
  );
  const cikis = topla(
    ...hareketler
      .filter((h) => h.tip === "gider")
      .map((h) => h.tutar),
  );
  return yuvarla(giris - cikis);
}

interface OdemeMini {
  tarih: Date;
  toplamTutar: number;
}

async function odemeleriCek(aralik: TrendAraligi): Promise<OdemeMini[]> {
  const baslangic = trendBaslangici(aralik);
  return prisma.odeme.findMany({
    where: {
      iptal: false,
      silindiMi: false,
      tarih: { gte: baslangic },
    },
    select: { tarih: true, toplamTutar: true },
  });
}

async function oncekiAralikToplami(aralik: TrendAraligi): Promise<number> {
  const simdikiBaslangic = trendBaslangici(aralik);
  const oncekiBaslangic = trendBaslangici(aralik, simdikiBaslangic);
  const sonuc = await prisma.odeme.aggregate({
    where: {
      iptal: false,
      silindiMi: false,
      tarih: { gte: oncekiBaslangic, lt: simdikiBaslangic },
    },
    _sum: { toplamTutar: true },
  });
  return yuvarla(sonuc._sum.toplamTutar ?? 0);
}

function trendBaslangici(
  aralik: TrendAraligi,
  bitis: Date = new Date(),
): Date {
  if (aralik === "bugun") return gunBaslangici(bitis);
  if (aralik === "7gun") return gunBaslangici(gunEkle(bitis, -7));
  return gunBaslangici(gunEkle(bitis, -30));
}

function gruplaNoktalar(
  odemeler: OdemeMini[],
  aralik: TrendAraligi,
): TahsilatTrendNoktasi[] {
  if (aralik === "bugun") return gruplaSaatlik(odemeler);
  if (aralik === "7gun") return grupla7Gun(odemeler);
  return grupla30Gun(odemeler);
}

function gruplaSaatlik(odemeler: OdemeMini[]): TahsilatTrendNoktasi[] {
  const slots = [0, 4, 8, 12, 16, 20];
  return slots.map((s) => {
    const ilgili = odemeler.filter(
      (o) => o.tarih.getHours() >= s && o.tarih.getHours() < s + 4,
    );
    return {
      etiket: `${s.toString().padStart(2, "0")}:00`,
      tutar: yuvarla(topla(...ilgili.map((o) => o.toplamTutar))),
      islem: ilgili.length,
    };
  });
}

function grupla7Gun(odemeler: OdemeMini[]): TahsilatTrendNoktasi[] {
  const adlar = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const sonuc: TahsilatTrendNoktasi[] = [];
  for (let i = 6; i >= 0; i--) {
    const gun = gunEkle(new Date(), -i);
    const baslangic = gunBaslangici(gun);
    const bitis = gunSonu(gun);
    const ilgili = odemeler.filter(
      (o) => o.tarih >= baslangic && o.tarih <= bitis,
    );
    sonuc.push({
      etiket: adlar[gun.getDay()],
      tutar: yuvarla(topla(...ilgili.map((o) => o.toplamTutar))),
      islem: ilgili.length,
    });
  }
  return sonuc;
}

function grupla30Gun(odemeler: OdemeMini[]): TahsilatTrendNoktasi[] {
  const sonuc: TahsilatTrendNoktasi[] = [];
  // 5'er gün grupla (6 nokta)
  for (let i = 5; i >= 0; i--) {
    const bitisGun = gunEkle(new Date(), -i * 5);
    const baslangicGun = gunEkle(bitisGun, -4);
    const baslangic = gunBaslangici(baslangicGun);
    const bitis = gunSonu(bitisGun);
    const ilgili = odemeler.filter(
      (o) => o.tarih >= baslangic && o.tarih <= bitis,
    );
    sonuc.push({
      etiket: `${baslangicGun.getDate()}.${(baslangicGun.getMonth() + 1).toString().padStart(2, "0")}`,
      tutar: yuvarla(topla(...ilgili.map((o) => o.toplamTutar))),
      islem: ilgili.length,
    });
  }
  return sonuc;
}

function asama(
  id: "vekalet" | "kesim-alani" | "kesimde" | "parcalama" | "tartim" | "paketleniyor" | "teslim-hazir",
  ad: string,
  sayi: number,
  toplam: number,
  renk: KesimAkisi["asamalar"][number]["renk"],
): KesimAkisi["asamalar"][number] {
  return {
    id,
    ad,
    sayi,
    toplam: Math.max(toplam, sayi, 1),
    yuzde: toplam > 0 ? Math.round((sayi / toplam) * 100) : 0,
    renk,
  };
}

function basharlariAl(adSoyad: string): string {
  const parcalar = adSoyad
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parcalar.length === 0) return "??";
  if (parcalar.length === 1) return parcalar[0].slice(0, 2).toUpperCase();
  return (parcalar[0][0] + parcalar[parcalar.length - 1][0]).toUpperCase();
}

function formatKisa(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
