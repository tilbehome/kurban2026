/**
 * Modül kayıt ve yükleyici.
 *
 * Her modül burada import edilir ve tumModuller dizisine eklenir.
 * Dinamik sayfa router'ı (app/(modules)/[...slug]/page.tsx) bu listeyi okur.
 */

import type { ModuleConfig, Rol } from "@/shared/types/module.types";
import { TENANT_MODULE_AUTHORIZATION_MANIFESTS, FAZ_7_10_AUTHORIZATION_MANIFESTS, type ModuleAuthorizationManifest } from "@tilbecore/tenant-core";

import { coreModule } from "@/modules/_core/module.config";
import { managementModule } from "@/modules/management/module.config";
import { musterilerModule } from "@/modules/musteriler/module.config";
import { hayvanlarModule } from "@/modules/hayvanlar/module.config";
import { tahsilatModule } from "@/modules/tahsilat/module.config";
import { operationsModule } from "@/modules/operations/module.config";
import { kasaModule } from "@/modules/kasa/module.config";
import { raporlarModule } from "@/modules/raporlar/module.config";
import { besiModule } from "@/modules/besi/module.config";

export const tumModuller: ModuleConfig[] = [
  coreModule,
  managementModule,
  musterilerModule,
  hayvanlarModule,
  tahsilatModule,
  operationsModule,
  kasaModule,
  raporlarModule,
  besiModule,
];

/** Görsel olarak kapalı modüller dahil, tenant'a kaydedilebilir yetki sözleşmeleri. */
export function authorizationManifestleri(): readonly ModuleAuthorizationManifest[] {
  return [...TENANT_MODULE_AUTHORIZATION_MANIFESTS, ...FAZ_7_10_AUTHORIZATION_MANIFESTS, ...tumModuller.flatMap((modul) => modul.authorizationManifest ? [modul.authorizationManifest] : [])]
    .filter((manifest, index, manifests) => manifests.findIndex((aday) => aday.moduleId === manifest.moduleId && aday.version === manifest.version) === index);
}

export function authorizationManifestBul(moduleId: string): ModuleAuthorizationManifest | undefined {
  return authorizationManifestleri()
    .filter((manifest) => manifest.moduleId === moduleId)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    [0];
}

function listeEnv(anahtar: string): Set<string> | null {
  const ham = process.env[anahtar]?.trim();
  if (!ham) return null;
  return new Set(ham.split(",").map((item) => item.trim()).filter(Boolean));
}

function runtimeAcikMi(modul: ModuleConfig, moduller: readonly ModuleConfig[] = tumModuller): boolean {
  const enabledModules = listeEnv("TENANT_ENABLED_MODULES");
  if (enabledModules && !enabledModules.has(modul.id)) return false;

  const kural = modul.sozlesme?.runtimeKurali;
  if (!kural) return true;

  const enabledFlags = listeEnv("TENANT_FEATURE_FLAGS");
  const entitlements = listeEnv("TENANT_ENTITLEMENTS");
  if (kural.featureFlag && enabledFlags && !enabledFlags.has(kural.featureFlag)) return false;
  if (kural.entitlement && entitlements && !entitlements.has(kural.entitlement)) return false;

  return (modul.bagimliliklar ?? []).every((id) => {
    const bagimli = moduller.find((aday) => aday.id === id);
    return Boolean(bagimli?.aktif && runtimeAcikMi(bagimli, moduller));
  });
}

/** Aktif olan ve verilen role görünür modüller, sira'ya göre sıralı. */
export function aktifModuller(rol?: Rol): ModuleConfig[] {
  return tumModuller
    .filter((m) => m.aktif)
    .filter((m) => runtimeAcikMi(m))
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
    if (m.aktif && runtimeAcikMi(m) && m.onYukle) {
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
    if (!modul.aktif || !runtimeAcikMi(modul)) continue;

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
