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
    // 'lax' — same-origin POST'larda ve top-level GET'lerde cookie gönderir.
    // LAN üzerinden http://192.168.x.x:3000 ile çalışmak için yeterli.
    sameSite: "lax",
    // HTTP üzerinde LAN erişimi için secure FALSE olmalı.
    // Production'da HTTPS varsa SESSION_SECURE=true env ile açılır.
    secure: process.env.SESSION_SECURE === "true",
    // 7 gün — bayram operasyonu için tek girişle yeterli (kasiyer her gün giriş yapmasın)
    maxAge: 60 * 60 * 24 * 7,
    // Tüm route'larda geçerli
    path: "/",
    // domain BELİRTİLMİYOR — tarayıcı otomatik (localhost / 192.168.x.x / IP fark etmez)
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
