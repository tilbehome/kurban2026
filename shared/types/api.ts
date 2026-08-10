/**
 * Standart API yanıt tipleri.
 *
 * Hata cevapları eski istemciler için `hata` alanını korur; yeni istemciler
 * kararlı `kod`, `mesajAnahtari`, güvenli `parametreler` ve `requestId`
 * alanlarını kullanabilir.
 */

export type ApiHataParametreleri = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ApiYanit<T = unknown> =
  | { basarili: true; veri: T; ozet?: ApiOzet }
  | {
      basarili: false;
      hata: string;
      kod?: string;
      mesajAnahtari?: string;
      parametreler?: ApiHataParametreleri;
      requestId?: string;
      detaylar?: unknown;
    };

export interface ApiOzet {
  toplam: number;
  sayfa: number;
  sayfaBoyutu: number;
  toplamSayfa: number;
}
/** Frontend için yardımcı; fetch sonucunu daraltır. */
export function basariliMi<T>(
  yanit: ApiYanit<T>,
): yanit is { basarili: true; veri: T; ozet?: ApiOzet } {
  return yanit.basarili;
}
