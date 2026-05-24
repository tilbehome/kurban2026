/**
 * WhatsApp modülü — paylaşılan tipler.
 */

export type SablonKategorisi = "tahsilat" | "bayram" | "kesim" | "genel";

export interface SablonKisa {
  id: string;
  ad: string;
  kategori: SablonKategorisi;
  icerik: string;
  aktifMi: boolean;
  varsayilan: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Toplu gönderim wizard'ında bir hedef müşteri */
export interface HedefMusteri {
  musteriId: string;
  adSoyad: string;
  bashar: string;
  telefon: string | null;
  toplamBedel: number;
  odenenTutar: number;
  kalanTutar: number;
  hisseSayisi: number;
  /** İlk hissenin TKR (dekont) numarası — varsa */
  dekontNo: string | null;
  /** İlk hissenin kurban kesim sırası */
  kurbanNo: number | null;
  etiketler: string[];
}

/** Filtre parametreleri */
export interface MusteriFiltresi {
  durum: "tum" | "borclu" | "tahsil-edildi" | "telefonsuz";
  etiket?: string;
  minBorc?: number;
  maxBorc?: number;
}

/** Wizard 4. adımda her bir hedef için gönderim durumu */
export type GonderimDurumu = "bekliyor" | "acildi" | "atlandi" | "hata";

export interface GonderimSatir {
  musteriId: string;
  adSoyad: string;
  telefon: string;
  mesaj: string;
  waLink: string;
  durum: GonderimDurumu;
  acilmaZamani: string | null; // ISO
}

/** Geçmiş kaydında JSON olarak tutulan hedef satırı */
export interface GecmisHedefSatir {
  musteriId: string;
  musteriAdSoyad: string;
  telefon: string;
  durum: GonderimDurumu;
  acilmaZamani: string | null;
}

export interface GonderimKisa {
  id: string;
  sablonId: string;
  sablonAd: string;
  sablonKategorisi: SablonKategorisi;
  baslamaTarihi: string;
  bitisTarihi: string | null;
  hedefSayisi: number;
  acilanSayisi: number;
  atlananSayisi: number;
  hataSayisi: number;
  telefonsuzSayisi: number;
  kullaniciId: string;
  kullaniciAdSoyad: string;
  not: string | null;
}

export interface GonderimDetay extends GonderimKisa {
  hedefler: GecmisHedefSatir[];
}

/** Kategori display etiketleri */
export const KATEGORI_ETIKETLERI: Record<
  SablonKategorisi,
  { ad: string; renk: string; emoji: string }
> = {
  tahsilat: {
    ad: "Tahsilat",
    renk: "bg-amber-100 text-amber-800 ring-amber-200",
    emoji: "💰",
  },
  bayram: {
    ad: "Bayram",
    renk: "bg-purple-100 text-purple-800 ring-purple-200",
    emoji: "🎉",
  },
  kesim: {
    ad: "Kesim",
    renk: "bg-blue-100 text-blue-800 ring-blue-200",
    emoji: "🔪",
  },
  genel: {
    ad: "Genel",
    renk: "bg-stone-100 text-stone-800 ring-stone-200",
    emoji: "📣",
  },
};

/** Şablon karakter limiti (WhatsApp) */
export const SABLON_KARAKTER_LIMIT = 4096;

/** Wizard adımları */
export type WizardAdim = 1 | 2 | 3 | 4;
