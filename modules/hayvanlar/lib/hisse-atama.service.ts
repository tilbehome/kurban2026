/**
 * Hisse atama servisi — FAZ 7
 *
 * Stable grid için kurban + hisse + müşteri verileri.
 * KUTSAL: prisma sorgular salt-okunur, mevcut /api/hisseler/ata bozulmaz.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import type {
  KurbanKartVeri,
  HisseKutusuVeri,
  EksikHisseliMusteri,
  AtamaIstatistik,
  KurbanDurumRozeti,
} from "../types/hisse-atama";

// =============================================================================
// 1) Stable grid için tüm aktif kurbanlar (hisseleri ile)
// =============================================================================

export async function stableGridVerisi(): Promise<KurbanKartVeri[]> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { id: true, adSoyad: true } },
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const hisseler: HisseKutusuVeri[] = k.hisseler.map((h) => {
      const odenen = yuvarla(topla(...h.odemeler.map((o) => o.toplamTutar)));
      const durum =
        h.musteriId === null
          ? "bos"
          : odenen >= h.hisseFiyati - 0.01
            ? "onayli"
            : "dolu";
      return {
        id: h.id,
        no: h.no,
        musteriId: h.musteriId,
        musteriAdSoyad: h.musteri?.adSoyad ?? null,
        musteriBashar: h.musteri ? basharlariAl(h.musteri.adSoyad) : null,
        hisseFiyati: h.hisseFiyati,
        odenenToplam: odenen,
        durum,
      };
    });

    const doluHisse = hisseler.filter((h) => h.durum !== "bos").length;
    const bosHisse = hisseler.length - doluHisse;
    const yuzde =
      hisseler.length > 0 ? Math.round((doluHisse / hisseler.length) * 100) : 0;
    const onerilen = hisseler.find((h) => h.hisseFiyati > 0)?.hisseFiyati ?? 0;

    const durumRozeti = hesaplaDurumRozeti(
      hisseler.length,
      doluHisse,
      hisseler.every(
        (h) => h.durum === "onayli" || (h.durum === "bos" && false),
      ),
    );

    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      cins: hisseler.length > 7 ? "Büyükbaş" : hisseler.length === 1 ? "Küçükbaş" : "Büyükbaş",
      agirlik: k.canliAgirlik ?? null,
      hisseSayisi: hisseler.length,
      bosHisseSayisi: bosHisse,
      doluHisseSayisi: doluHisse,
      dolulukYuzde: yuzde,
      durumRozeti,
      onerilenFiyat: onerilen,
      hisseler,
    };
  });
}

// =============================================================================
// 2) Sol panel — atama için müşteri listesi
// =============================================================================

export async function eksikHisseliMusteriler(): Promise<
  EksikHisseliMusteri[]
> {
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    orderBy: { adSoyad: "asc" },
    select: {
      id: true,
      adSoyad: true,
      telefon: true,
      etiketler: true,
      hisseler: {
        where: { silindiMi: false, musteriId: { not: null } },
        select: {
          hisseFiyati: true,
          kurban: { select: { kesimSirasi: true } },
          no: true,
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
  });

  return musteriler.map((m) => {
    const etiketler = etiketleriParse(m.etiketler);
    const toplamBedel = yuvarla(
      topla(...m.hisseler.map((h) => h.hisseFiyati)),
    );
    const odenenToplam = yuvarla(
      topla(
        ...m.hisseler.flatMap((h) =>
          h.odemeler.map((o) => o.toplamTutar),
        ),
      ),
    );
    const atananKurbanlar = Array.from(
      new Set(m.hisseler.map((h) => h.kurban.kesimSirasi)),
    ).sort((a, b) => a - b);

    return {
      id: m.id,
      adSoyad: m.adSoyad,
      telefon: m.telefon,
      bashar: basharlariAl(m.adSoyad),
      etiketler,
      vipMi: etiketler.some((e) => e.toLowerCase().includes("vip")),
      atananHisseSayisi: m.hisseler.length,
      atananKurbanlar,
      toplamBedel,
      odenenToplam,
      beklenenEksikHisse: 0, // ileride model genişletilebilir
    };
  });
}

// =============================================================================
// 3) Üst KPI şeridi
// =============================================================================

export async function atamaIstatistik(): Promise<AtamaIstatistik> {
  const [toplamKurban, hisseler, eksikSayim] = await Promise.all([
    prisma.kurban.count({ where: { silindiMi: false } }),
    prisma.hisse.findMany({
      where: { silindiMi: false },
      select: { id: true, musteriId: true },
    }),
    prisma.musteri.count({
      where: {
        silindiMi: false,
        hisseler: { none: { silindiMi: false, musteriId: { not: null } } },
      },
    }),
  ]);

  const toplamHisse = hisseler.length;
  const doluHisse = hisseler.filter((h) => h.musteriId !== null).length;
  const bosHisse = toplamHisse - doluHisse;
  const yuzde =
    toplamHisse > 0 ? Math.round((doluHisse / toplamHisse) * 100) : 0;

  return {
    toplamKurban,
    toplamHisse,
    doluHisse,
    bosHisse,
    dolulukYuzde: yuzde,
    eksikMusteri: eksikSayim,
  };
}

// =============================================================================
// İç yardımcılar
// =============================================================================

function basharlariAl(adSoyad: string): string {
  const parts = adSoyad
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function etiketleriParse(metin: string | null): string[] {
  if (!metin) return [];
  try {
    const j = JSON.parse(metin) as unknown;
    if (Array.isArray(j)) return j.filter((s): s is string => typeof s === "string");
  } catch {
    // virgülle ayrılmış olabilir
    return metin
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

function hesaplaDurumRozeti(
  toplam: number,
  dolu: number,
  hepsiOdendi: boolean,
): KurbanDurumRozeti {
  if (toplam === 0) return "bos";
  if (dolu === 0) return "bos";
  if (dolu === toplam && hepsiOdendi) return "kesime-hazir";
  if (dolu === toplam) return "beklemede";
  return "yarim";
}
