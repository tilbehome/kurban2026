/**
 * @deprecated MIMARI.md §10.2 — `izinler.ts` kullan (granular izin).
 *
 * Bu dosya geriye uyumluluk için duruyor; içerik `izinler.ts`'ten re-export edilir.
 * Yeni kod `izinKontrol(oturum, 'modul.eylem')` kullanmalı.
 */

import type { Rol } from "@/shared/types/module.types";
import { ROL_HIYERARSI as ROL_HIY_SIRA } from "@/shared/types/module.types";

export { adminMi, kasiyerVeyaUstu } from "./izinler";

/** Verilen rol en az gereken role sahip mi? (eski API) */
export function rolYeterli(rol: Rol | undefined, gereken: Rol): boolean {
  if (!rol) return false;
  const rolIdx = ROL_HIY_SIRA.indexOf(rol);
  const gerIdx = ROL_HIY_SIRA.indexOf(gereken);
  if (rolIdx === -1 || gerIdx === -1) return false;
  // Hiyerarşi: ["admin", "kasiyer", "izleyici", "misafir"] — düşük index = yüksek yetki
  return rolIdx <= gerIdx;
}

/** Rol, izin verilen rollerden biri mi? */
export function rolIzni(rol: Rol | undefined, izinli: Rol[]): boolean {
  if (!rol) return false;
  return izinli.includes(rol);
}
