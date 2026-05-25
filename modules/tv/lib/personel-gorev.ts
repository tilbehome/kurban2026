/**
 * Personel görev tanımları — sahaya çıkmış personeli rol bazlı filtreler.
 *
 * Kullanici.gorev alanı:
 *   "vekalet" | "kesim" | "tartim" | "paketleme" | "teslim" | null (genel)
 *
 * Her görev kendi aşama setini gösterir, görev bittiğinde sonraki personelin
 * listesine düşer.
 */

export type PersonelGorev =
  | "genel"
  | "vekalet"
  | "kesim"
  | "tartim"
  | "paketleme"
  | "teslim";

export const PERSONEL_GOREVLERI: PersonelGorev[] = [
  "genel",
  "vekalet",
  "kesim",
  "tartim",
  "paketleme",
  "teslim",
];

export const GOREV_ETIKETLERI: Record<PersonelGorev, string> = {
  genel: "Hepsi",
  vekalet: "Vekalet",
  kesim: "Kasap",
  tartim: "Tartım",
  paketleme: "Paketleme",
  teslim: "Teslim",
};

export const GOREV_KISA: Record<PersonelGorev, string> = {
  genel: "Genel",
  vekalet: "Vekalet Alan",
  kesim: "Kasap",
  tartim: "Tartım Personeli",
  paketleme: "Paketleyici",
  teslim: "Teslim Personeli",
};

/** Bu görevin sorumlu olduğu Kurban.kesimDurumu değerleri. */
export const GOREV_ASAMALARI: Record<PersonelGorev, string[]> = {
  vekalet: ["vekalet_bekliyor"],
  kesim: ["siradaki", "hazirlik", "kesimde", "deri_yuzme", "parcalama"],
  tartim: ["tartimda"],
  paketleme: ["paketleme"],
  teslim: ["teslime_hazir", "tamamlandi"],
  genel: [
    "vekalet_bekliyor",
    "siradaki",
    "hazirlik",
    "kesimde",
    "deri_yuzme",
    "parcalama",
    "tartimda",
    "paketleme",
    "teslime_hazir",
  ],
};

export function gorevGecerliMi(deger: string | null | undefined): PersonelGorev {
  if (!deger) return "genel";
  return (PERSONEL_GOREVLERI as string[]).includes(deger)
    ? (deger as PersonelGorev)
    : "genel";
}
