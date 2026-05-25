/**
 * Şablon değişken çözücü — {adSoyad}, {kalanTutar}, {bayramGun} vs.
 *
 * Hem server'da (toplu önizleme) hem client'ta (canlı editör) çalışır.
 */

import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import type { HedefMusteri } from "../types";

const BAYRAM_TARIHI = new Date("2026-05-27T00:00:00+03:00");

export interface DegiskenContext {
  sirketAdi: string;
  sirketTel: string;
}

/** Bilinen tüm değişken anahtarları (UI için "değişken yapıştır" butonları) */
export const SABLON_DEGISKENLERI = [
  { anahtar: "{adSoyad}", aciklama: "Müşteri adı soyadı" },
  { anahtar: "{telefon}", aciklama: "Müşteri telefonu" },
  { anahtar: "{hisseSayisi}", aciklama: "Atanmış hisse sayısı" },
  { anahtar: "{kurbanNo}", aciklama: "İlk kurbanın kesim sırası" },
  { anahtar: "{toplamBedel}", aciklama: "Toplam hisse bedeli (₺)" },
  { anahtar: "{odenenTutar}", aciklama: "Ödenmiş toplam (₺)" },
  { anahtar: "{kalanTutar}", aciklama: "Kalan borç (₺)" },
  { anahtar: "{dekontNo}", aciklama: "Son dekont numarası" },
  { anahtar: "{bayramGun}", aciklama: "Bayrama kalan gün sayısı" },
  { anahtar: "{bugun}", aciklama: "Bugünün tarihi (24.05.2026)" },
  { anahtar: "{sirketAdi}", aciklama: "Şirket adı" },
  { anahtar: "{sirketTel}", aciklama: "Şirket telefonu" },
] as const;

/** Müşteri verisinden bayram, tarih, şirket değişkenlerini çözümle */
function tumDegiskenleri(
  musteri: HedefMusteri,
  ctx: DegiskenContext,
): Record<string, string> {
  const farkMs = BAYRAM_TARIHI.getTime() - Date.now();
  const bayramGun = Math.max(0, Math.ceil(farkMs / (1000 * 60 * 60 * 24)));

  return {
    "{adSoyad}": musteri.adSoyad,
    "{telefon}": musteri.telefon ?? "—",
    "{hisseSayisi}": musteri.hisseSayisi.toString(),
    "{kurbanNo}": musteri.kurbanNo ? `#${musteri.kurbanNo}` : "—",
    "{toplamBedel}": formatPara(musteri.toplamBedel),
    "{odenenTutar}": formatPara(musteri.odenenTutar),
    "{kalanTutar}": formatPara(musteri.kalanTutar),
    "{dekontNo}": musteri.dekontNo ?? "—",
    "{bayramGun}": bayramGun.toString(),
    "{bugun}": formatTarih(new Date()),
    "{sirketAdi}": ctx.sirketAdi,
    "{sirketTel}": ctx.sirketTel,
  };
}

/** Şablon metnindeki tüm değişkenleri müşteri verisi ile değiştir */
export function cozumle(
  metin: string,
  musteri: HedefMusteri,
  ctx: DegiskenContext,
): string {
  let sonuc = metin;
  const degiskenler = tumDegiskenleri(musteri, ctx);
  for (const [anahtar, deger] of Object.entries(degiskenler)) {
    // {} özel regex karakterleri — escape gerekiyor
    const escaped = anahtar.replace(/[{}]/g, "\\$&");
    sonuc = sonuc.replace(new RegExp(escaped, "g"), deger);
  }
  return sonuc;
}

/** Önizleme için sahte müşteri */
export const ORNEK_MUSTERI: HedefMusteri = {
  musteriId: "ornek",
  adSoyad: "Mehmet Yılmaz",
  bashar: "MY",
  telefon: "0532 123 4567",
  toplamBedel: 14000,
  odenenTutar: 7000,
  kalanTutar: 7000,
  hisseSayisi: 2,
  dekontNo: "TKR-2026-000125",
  kurbanNo: 17,
  etiketler: ["VIP"],
};
