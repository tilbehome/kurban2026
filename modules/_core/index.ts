/**
 * _core modülü — public API.
 * Diğer tüm modüllerin bağımlı olduğu çekirdek (auth, ayarlar, yedek, audit).
 *
 * NOT: Bu modül DOKUNULMAZ (CLAUDE.md kuralı).
 */

export {
  ayarOku,
  ayarYaz,
  ayarlariToplu,
  tumAyarlar,
} from "./ayarlar/ayar.service";
export type { AyarAnahtar } from "./ayarlar/ayar.service";

export { default as coreModule } from "./module.config";
