/**
 * İzin (yetkilendirme) kontrol yardımcıları.
 */

import type { Rol } from "@/shared/types/module.types";

const ROL_HIYERARSI: Record<Rol, number> = {
  misafir: 0,
  kasiyer: 1,
  admin: 2,
};

/** Verilen rol en az gereken role sahip mi? */
export function rolYeterli(rol: Rol | undefined, gereken: Rol): boolean {
  if (!rol) return false;
  return ROL_HIYERARSI[rol] >= ROL_HIYERARSI[gereken];
}

/** Rol, izin verilen rollerden biri mi? */
export function rolIzni(rol: Rol | undefined, izinli: Rol[]): boolean {
  if (!rol) return false;
  return izinli.includes(rol);
}

export function adminMi(rol: Rol | undefined): boolean {
  return rol === "admin";
}

export function kasiyerVeyaUstu(rol: Rol | undefined): boolean {
  return rolYeterli(rol, "kasiyer");
}
