/**
 * Müşteri modülü ortak tipleri (Faz 4 tab sistemi için).
 */

export type MusteriTabId =
  | "genel"
  | "hisseler"
  | "tahsilatlar"
  | "vekaletler"
  | "notlar";

export interface MusteriTabTanim {
  id: MusteriTabId;
  ad: string;
  ikon: string; // lucide-react ikon adı
  yetki?: string; // gerekli izin
}

export const MUSTERI_TABS: MusteriTabTanim[] = [
  { id: "genel", ad: "Genel Bakış", ikon: "LayoutDashboard" },
  { id: "hisseler", ad: "Hisseler", ikon: "Beef" },
  {
    id: "tahsilatlar",
    ad: "Tahsilatlar",
    ikon: "Receipt",
    yetki: "tahsilat.goruntule",
  },
  {
    id: "vekaletler",
    ad: "Vekaletler",
    ikon: "FileCheck",
    yetki: "musteriler.vekalet.oku",
  },
  {
    id: "notlar",
    ad: "Notlar",
    ikon: "StickyNote",
    yetki: "musteriler.notlar.oku",
  },
];

export const NOT_RENKLERI = [
  { id: "bilgi", ad: "Bilgi", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  { id: "uyari", ad: "Uyarı", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  { id: "onemli", ad: "Önemli", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  { id: "hatirlat", ad: "Hatırlat", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
] as const;

export type NotRengi = (typeof NOT_RENKLERI)[number]["id"];
