/**
 * Akıllı arama — müşteri ve kurban için 5 farklı format.
 *
 * Test girişleri:
 *  "18" / "dana 18" / "kurban 18" / "DANA-18" → Kurban (kesimSirasi=18)
 *  "000286" / "286" → Müşteri (adSoyad veya id)
 *  "05321234567" / "+90 532..." → Telefon
 *  "4729" (4 hane sayı) → Geçici kod (henüz yok, future)
 *  Diğer → adSoyad LIKE
 */

import { prisma } from "@/shared/lib/prisma";
import { telefonNormalize } from "@/shared/lib/telefon";

export type AramaTipi =
  | "kurban"
  | "musteri-id"
  | "telefon"
  | "kod"
  | "metin"
  | null;

export interface AramaSonucu {
  tip: AramaTipi;
  /** Bulunan kurban (varsa) */
  kurban?: {
    id: string;
    kesimSirasi: number;
    kupeNo: string | null;
    kesimDurumu: string;
  };
  /** Bulunan müşteri (varsa) */
  musteri?: {
    id: string;
    adSoyad: string;
    telefon: string | null;
  };
  /** Çoklu sonuç (metin araması) */
  musteriler?: Array<{
    id: string;
    adSoyad: string;
    telefon: string | null;
  }>;
}

const DANA_REGEX = /^(?:dana|kurban)?[\s-]*(\d{1,4})$/i;
const MUSTERI_NO_REGEX = /^0*\d{4,8}$/;
const KOD_REGEX = /^\d{4}$/;

/**
 * Verilen serbest formatlı girdiyi akıllı şekilde çözer.
 */
export async function akilliAra(input: string): Promise<AramaSonucu> {
  const temiz = input.trim();
  if (temiz.length === 0) return { tip: null };

  // 1. DANA/Kurban araması — "18", "DANA 18", "kurban 18"
  const danaMatch = DANA_REGEX.exec(temiz);
  if (danaMatch) {
    const no = parseInt(danaMatch[1], 10);
    if (no > 0 && no < 10000) {
      const kurban = await prisma.kurban.findUnique({
        where: { kesimSirasi: no },
        select: {
          id: true,
          kesimSirasi: true,
          kupeNo: true,
          kesimDurumu: true,
        },
      });
      if (kurban) {
        return { tip: "kurban", kurban };
      }
      // Numara mevcut ama kurban yok — devam et (metin araması da denenebilir)
    }
  }

  // 2. Telefon araması — TR mobil formatları (0532..., +90 532..., 532..., boşluk/tire dahil)
  const normalize = telefonNormalize(temiz);
  if (normalize) {
    const musteri = await prisma.musteri.findFirst({
      where: {
        silindiMi: false,
        OR: [
          { telefon: { contains: normalize } },
          { telefon: { contains: "0" + normalize } },
          { telefon: { contains: "+90" + normalize } },
          { telefon: { contains: "90" + normalize } },
        ],
      },
      select: { id: true, adSoyad: true, telefon: true },
    });
    if (musteri) return { tip: "telefon", musteri };
  }

  // 3. Geçici kod (4 hane) — şu an "Kurban.kesimSirasi" altında 4-hane DANA olabilir,
  // önce DANA kontrol edildi. Bu blok yedek olarak.
  if (KOD_REGEX.test(temiz)) {
    // Future: TvAyari'da "gecici_kod" tablosu olunca
    // şimdilik metin aramasına düş
  }

  // 4. Müşteri No araması — düz sayı, müşteri ID hash'i olabilir veya tcKimlik
  if (MUSTERI_NO_REGEX.test(temiz) && temiz.length >= 6) {
    const musteri = await prisma.musteri.findFirst({
      where: {
        silindiMi: false,
        OR: [
          { id: temiz },
          { tcKimlik: temiz },
        ],
      },
      select: { id: true, adSoyad: true, telefon: true },
    });
    if (musteri) return { tip: "musteri-id", musteri };
  }

  // 5. Metin araması — adSoyad LIKE (en az 2 karakter)
  if (temiz.length >= 2) {
    const musteriler = await prisma.musteri.findMany({
      where: { silindiMi: false, adSoyad: { contains: temiz } },
      orderBy: { adSoyad: "asc" },
      take: 5,
      select: { id: true, adSoyad: true, telefon: true },
    });
    if (musteriler.length === 1) {
      return { tip: "metin", musteri: musteriler[0] };
    }
    if (musteriler.length > 1) {
      return { tip: "metin", musteriler };
    }
  }

  return { tip: null };
}
