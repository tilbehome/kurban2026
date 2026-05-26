/**
 * Akıllı arama — public TV müşteri ekranı için.
 *
 * SPRINT-P4 İŞ 4: KVKK uyumu için ad-soyad LIKE araması KAPALI.
 * Public sorgular sadece kişisel olmayan / sahibinin bildiği veriyle
 * eşleşebilir.
 *
 * Test girişleri:
 *  "18" / "dana 18" / "kurban 18" / "DANA-18" → Kurban (kesimSirasi=18)
 *  "000286" / "286" → Müşteri ID veya tcKimlik (en az 6 hane)
 *  "05321234567" / "+90 532..." → Telefon
 *  "Ali" gibi metin → SONUÇ YOK (eskiden adSoyad LIKE yapılıyordu)
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

  // 5. SPRINT-P4 İŞ 4: KVKK koruması — ad-soyad LIKE araması kapalı.
  // "Ali" gibi tek-iki harfli metinle PII listesi sızdırmak yok.
  // Public arama sadece: kurban no, telefon, müşteri ID/tcKimlik.

  return { tip: null };
}
