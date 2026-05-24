/**
 * Iron-session tabanlı sunucu oturumu.
 * cookies()'i her API/sayfada okuyup oturum verisine erişiyoruz.
 */

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import type { AuthOturum } from "@/shared/types/module.types";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    "SESSION_SECRET ortam değişkeni en az 32 karakter olmalı. .env dosyasını kontrol edin.",
  );
}

export interface SessionVerisi {
  oturum?: AuthOturum;
}

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: "tilbe-kurban-session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12 saat
  },
};

export async function getOturum() {
  const cookieStore = await cookies();
  return getIronSession<SessionVerisi>(cookieStore, sessionOptions);
}

/**
 * Aktif oturum — DEFENSIVE GUARD ile.
 *
 * Tarihsel sebep: Faz 1'de kullaniciId int (1,2,3) idi. MIMARI.md refactor'unda
 * cuid (string) yapıldı. Eski tarayıcılarda hâlâ int taşıyan cookie kalmış
 * olabilir — bu durumda Prisma "Expected String, provided Int" atıyordu.
 *
 * Burada bozuk format tespit edilirse oturum imha edilir → kullanıcı
 * /giris'e yönlendirilir, taze giriş ile cuid alır.
 */
export async function aktifOturum(): Promise<AuthOturum | null> {
  const session = await getOturum();
  const o = session.oturum;
  if (!o) return null;

  // GUARD: kullaniciId mutlaka string + cuid uzunluğu (cuid ~24-25 char)
  if (typeof o.kullaniciId !== "string" || o.kullaniciId.length < 10) {
    // Bozuk cookie — temizle, null dön (kullanıcı tekrar giriş yapar)
    session.destroy();
    return null;
  }

  return o;
}
