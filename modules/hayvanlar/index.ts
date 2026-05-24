/**
 * Hayvanlar (Kurbanlar) modülü — public API.
 */

export type { KurbanOzet } from "./lib/kurban.service";
export { kurbanlariListele, kurbanDetayi } from "./lib/kurban.service";
export { default as hayvanlarModule } from "./module.config";
