/**
 * 12 detaylı aşama → 6 görünür aşama gruplama.
 *
 * Backend (DB) 12 aşamada kalır — sistem bozulmaz.
 * Bu dosya sadece UI için "user-friendly" gruplandırma yapar.
 *
 * 6 grup:
 *   1. Beklemede / Sıradaki
 *   2. Vekalet / Onay
 *   3. Kesim
 *   4. Parçalama
 *   5. Tartım
 *   6. Teslim
 */

import type { KurbanKesimDurumu } from "./asama-akisi";

export type AsamaGrubu =
  | "beklemede"
  | "vekalet"
  | "kesim"
  | "parcalama"
  | "tartim"
  | "teslim"
  | "tamamlandi"
  | "iptal";

export const ASAMA_GRUBU_SIRASI: AsamaGrubu[] = [
  "beklemede",
  "vekalet",
  "kesim",
  "parcalama",
  "tartim",
  "teslim",
  "tamamlandi",
];

export const GRUP_ETIKETLERI: Record<AsamaGrubu, string> = {
  beklemede: "Beklemede / Sıradaki",
  vekalet: "Vekalet / Onay",
  kesim: "Kesim",
  parcalama: "Parçalama",
  tartim: "Tartım",
  teslim: "Teslim",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const GRUP_KISA_ETIKET: Record<AsamaGrubu, string> = {
  beklemede: "Beklemede",
  vekalet: "Vekalet",
  kesim: "Kesim",
  parcalama: "Parçalama",
  tartim: "Tartım",
  teslim: "Teslim",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const GRUP_RENKLERI: Record<AsamaGrubu, string> = {
  beklemede: "bg-slate-100 text-slate-700 border-slate-300",
  vekalet: "bg-amber-100 text-amber-700 border-amber-300",
  kesim: "bg-orange-100 text-orange-700 border-orange-300",
  parcalama: "bg-pink-100 text-pink-700 border-pink-300",
  tartim: "bg-blue-100 text-blue-700 border-blue-300",
  teslim: "bg-green-100 text-green-700 border-green-300",
  tamamlandi: "bg-emerald-100 text-emerald-700 border-emerald-300",
  iptal: "bg-red-100 text-red-700 border-red-300",
};

/**
 * 12'li detay aşamayı 6'lı gruba çevirir.
 */
export function durumuGrupla(durum: KurbanKesimDurumu): AsamaGrubu {
  switch (durum) {
    case "beklemede":
    case "siradaki":
      return "beklemede";
    case "vekalet_bekliyor":
      return "vekalet";
    case "hazirlik":
    case "kesimde":
    case "deri_yuzme":
      return "kesim";
    case "parcalama":
      return "parcalama";
    case "tartimda":
      return "tartim";
    case "paketleme":
    case "teslime_hazir":
      return "teslim";
    case "tamamlandi":
      return "tamamlandi";
    case "iptal":
      return "iptal";
    default:
      return "beklemede";
  }
}

/**
 * Bir gruba geçiş yapılırken hangi detay duruma yazılacak?
 * (Kullanıcı "Kesim" seçti → backend "kesimde" yazar)
 */
export function gruptanIlkDuruma(grup: AsamaGrubu): KurbanKesimDurumu {
  switch (grup) {
    case "beklemede":
      return "beklemede";
    case "vekalet":
      return "vekalet_bekliyor";
    case "kesim":
      return "kesimde";
    case "parcalama":
      return "parcalama";
    case "tartim":
      return "tartimda";
    case "teslim":
      return "teslime_hazir";
    case "tamamlandi":
      return "tamamlandi";
    case "iptal":
      return "iptal";
  }
}

/**
 * Bir sonraki grup (UI'da "İlerlet" butonu için).
 */
export function sonrakiGrup(mevcut: AsamaGrubu): AsamaGrubu | null {
  if (mevcut === "iptal" || mevcut === "tamamlandi") return null;
  const idx = ASAMA_GRUBU_SIRASI.indexOf(mevcut);
  if (idx === -1 || idx === ASAMA_GRUBU_SIRASI.length - 1) return null;
  return ASAMA_GRUBU_SIRASI[idx + 1] ?? null;
}

/**
 * Önceki grup (geri al).
 */
export function oncekiGrup(mevcut: AsamaGrubu): AsamaGrubu | null {
  const idx = ASAMA_GRUBU_SIRASI.indexOf(mevcut);
  if (idx <= 0) return null;
  return ASAMA_GRUBU_SIRASI[idx - 1] ?? null;
}

/**
 * Her aşama grubunun varsayılan ilerleme yüzdesi (slider başlangıç).
 */
export const GRUP_VARSAYILAN_YUZDE: Record<AsamaGrubu, number> = {
  beklemede: 0,
  vekalet: 15,
  kesim: 35,
  parcalama: 55,
  tartim: 75,
  teslim: 90,
  tamamlandi: 100,
  iptal: 0,
};

/**
 * 12 detay duruma karşılık gelen otomatik yüzdeler.
 * kurbanAsamaGuncelle() her aşama geçişinde bu değeri yazar.
 * Personel/admin sliderdan ince ayar yapabilir (override).
 */
export const DURUM_VARSAYILAN_YUZDE: Record<string, number> = {
  beklemede: 0,
  vekalet_bekliyor: 15,
  siradaki: 20,
  hazirlik: 30,
  kesimde: 40,
  deri_yuzme: 45,
  parcalama: 55,
  tartimda: 75,
  paketleme: 85,
  teslime_hazir: 90,
  tamamlandi: 100,
  iptal: 0,
};

/**
 * SPRINT-12: TV ana ekranı 4 sütun gruplaması.
 * (Kontrol panelinin 6 grup yapısından farklı — TV görsel referansına göre)
 *
 *   Sıradakiler:    beklemede + hazirlik + siradaki
 *   Kesimdekiler:   vekalet_bekliyor + kesimde + deri_yuzme
 *   Parçalamada:    parcalama + tartimda
 *   Teslime Hazır:  paketleme + teslime_hazir
 *
 * `tamamlandi` ve `iptal` ekrana gelmez (sadece KPI sayımı).
 */
export type TvSutunGrubu =
  | "siradakiler"
  | "kesimdekiler"
  | "parcalamada"
  | "teslimeHazir";

export function tvSutunaGrupla(durum: string): TvSutunGrubu | null {
  switch (durum) {
    case "beklemede":
    case "hazirlik":
    case "siradaki":
      return "siradakiler";
    case "vekalet_bekliyor":
    case "kesimde":
    case "deri_yuzme":
      return "kesimdekiler";
    case "parcalama":
    case "tartimda":
      return "parcalamada";
    case "paketleme":
    case "teslime_hazir":
      return "teslimeHazir";
    default:
      return null;
  }
}
