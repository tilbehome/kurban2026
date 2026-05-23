/**
 * SQLite veritabanı yedekleme.
 * Her kritik işlemde (ödeme alma) + saatlik cron + manuel olarak tetiklenir.
 *
 * NOT: Sadece sunucu tarafında çalışır (fs erişimi gerekir).
 */

import fs from "node:fs";
import path from "node:path";
import { dosyaTarihi } from "./tarih";

const DB_YOL = path.join(process.cwd(), "prisma", "tilbe.db");
const YEDEK_KLASOR = path.join(process.cwd(), "backups");
const MAX_YEDEK_GUN = 30;

export interface YedekSonuc {
  basarili: boolean;
  yedekYolu?: string;
  hata?: string;
  boyutKB?: number;
}

export async function yedekAl(neden = "manuel"): Promise<YedekSonuc> {
  try {
    if (!fs.existsSync(DB_YOL)) {
      return { basarili: false, hata: `DB dosyası bulunamadı: ${DB_YOL}` };
    }

    if (!fs.existsSync(YEDEK_KLASOR)) {
      fs.mkdirSync(YEDEK_KLASOR, { recursive: true });
    }

    const tarih = dosyaTarihi();
    const dosyaAdi = `tilbe-${tarih}-${neden}.db`;
    const yedekYolu = path.join(YEDEK_KLASOR, dosyaAdi);

    fs.copyFileSync(DB_YOL, yedekYolu);
    const stat = fs.statSync(yedekYolu);

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
    const simdi = Date.now();
    const eskiSinir = MAX_YEDEK_GUN * 24 * 60 * 60 * 1000;

    const dosyalar = fs.readdirSync(YEDEK_KLASOR);
    for (const ad of dosyalar) {
      if (!ad.endsWith(".db")) continue;
      const yol = path.join(YEDEK_KLASOR, ad);
      const stat = fs.statSync(yol);
      if (simdi - stat.mtimeMs > eskiSinir) {
        fs.unlinkSync(yol);
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
