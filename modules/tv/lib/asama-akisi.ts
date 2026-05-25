/**
 * Kesim aşama akışı — Kurban ve Hisse seviyesinde geçişler.
 *
 * MANTIK:
 *  - Tartıma kadar TÜM hisseler kurbanla birlikte hareket eder
 *    (Kurban.kesimDurumu güncellenir → hisselere de yansır)
 *  - Paketleme'den sonra HER HİSSE ayrı (Hisse.paketDurumu kullanılır)
 *
 * Geçişler:
 *  beklemede → vekalet_bekliyor → siradaki → hazirlik →
 *  kesimde → deri_yuzme → parcalama → tartimda → paketleme →
 *  teslime_hazir → tamamlandi
 */

export type KurbanKesimDurumu =
  | "beklemede"
  | "vekalet_bekliyor"
  | "siradaki"
  | "hazirlik"
  | "kesimde"
  | "deri_yuzme"
  | "parcalama"
  | "tartimda"
  | "paketleme"
  | "teslime_hazir"
  | "tamamlandi"
  | "iptal";

export const ASAMA_SIRASI: KurbanKesimDurumu[] = [
  "beklemede",
  "vekalet_bekliyor",
  "siradaki",
  "hazirlik",
  "kesimde",
  "deri_yuzme",
  "parcalama",
  "tartimda",
  "paketleme",
  "teslime_hazir",
  "tamamlandi",
];

export const ASAMA_ETIKETLERI: Record<KurbanKesimDurumu, string> = {
  beklemede: "Beklemede",
  vekalet_bekliyor: "Vekalet Bekliyor",
  siradaki: "Sıradaki",
  hazirlik: "Kesim Hazırlık",
  kesimde: "Kesim",
  deri_yuzme: "Deri Yüzme",
  parcalama: "Parçalama",
  tartimda: "Tartım",
  paketleme: "Paketleme",
  teslime_hazir: "Teslime Hazır",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const ASAMA_EMOJI: Record<KurbanKesimDurumu, string> = {
  beklemede: "⏳",
  vekalet_bekliyor: "📜",
  siradaki: "👥",
  hazirlik: "🔧",
  kesimde: "🔪",
  deri_yuzme: "✂️",
  parcalama: "🥩",
  tartimda: "⚖️",
  paketleme: "📦",
  teslime_hazir: "✅",
  tamamlandi: "🎉",
  iptal: "❌",
};

/**
 * Mevcut aşamanın bir sonraki aşamasını döndürür.
 * Son aşamada veya iptalse null.
 */
export function sonrakiAsama(
  mevcut: KurbanKesimDurumu,
): KurbanKesimDurumu | null {
  if (mevcut === "iptal" || mevcut === "tamamlandi") return null;
  const idx = ASAMA_SIRASI.indexOf(mevcut);
  if (idx === -1 || idx === ASAMA_SIRASI.length - 1) return null;
  return ASAMA_SIRASI[idx + 1];
}

/**
 * Kurban seviyesi mi yoksa hisse seviyesi mi?
 * Paketleme'den itibaren her hisse ayrı yönetilir.
 */
export function hisseSeviyesindeMi(durum: KurbanKesimDurumu): boolean {
  return durum === "paketleme" || durum === "teslime_hazir" || durum === "tamamlandi";
}

/**
 * Belirli bir aşamada hangi "asama" metni gösterilmeli?
 * (Eski Hisse.asama alanı için)
 */
export const DURUMA_GORE_ASAMA: Record<KurbanKesimDurumu, string | null> = {
  beklemede: null,
  vekalet_bekliyor: null,
  siradaki: null,
  hazirlik: "Hazırlık",
  kesimde: "Kesim",
  deri_yuzme: "Deri Yüzme",
  parcalama: "Parçalama",
  tartimda: "Tartım",
  paketleme: "Paketleme",
  teslime_hazir: "Teslim",
  tamamlandi: null,
  iptal: null,
};

/**
 * Aşamaya geçildiğinde otomatik tetiklenecek bildirim şablonu kodu.
 * (FAZ 8 WhatsApp şablonları + push şablonları)
 */
export const ASAMA_BILDIRIM_KODU: Record<KurbanKesimDurumu, string | null> = {
  beklemede: null,
  vekalet_bekliyor: null,
  siradaki: "sira_yaklasti",
  hazirlik: null,
  kesimde: "kesim_basladi",
  deri_yuzme: null,
  parcalama: null,
  tartimda: "tartim_basladi",
  paketleme: null,
  teslime_hazir: "paket_hazir",
  tamamlandi: null,
  iptal: null,
};
