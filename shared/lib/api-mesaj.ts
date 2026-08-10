import { mesajCoz, type Locale } from "./i18n";

export interface ApiHataMesajiKaynak {
  hata?: string;
  mesajAnahtari?: string;
  parametreler?: Record<string, string | number | boolean | null | undefined>;
}

export function apiHataMesajiCoz(
  kaynak: ApiHataMesajiKaynak | null | undefined,
  locale: Locale = "tr",
): string {
  if (!kaynak) return mesajCoz("error.internal.generic", locale);

  if (kaynak.mesajAnahtari) {
    return mesajCoz(kaynak.mesajAnahtari, locale, kaynak.parametreler);
  }

  return kaynak.hata || mesajCoz("error.internal.generic", locale);
}
