/**
 * SW (Service Worker) sürüm dosyası üretici — SPRINT-P1 İŞ 6.
 *
 * Build sonrası çalışır, public/sw-version.json oluşturur. İçinde
 * build zamanı ve sw.js içerik hash'i tutulur. Client periyodik
 * fetch ile bu dosyayı kontrol eder; değişmişse kullanıcıya
 * "Yeni sürüm hazır" toast'u gösterilir.
 *
 * Çalıştır: node scripts/sw-version-gen.mjs
 * (next.config içinden postbuild hook'u olarak da çağrılabilir)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const KOK = process.cwd();
const SW_YOLU = path.join(KOK, "public", "sw.js");
const CIKTI = path.join(KOK, "public", "sw-version.json");

function swHash() {
  if (!fs.existsSync(SW_YOLU)) {
    return null;
  }
  const icerik = fs.readFileSync(SW_YOLU);
  return crypto.createHash("sha256").update(icerik).digest("hex").slice(0, 16);
}

function main() {
  const hash = swHash();
  const veri = {
    version: hash ?? "no-sw",
    buildTime: new Date().toISOString(),
    note:
      "Service worker sürümü. Client bu dosyayı periyodik kontrol eder; " +
      "version alanı değişirse kullanıcıya güncelleme bildirimi gösterilir.",
  };
  fs.writeFileSync(CIKTI, JSON.stringify(veri, null, 2));
  console.log(`✓ sw-version.json yazıldı:`, veri);
}

main();
