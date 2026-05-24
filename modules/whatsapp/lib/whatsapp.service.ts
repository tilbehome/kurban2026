/**
 * WhatsApp servis fonksiyonları — CRUD + müşteri filtreleme.
 *
 * Server-only: prisma + audit + ayar.service.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import type { HedefMusteri, MusteriFiltresi } from "../types";

// =============================================================================
// 1) Tüm aktif şablonları getir
// =============================================================================

export async function aktifSablonlar() {
  return prisma.whatsAppSablonu.findMany({
    where: { silindiMi: false, aktifMi: true },
    orderBy: [{ varsayilan: "desc" }, { ad: "asc" }],
  });
}

// =============================================================================
// 2) Filtreye göre hedef müşterileri çek (toplu gönderim için)
// =============================================================================

export async function hedefMusterileri(
  filtre: MusteriFiltresi,
): Promise<HedefMusteri[]> {
  // Etiket filtresi (LIKE) — JSON string olduğu için contains yeter
  const where = {
    silindiMi: false,
    ...(filtre.etiket
      ? { etiketler: { contains: filtre.etiket } }
      : {}),
  };

  const musteriler = await prisma.musteri.findMany({
    where,
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
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true, dekontNo: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const sonuc: HedefMusteri[] = musteriler.map((m) => {
    const toplam = yuvarla(topla(...m.hisseler.map((h) => h.hisseFiyati)));
    const odenen = yuvarla(
      topla(
        ...m.hisseler.flatMap((h) =>
          h.odemeler.map((o) => o.toplamTutar),
        ),
      ),
    );
    const kalan = yuvarla(toplam - odenen);
    const sonOdeme = m.hisseler
      .flatMap((h) => h.odemeler)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      musteriId: m.id,
      adSoyad: m.adSoyad,
      bashar: basharlariAl(m.adSoyad),
      telefon: m.telefon,
      toplamBedel: toplam,
      odenenTutar: odenen,
      kalanTutar: kalan,
      hisseSayisi: m.hisseler.length,
      dekontNo: sonOdeme?.dekontNo ?? null,
      kurbanNo: m.hisseler[0]?.kurban.kesimSirasi ?? null,
      etiketler: etiketleriParse(m.etiketler),
    };
  });

  // Durum filtresi (post-fetch çünkü borç hesabı reduce ile yapılıyor)
  return sonuc.filter((m) => {
    if (filtre.durum === "borclu") return m.kalanTutar > 0.01;
    if (filtre.durum === "tahsil-edildi")
      return m.toplamBedel > 0 && m.kalanTutar <= 0.01;
    if (filtre.durum === "telefonsuz") return !m.telefon || m.telefon.length === 0;
    // tum
    return true;
  }).filter((m) => {
    if (filtre.minBorc !== undefined && m.kalanTutar < filtre.minBorc) return false;
    if (filtre.maxBorc !== undefined && m.kalanTutar > filtre.maxBorc) return false;
    return true;
  });
}

// =============================================================================
// 3) Tüm etiketleri topla (filtre dropdown için)
// =============================================================================

export async function tumEtiketler(): Promise<string[]> {
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false, etiketler: { not: null } },
    select: { etiketler: true },
  });
  const set = new Set<string>();
  for (const m of musteriler) {
    etiketleriParse(m.etiketler).forEach((e) => set.add(e));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
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
    if (Array.isArray(j))
      return j.filter((s): s is string => typeof s === "string");
  } catch {
    return metin
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}
