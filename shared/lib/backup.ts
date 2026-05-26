/**
 * SQLite veritabanı yedekleme.
 *
 * SPRINT-P1: WAL-safe yedek için SQLite'ın `VACUUM INTO` komutu kullanılır.
 * Bu komut WAL mode'da aktif yazma sırasında bile atomik tutarlı yedek üretir
 * (eski `fs.copyFileSync` WAL ile bozuk yedek üretebilirdi).
 *
 * NOT: Sadece sunucu tarafında çalışır (fs erişimi gerekir).
 */

import fs from "node:fs";
import path from "node:path";
import { dosyaTarihi } from "./tarih";
import { prisma } from "./prisma";

function dbDosyaYolu(): string {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/tilbe.db";
  if (!dbUrl.startsWith("file:")) {
    throw new Error(
      `Backup desteklemez: ${dbUrl} (sadece SQLite file: protokolü)`,
    );
  }
  const rel = dbUrl.slice("file:".length);
  return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
}

const DB_YOL = dbDosyaYolu();
const DB_AD = path.basename(DB_YOL, ".db");
const YEDEK_KLASOR = path.join(process.cwd(), "backups");
const MAX_YEDEK_GUN = 30;
const MAX_YEDEK_SAYI = 50; // En son 50 yedeği tut

export interface YedekSonuc {
  basarili: boolean;
  yedekYolu?: string;
  hata?: string;
  boyutKB?: number;
}

/**
 * SQLite veritabanını yedekler.
 *
 * `VACUUM INTO` komutu kullanılır — WAL mode'da aktif yazma sırasında bile
 * atomik tutarlı yedek üretir. Dosya kopya değil, defragment edilmiş yeni
 * SQLite veritabanıdır (bütünlük garantili).
 */
export async function yedekAl(neden = "manuel"): Promise<YedekSonuc> {
  try {
    if (!fs.existsSync(DB_YOL)) {
      return { basarili: false, hata: `DB dosyası bulunamadı: ${DB_YOL}` };
    }

    if (!fs.existsSync(YEDEK_KLASOR)) {
      fs.mkdirSync(YEDEK_KLASOR, { recursive: true });
    }

    const tarih = dosyaTarihi();
    const dosyaAdi = `${DB_AD}-${tarih}-${neden}.db`;
    const yedekYolu = path.join(YEDEK_KLASOR, dosyaAdi);

    // VACUUM INTO ile WAL-safe yedek (SQLite 3.27+).
    // String concat zorunlu çünkü VACUUM INTO parametre placeholder kabul etmiyor.
    // Yedek dosya adı server-side oluşturulduğu için SQL injection riski yok.
    const guvenliYol = yedekYolu.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${guvenliYol}'`);

    if (!fs.existsSync(yedekYolu)) {
      return { basarili: false, hata: "Yedek dosyası oluşmadı" };
    }

    const stat = fs.statSync(yedekYolu);
    if (stat.size < 1024) {
      return { basarili: false, hata: `Yedek dosyası çok küçük: ${stat.size} byte` };
    }

    eskiYedekleriTemizle();

    return {
      basarili: true,
      yedekYolu,
      boyutKB: Math.round(stat.size / 1024),
    };
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : "Bilinmeyen hata";
    console.error("[backup] Yedek alma hatası:", hata);
    return { basarili: false, hata: mesaj };
  }
}

