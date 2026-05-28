/**
 * Tahsilat dagitim algoritmasi — saf fonksiyonlar.
 *
 * KUTSAL: Bu dosyadaki davranis musteri parasini belirler.
 * Degisiklikten once tum testler GREEN olmali.
 *
 * 3 dagitim modu:
 * - esit: tutari hisse sayisina bol, yuvarlama farki son hisseye eklenir
 * - sirayla: ilk hisseden baslayarak doldur, sonra ikinci, ...
 * - manuel: client'tan gelen hisseId -> tutar haritasini uygular
 *
 * Limit kontrolleri:
 * - Her hissenin kalan bakiyesini asma
 * - Sirayla'da artan tutar varsa hata firlat
 */

import { yuvarla } from "@/shared/lib/para";

export type DagitimYontemi = "esit" | "sirayla" | "manuel";

export interface DagitimHisseGirdisi {
  id: string;
  no: number;
  kalan: number;
}

export interface DagitimTahsisi {
  hisseId: string;
  tutar: number;
}

/**
 * Yontem secimi: Aktif > 1 ise "karisik", yoksa tek aktif kanali don.
 * Hicbiri yoksa "nakit" (default).
 */
export function belirleYontem(nakit: number, havale: number, kart: number): string {
  const aktif = [nakit > 0, havale > 0, kart > 0].filter(Boolean).length;
  if (aktif > 1) return "karisik";
  if (nakit > 0) return "nakit";
  if (havale > 0) return "havale";
  if (kart > 0) return "kart";
  return "nakit";
}

/**
 * Tahsilat tutarini hisselere dagit.
 *
 * @throws Error — Hisse kalanini asan bir dagitim olusursa veya sirayla'da
 *                 dagitilamayan fazlalik kalirsa.
 */
export function hisselereDagit(
  toplam: number,
  kalanlar: DagitimHisseGirdisi[],
  yontem: DagitimYontemi,
  manuel?: Record<string, number>,
): DagitimTahsisi[] {
  if (yontem === "manuel" && manuel) {
    return dagitManuel(kalanlar, manuel);
  }

  if (yontem === "sirayla") {
    return dagitSirayla(toplam, kalanlar);
  }

  return dagitEsit(toplam, kalanlar);
}

function dagitManuel(
  kalanlar: DagitimHisseGirdisi[],
  manuel: Record<string, number>,
): DagitimTahsisi[] {
  return kalanlar.map((k) => {
    const istenen = yuvarla(manuel[k.id] ?? 0);
    const maxIzin = Math.max(k.kalan, 0);
    if (istenen > maxIzin + 0.01) {
      throw new Error(
        `Hisse ${k.no} için ${istenen.toFixed(2)} TL girildi ama kalan sadece ${maxIzin.toFixed(2)} TL`,
      );
    }
    return { hisseId: k.id, tutar: istenen };
  });
}

function dagitSirayla(
  toplam: number,
  kalanlar: DagitimHisseGirdisi[],
): DagitimTahsisi[] {
  let kalan = toplam;
  const sonuc: DagitimTahsisi[] = [];
  for (const k of kalanlar) {
    if (kalan <= 0) {
      sonuc.push({ hisseId: k.id, tutar: 0 });
      continue;
    }
    const al = yuvarla(Math.min(kalan, Math.max(k.kalan, 0)));
    sonuc.push({ hisseId: k.id, tutar: al });
    kalan = yuvarla(kalan - al);
  }
  if (kalan > 0.01) {
    throw new Error(
      `Dağıtım hatası: ${kalan.toFixed(2)} TL fazla, hisselere yerleşmedi`,
    );
  }
  return sonuc;
}

function dagitEsit(
  toplam: number,
  kalanlar: DagitimHisseGirdisi[],
): DagitimTahsisi[] {
  const her = yuvarla(toplam / kalanlar.length);
  const sonuc = kalanlar.map((k) => ({ hisseId: k.id, tutar: her }));
  const fark = yuvarla(toplam - her * kalanlar.length);
  if (fark !== 0 && sonuc.length > 0) {
    sonuc[sonuc.length - 1]!.tutar = yuvarla(
      sonuc[sonuc.length - 1]!.tutar + fark,
    );
  }

  for (const t of sonuc) {
    const k = kalanlar.find((x) => x.id === t.hisseId);
    if (!k) continue;
    const maxIzin = Math.max(k.kalan, 0);
    if (t.tutar > maxIzin + 0.01) {
      throw new Error(
        `Eşit dağıtım Hisse ${k.no} kalanını aşıyor. Hisseye düşen: ${t.tutar.toFixed(2)} TL, Kalan: ${maxIzin.toFixed(2)} TL. "Sırayla" veya "Manuel" dağıtım deneyin.`,
      );
    }
  }

  return sonuc;
}
