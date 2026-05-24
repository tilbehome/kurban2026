/**
 * Kasa modülü — public API.
 */

export type {
  GunlukKasaRapor,
  KasaHareketSatiri,
} from "./lib/kasa.service";

export { gunlukRapor } from "./lib/kasa.service";
export { default as kasaModule } from "./module.config";
