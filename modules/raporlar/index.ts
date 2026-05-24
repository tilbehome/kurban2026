/**
 * Raporlar modülü — public API.
 */

export type {
  BorcluSatir,
  KurbanRaporSatir,
} from "./lib/rapor.service";

export { borclular, kurbanRaporu } from "./lib/rapor.service";
export { default as raporlarModule } from "./module.config";
