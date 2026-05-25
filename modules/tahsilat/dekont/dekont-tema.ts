/**
 * Dekont (makbuz) tema sabitleri — gri tonlu, A4 yazdırılabilir.
 *
 * Image 2 referansından: toner tasarrufu, renkli vurgu minimum
 * (sadece logo + "Ödeme Alındı" check).
 */

export const DEKONT_RENKLERI = {
  primary: "#1a1a1a", // siyah/koyu gri — başlıklar, satırlar
  secondary: "#4a4a4a", // gri — alt metin
  tertiary: "#9a9a9a", // açık gri — kenarlar
  background: "#ffffff", // beyaz
  surface: "#f9f9f9", // çok açık gri — kart arka plan
  accent: "#e0e0e0", // bölücüler
  // Marka aksanı — minimum (logo + onay tick)
  marka: "#DE0B1E",
  yesil: "#16a34a",
} as const;

export const DEKONT_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
