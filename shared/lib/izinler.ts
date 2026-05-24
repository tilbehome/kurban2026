/**
 * Granular izin sistemi — MIMARI.md §10.2
 *
 * Format: "<modul>.<eylem>"
 * Örnekler:
 *   - "musteriler.goruntule"
 *   - "musteriler.olustur"
 *   - "tahsilat.olustur"
 *   - "ayarlar.degistir"
 *
 * Admin "*" wildcard ile her şeyi yapabilir.
 */

import type { Rol, AuthOturum } from "@/shared/types/module.types";

export type Izin = string; // "musteriler.goruntule" gibi

const IZINLER: Record<Rol, Izin[]> = {
  admin: ["*"], // Her şey
  kasiyer: [
    // Müşteriler
    "musteriler.goruntule",
    "musteriler.olustur",
    "musteriler.guncelle",
    // Hayvanlar (kurbanlar)
    "hayvanlar.goruntule",
    "hayvanlar.olustur",
    "hayvanlar.guncelle",
    "hisseler.ata",
    // Tahsilat (kritik)
    "tahsilat.goruntule",
    "tahsilat.olustur",
    "dekont.bas",
    // Kasa
    "kasa.goruntule",
    "kasa.gider",
    "kasa.acilis",
    "kasa.kapanis",
    // Raporlar
    "raporlar.goruntule",
    "raporlar.excel",
    // Yedek
    "yedek.manuel",
  ],
  izleyici: [
    "musteriler.goruntule",
    "hayvanlar.goruntule",
    "tahsilat.goruntule",
    "kasa.goruntule",
    "raporlar.goruntule",
  ],
  misafir: [],
};

/**
 * Verilen oturumun belirli bir izne sahip olup olmadığını döner.
 *
 * @example
 *   if (!izinKontrol(oturum, "tahsilat.olustur")) {
 *     throw new YetkiHatası();
 *   }
 */
export function izinKontrol(
  oturum: Pick<AuthOturum, "rol"> | null | undefined,
  izin: Izin,
): boolean {
  if (!oturum) return false;
  const rolIzinleri = IZINLER[oturum.rol];
  if (!rolIzinleri) return false;
  if (rolIzinleri.includes("*")) return true;
  return rolIzinleri.includes(izin);
}

/** Birden fazla iznin **hepsine** sahip mi? */
export function izinKontrolHepsi(
  oturum: Pick<AuthOturum, "rol"> | null | undefined,
  ...izinler: Izin[]
): boolean {
  return izinler.every((i) => izinKontrol(oturum, i));
}

/** Birden fazla iznin **en az birine** sahip mi? */
export function izinKontrolHerhangi(
  oturum: Pick<AuthOturum, "rol"> | null | undefined,
  ...izinler: Izin[]
): boolean {
  return izinler.some((i) => izinKontrol(oturum, i));
}

/** Belirli bir rolün sahip olduğu tüm izinleri döner (debug için) */
export function rolIzinleri(rol: Rol): Izin[] {
  return IZINLER[rol] ?? [];
}

/** Eski permissions.ts ile geriye uyumluluk */
export function adminMi(rol: Rol | undefined): boolean {
  return rol === "admin";
}

export function kasiyerVeyaUstu(rol: Rol | undefined): boolean {
  if (!rol) return false;
  return rol === "admin" || rol === "kasiyer";
}
