/**
 * Hayvanlar galerisi için client-side filtre + sıralama yardımcıları.
 */

import type { KurbanOzet } from "./kurban.service";

export type DurumKategori =
  | "hepsi"
  | "bos-hisseli"
  | "hazir"
  | "kesimde"
  | "bitti"
  | "iptal";

export type SiralaTip = "sira" | "bedel" | "kalan" | "ilerleme";

export type GorunumTip = "grid" | "liste";

const KESIM_OPERASYON_DURUMLARI = new Set([
  "siradaki",
  "hazirlik",
  "kesimde",
  "deri_yuzme",
  "parcalama",
  "tartimda",
  "paketleme",
]);

export function kategoriyeUygunMu(k: KurbanOzet, kat: DurumKategori): boolean {
  switch (kat) {
    case "hepsi":
      return true;
    case "iptal":
      return k.durum === "iptal";
    case "bitti":
      return (
        k.durum === "kesildi" ||
        k.durum === "teslim" ||
        k.kesimDurumu === "tamamlandi"
      );
    case "kesimde":
      return KESIM_OPERASYON_DURUMLARI.has(k.kesimDurumu);
    case "bos-hisseli":
      return k.bosHisseSayisi > 0 && k.durum !== "iptal";
    case "hazir":
      return (
        k.bosHisseSayisi === 0 &&
        k.durum === "aktif" &&
        !KESIM_OPERASYON_DURUMLARI.has(k.kesimDurumu) &&
        k.kesimDurumu !== "tamamlandi"
      );
    default:
      return true;
  }
}

export function kategoriSayilari(
  kurbanlar: KurbanOzet[],
): Record<DurumKategori, number> {
  return {
    hepsi: kurbanlar.length,
    "bos-hisseli": kurbanlar.filter((k) => kategoriyeUygunMu(k, "bos-hisseli"))
      .length,
    hazir: kurbanlar.filter((k) => kategoriyeUygunMu(k, "hazir")).length,
    kesimde: kurbanlar.filter((k) => kategoriyeUygunMu(k, "kesimde")).length,
    bitti: kurbanlar.filter((k) => kategoriyeUygunMu(k, "bitti")).length,
    iptal: kurbanlar.filter((k) => kategoriyeUygunMu(k, "iptal")).length,
  };
}

export function aramaUygunMu(k: KurbanOzet, sorgu: string): boolean {
  const q = sorgu.trim().toUpperCase();
  if (q.length === 0) return true;
  return k.aramaIndeks.includes(q);
}

export function sirala(kurbanlar: KurbanOzet[], tip: SiralaTip): KurbanOzet[] {
  const kopya = [...kurbanlar];
  switch (tip) {
    case "bedel":
      return kopya.sort((a, b) => b.satisBedeli - a.satisBedeli);
    case "kalan":
      return kopya.sort((a, b) => b.kalan - a.kalan);
    case "ilerleme":
      return kopya.sort((a, b) => b.ilerlemeYuzde - a.ilerlemeYuzde);
    case "sira":
    default:
      return kopya.sort((a, b) => a.kesimSirasi - b.kesimSirasi);
  }
}

export interface DurumRozetVerisi {
  etiket: string;
  renkSinif: string;
}

export function kurbanDurumRozeti(k: KurbanOzet): DurumRozetVerisi {
  if (k.durum === "iptal") {
    return { etiket: "İptal", renkSinif: "bg-slate-100 text-slate-600" };
  }
  if (k.kesimDurumu === "tamamlandi") {
    return { etiket: "Tamamlandı", renkSinif: "bg-emerald-100 text-emerald-700" };
  }
  if (KESIM_OPERASYON_DURUMLARI.has(k.kesimDurumu)) {
    return { etiket: "Kesimde", renkSinif: "bg-blue-100 text-blue-700" };
  }
  if (k.kalan <= 0 && k.bosHisseSayisi === 0) {
    return { etiket: "Tam Ödendi", renkSinif: "bg-green-100 text-green-700" };
  }
  if (k.bosHisseSayisi > 0) {
    return {
      etiket: `${k.bosHisseSayisi} Boş Hisse`,
      renkSinif: "bg-amber-100 text-amber-700",
    };
  }
  return { etiket: "Hazır", renkSinif: "bg-purple-100 text-purple-700" };
}

const AVATAR_RENKLERI = [
  "from-orange-400 to-red-600",
  "from-blue-400 to-indigo-600",
  "from-green-400 to-emerald-600",
  "from-purple-400 to-pink-600",
  "from-yellow-400 to-orange-600",
  "from-cyan-400 to-blue-600",
  "from-rose-400 to-red-600",
  "from-teal-400 to-cyan-600",
];

export function avatarRenk(ad: string): string {
  const hash = ad.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_RENKLERI[hash % AVATAR_RENKLERI.length]!;
}

export type HisseGrubuFiltre =
  | "tum"
  | "30-35"
  | "35-40"
  | "40-45"
  | "45-50"
  | "50-55"
  | "belirsiz";

export const HISSE_GRUBU_FILTRELERI: HisseGrubuFiltre[] = [
  "tum",
  "30-35",
  "35-40",
  "40-45",
  "45-50",
  "50-55",
  "belirsiz",
];

export const HISSE_GRUBU_ETIKET: Record<HisseGrubuFiltre, string> = {
  tum: "Tüm Kg",
  "30-35": "30-35 KG",
  "35-40": "35-40 KG",
  "40-45": "40-45 KG",
  "45-50": "45-50 KG",
  "50-55": "50-55 KG",
  belirsiz: "Belirsiz",
};

export function hisseGrubuUygunMu(
  k: KurbanOzet,
  filtre: HisseGrubuFiltre,
): boolean {
  if (filtre === "tum") return true;
  if (filtre === "belirsiz") return !k.hisseGrubu;
  return k.hisseGrubu === filtre;
}
