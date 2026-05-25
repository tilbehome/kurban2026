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
