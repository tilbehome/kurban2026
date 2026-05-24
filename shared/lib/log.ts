/**
 * Yapısal loglama — MIMARI.md §12.3
 *
 * Console.log yerine bunu kullan. İleride Pino'ya geçilecek.
 */

type LogVeri = Record<string, unknown> | undefined;

function tarih(): string {
  return new Date().toISOString();
}

export const log = {
  bilgi(mesaj: string, veri?: LogVeri): void {
    console.log(`[BİLGİ ${tarih()}] ${mesaj}`, veri ?? "");
  },
  uyari(mesaj: string, veri?: LogVeri): void {
    console.warn(`[UYARI ${tarih()}] ${mesaj}`, veri ?? "");
  },
  hata(mesaj: string, hata?: unknown, veri?: LogVeri): void {
    console.error(`[HATA  ${tarih()}] ${mesaj}`, hata ?? "", veri ?? "");
  },
  basarili(mesaj: string, veri?: LogVeri): void {
    console.log(`[✓     ${tarih()}] ${mesaj}`, veri ?? "");
  },
  debug(mesaj: string, veri?: LogVeri): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG ${tarih()}] ${mesaj}`, veri ?? "");
    }
  },
};
