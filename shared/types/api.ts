/**
 * Standart API yanıt tipleri — MIMARI.md §6.3 + §8.3
 */

export type ApiYanit<T = unknown> =
  | { basarili: true; veri: T; ozet?: ApiOzet }
  | {
      basarili: false;
      hata: string;
      kod?: string;
      detaylar?: unknown;
    };

export interface ApiOzet {
  toplam: number;
  sayfa: number;
  sayfaBoyutu: number;
  toplamSayfa: number;
}

/** Frontend için yardımcı — fetch sonucunu daraltır */
export function basariliMi<T>(
  yanit: ApiYanit<T>,
): yanit is { basarili: true; veri: T; ozet?: ApiOzet } {
  return yanit.basarili;
}
