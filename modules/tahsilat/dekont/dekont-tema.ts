/**
 * Dekont (makbuz) tema sabitleri — gri tonlu, A4 yazdırılabilir.
 *
 * SPRINT-DEKONT-V2: yeni tasarım için ek tonlar (kart arkaplan + çerçeve).
 * Marka kırmızısı sadece üst ince şerit; gerisi gri/siyah → toner tasarrufu.
 */

export const DEKONT_RENKLERI = {
  primary: "#1a1a1a", // siyah/koyu gri — başlıklar, ana metin
  secondary: "#525252", // gri — alt metin
  tertiary: "#9a9a9a", // açık gri — etiketler, kenarlar
  background: "#ffffff", // beyaz
  surface: "#fafafa", // çok açık gri — yumuşak vurgu
  accent: "#e5e5e5", // bölücüler / sınırlar
  // Marka aksanı — sadece üst şerit
  marka: "#DE0B1E",
  yesil: "#16a34a",
  // Yeni: kart yüzeyleri ve çerçeveleri
  kartArka: "#fefefe",
  kartCerceve: "#e8e8e8",
} as const;

export const DEKONT_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
