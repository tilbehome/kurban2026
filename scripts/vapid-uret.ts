/**
 * VAPID anahtarları üretici — bir kerelik script.
 *
 * Çalıştır:  pnpm tsx scripts/vapid-uret.ts
 *
 * Çıktıyı .env dosyasına ekle (manual veya `>> .env`).
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY = VAPID_PUBLIC_KEY ile aynı değerdir.
 */

import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("# VAPID anahtarları — " + new Date().toISOString());
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@tilbehome.com`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
