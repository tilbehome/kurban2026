/**
 * Tahsilat modülü — public API.
 *
 * NOT: Bu modül KRİTİK. Dışarıdan değişiklik yapılmamalı.
 */

export type {
  BugunkuOzet,
  BugunkuTahsilatSatiri,
  MusteriTahsilatVerisi,
} from "./lib/tahsilat.service";

export {
  bugunkuOzet,
  bugunkuTahsilatlar,
  musteriTahsilatVerisi,
  sonrakiDekontNo,
} from "./lib/tahsilat.service";

export { default as tahsilatModule } from "./module.config";
