/**
 * Modül kayıt ve yükleyici.
 *
 * Her modül burada import edilir ve tumModuller dizisine eklenir.
 * Dinamik sayfa router'ı (app/(modules)/[...slug]/page.tsx) bu listeyi okur.
 */

import type { ModuleConfig, Rol } from "@/shared/types/module.types";

import { coreModule } from "@/modules/_core/module.config";
import { musterilerModule } from "@/modules/musteriler/module.config";
import { hayvanlarModule } from "@/modules/hayvanlar/module.config";
import { tahsilatModule } from "@/modules/tahsilat/module.config";
import { kasaModule } from "@/modules/kasa/module.config";
import { raporlarModule } from "@/modules/raporlar/module.config";

export const tumModuller: ModuleConfig[] = [
  coreModule,
  musterilerModule,
  hayvanlarModule,
  tahsilatModule,
  kasaModule,
  raporlarModule,
];

/** Aktif olan ve verilen role görünür modüller, sira'ya göre sıralı. */
export function aktifModuller(rol?: Rol): ModuleConfig[] {
  return tumModuller
    .filter((m) => m.aktif)
    .filter((m) => !rol || m.izinler.includes(rol))
    .sort((a, b) => a.sira - b.sira);
}

export function moduluBul(id: string): ModuleConfig | undefined {
  return tumModuller.find((m) => m.id === id);
}

/** Sidebar'da görünmesi gereken modüller (sayfası olan ve sidebarGoster ≠ false) */
export function sidebarModulleri(rol?: Rol): ModuleConfig[] {
  return aktifModuller(rol).filter((m) => {
    if (m.sidebarGoster === false) return false;
    return m.sayfalar.length > 0;
  });
}

let lifecycleCalisti = false;

/**
 * Tüm aktif modüllerin onYukle hook'larını çalıştırır.
 * Server startup'ta bir kez çağrılır (idempotent).
 */
export async function modulleriYukle(): Promise<void> {
  if (lifecycleCalisti) return;
  lifecycleCalisti = true;
  for (const m of tumModuller) {
    if (m.aktif && m.onYukle) {
      try {
        await m.onYukle();
      } catch (e) {
        console.error(`[module-loader] ${m.id}.onYukle hatası:`, e);
      }
    }
  }
}

interface RotaEslesme {
  modul: ModuleConfig;
  sayfa: ModuleConfig["sayfalar"][number];
  params: Record<string, string>;
}

/**
 * Verilen yolu (örn. "/tahsilat/musteri/5") aktif modüllerdeki sayfalarla eşleştir.
 * Dinamik segmentler [id] desteklenir.
 */
export function rotaEslesmesi(yol: string): RotaEslesme | null {
  const normalize = yol.replace(/\/$/, "") || "/";

  for (const modul of tumModuller) {
    if (!modul.aktif) continue;

    for (const sayfa of modul.sayfalar) {
      const eslesen = rotaEslestir(sayfa.yol, normalize);
      if (eslesen) {
        return { modul, sayfa, params: eslesen };
      }
    }
  }

  return null;
}

function rotaEslestir(
  desen: string,
  yol: string,
): Record<string, string> | null {
  const desenParcalar = desen.split("/").filter(Boolean);
  const yolParcalar = yol.split("/").filter(Boolean);

  if (desenParcalar.length !== yolParcalar.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < desenParcalar.length; i++) {
    const dp = desenParcalar[i]!;
    const yp = yolParcalar[i]!;

    if (dp.startsWith("[") && dp.endsWith("]")) {
      const ad = dp.slice(1, -1);
      params[ad] = decodeURIComponent(yp);
    } else if (dp !== yp) {
      return null;
    }
  }

  return params;
}