function eskiYedekleriTemizle(): void {
  try {
    if (!fs.existsSync(YEDEK_KLASOR)) return;

    const dosyalar = fs
      .readdirSync(YEDEK_KLASOR)
      .filter((ad) => ad.endsWith(".db"))
      .map((ad) => {
        const yol = path.join(YEDEK_KLASOR, ad);
        const stat = fs.statSync(yol);
        return { ad, yol, mtimeMs: stat.mtimeMs };
      });

    const simdi = Date.now();
    const eskiSinirMs = MAX_YEDEK_GUN * 24 * 60 * 60 * 1000;

    // 1) Çok eski yedekleri sil (30+ gün)
    for (const d of dosyalar) {
      if (simdi - d.mtimeMs > eskiSinirMs) {
        try {
          fs.unlinkSync(d.yol);
        } catch {
          /* sessiz geç */
        }
      }
    }

    // 2) Sayı sınırı — son 50 tanesini koru
    const kalanlar = fs
      .readdirSync(YEDEK_KLASOR)
      .filter((ad) => ad.endsWith(".db"))
      .map((ad) => {
        const yol = path.join(YEDEK_KLASOR, ad);
        return { yol, mtimeMs: fs.statSync(yol).mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (kalanlar.length > MAX_YEDEK_SAYI) {
      for (const d of kalanlar.slice(MAX_YEDEK_SAYI)) {
        try {
          fs.unlinkSync(d.yol);
        } catch {
          /* sessiz geç */
        }
      }
    }
  } catch (hata) {
    console.error("[backup] Eski yedek temizleme hatası:", hata);
  }
}

export interface YedekDosya {
  dosyaAdi: string;
  tarih: Date;
  boyutKB: number;
  yol: string;
}

export function yedekleriListele(): YedekDosya[] {
  try {
    if (!fs.existsSync(YEDEK_KLASOR)) return [];

    return fs
      .readdirSync(YEDEK_KLASOR)
      .filter((ad) => ad.endsWith(".db"))
      .map((ad) => {
        const yol = path.join(YEDEK_KLASOR, ad);
        const stat = fs.statSync(yol);
        return {
          dosyaAdi: ad,
          tarih: stat.mtime,
          boyutKB: Math.round(stat.size / 1024),
          yol,
        };
      })
      .sort((a, b) => b.tarih.getTime() - a.tarih.getTime());
  } catch (hata) {
    console.error("[backup] Yedek listeleme hatası:", hata);
    return [];
  }
}

export interface SonYedekBilgi {
  varMi: boolean;
  dosyaAdi: string | null;
  zaman: Date | null;
  boyutKB: number | null;
  yasGecmisDk: number | null;
}

/**
 * En son alınan yedeğin meta bilgisi — dashboard yedek sağlık kartı için.
 */
export function sonYedekBilgisi(): SonYedekBilgi {
  const liste = yedekleriListele();
  if (liste.length === 0) {
    return {
      varMi: false,
      dosyaAdi: null,
      zaman: null,
      boyutKB: null,
      yasGecmisDk: null,
    };
  }
  const son = liste[0]!;
  const yasGecmisDk = Math.floor(
    (Date.now() - son.tarih.getTime()) / 60000,
  );
  return {
    varMi: true,
    dosyaAdi: son.dosyaAdi,
    zaman: son.tarih,
    boyutKB: son.boyutKB,
    yasGecmisDk,
  };
}

export interface YedekDogrulamaSonuc {
  gecerliMi: boolean;
  tabloSayisi: number | null;
  hata: string | null;
}

/**
 * Yedek dosyasını doğrula — açılabilir mi, tablolar yerinde mi?
 *
 * Prisma'nın `PrismaClient` üzerinden ayrı bir SQLite dosyasını sorgulamak
 * için direkt SQLite query yapamayız (DATABASE_URL sabit). Bu yüzden basit
 * dosya kontrolü yapıyoruz: dosya var mı, boyut yeterli mi.
 *
 * Tam tablo sayısı doğrulaması için sqlite3 CLI gerekir (opsiyonel).
 */
export function yedekDogrula(yedekYolu: string): YedekDogrulamaSonuc {
  try {
    if (!fs.existsSync(yedekYolu)) {
      return { gecerliMi: false, tabloSayisi: null, hata: "Dosya bulunamadı" };
    }
    const stat = fs.statSync(yedekYolu);
    if (stat.size < 1024) {
      return {
        gecerliMi: false,
        tabloSayisi: null,
        hata: `Dosya çok küçük: ${stat.size} byte`,
      };
    }

    // SQLite magic header kontrolü (ilk 16 byte "SQLite format 3\0")
    const fd = fs.openSync(yedekYolu, "r");
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    const magic = buf.toString("utf8", 0, 16);

    if (!magic.startsWith("SQLite format 3")) {
      return {
        gecerliMi: false,
        tabloSayisi: null,
        hata: "SQLite formatı değil (magic header eşleşmedi)",
      };
    }

    return { gecerliMi: true, tabloSayisi: null, hata: null };
  } catch (hata) {
    return {
      gecerliMi: false,
      tabloSayisi: null,
      hata: hata instanceof Error ? hata.message : String(hata),
    };
  }
}
