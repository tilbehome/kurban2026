/**
 * Audit log servisi — MIMARI.md §12.1
 *
 * Tüm kritik işlemler (CRUD, giriş/çıkış, kasa, yedek) bu fonksiyonla loglanır.
 * Hata bayrak vermez — log düşse bile iş akışı kesilmez.
 */

import { prisma } from "./prisma";
import { log } from "./log";

export type AuditEylem =
  | "olustur"
  | "guncelle"
  | "sil"
  | "geri-yukle"
  | "giris"
  | "cikis"
  | "giris-basarisiz"
  | "odeme"
  | "odeme-iptal"
  | "yedek"
  | "yedek-geri-yukle"
  | "hisse-atama"
  | "ayar-degisti";

export interface AuditVeri {
  eylem: AuditEylem;
  /** Etkilenen model adı (Musteri, Odeme vb.) — opsiyonel */
  model?: string;
  /** Etkilenen kayıt ID — opsiyonel */
  kayitId?: string;
  /** Eylemi yapan kullanıcı ID — opsiyonel (anonymous giriş için null) */
  kullaniciId?: string | null;
  /** İstemci IP (request header'dan) */
  ip?: string;
  /** Ek detaylar (önceki/sonraki değer, tutar vs.) — JSON'a dönüşür */
  detaylar?: Record<string, unknown>;
}

/**
 * Audit log kaydı oluştur.
 * Hatayı yutar (log düşse bile akış kesilmesin).
 */
export async function auditLog(veri: AuditVeri): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        eylem: veri.eylem,
        model: veri.model ?? null,
        kayitId: veri.kayitId ?? null,
        kullaniciId: veri.kullaniciId ?? null,
        ip: veri.ip ?? null,
        detaylar: veri.detaylar ? JSON.stringify(veri.detaylar) : null,
      },
    });
  } catch (e) {
    log.hata("[audit] Log kaydı oluşturulamadı", e, { eylem: veri.eylem });
  }
}

/** Request'ten IP çıkar (Next.js) */
export function ipCikar(req: Request): string | undefined {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}
