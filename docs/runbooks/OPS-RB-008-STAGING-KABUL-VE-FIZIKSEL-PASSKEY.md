# Staging Kabul ve Fiziksel Passkey Runbook’u

```yaml
id: OPS-RB-008
status: IMPLEMENTED_UNVERIFIED
owner: Operations-and-QA
source_role: staging_acceptance_runbook
source_of_truth: false
last_reviewed: 2026-08-13
verified_against_commit: not_applicable
```

Bu prosedür yalnız sentetik verili local HTTPS ve staging HTTPS içindir. Production domain, DNS, cookie, secret veya veritabanına uygulanmaz. `tilbecore.com` production hedefiyle karşılaşılırsa işlem durdurulur.

## Ön koşullar

1. Temiz çalışma ağacı ve değişmez release-adayı commit kaydedilir.
2. `infrastructure/staging/staging.env.example`, Git dışındaki `staging.env` dosyasına kopyalanır; yalnız `staging.tilbecore.com` veya `tilbecore.test` hostları kullanılır.
3. Altı secret, `infrastructure/staging/secrets/*.txt` olarak Git dışında ve en az 32 karakter/url-safe DB parola kuralıyla üretilir.
4. Docker Engine + Compose v2, Caddy’nin 80/443 erişimi, staging DNS yetkisi ve test cihazları hazırdır.
5. `pnpm staging:preflight` başarıyla çalışır. Bu adım production hostunu ve eksik/zayıf secretı reddeder; deployment başarısı değildir.

## Local güvenilir HTTPS

1. Compose proxy mount’u `Caddyfile.local` kullanacak güvenli local override ile başlatılır.
2. `tilbecore.test`, `console.tilbecore.test`, `demo.tilbecore.test` ve `sentetik-b.tilbecore.test` local DNS/hosts ile yalnız test sunucusuna çözülür.
3. Caddy local CA root sertifikası test makinesine kontrollü olarak aktarılır; Windows Trusted Root deposuna operatör onayıyla yüklenir. Sertifika fingerprint’i kanıta yazılır, private key yazılmaz.
4. Tarayıcı adres çubuğunda güvenilir HTTPS doğrulanır. Playwright `ignoreHTTPSErrors` veya HTTP üzerinden fiziksel passkey kabul edilmez.
5. `createPlatformWebAuthnConfig("local")` sonucu RP ID `tilbecore.test`, tek izinli platform origin `https://console.tilbecore.test` olmalıdır.

## Staging DNS/TLS ve deployment

1. Yetki varsa yalnız `staging.tilbecore.com`, `console.staging.tilbecore.com`, `demo.staging.tilbecore.com`, `sentetik-b.staging.tilbecore.com` kayıtları doğrulanır/oluşturulur.
2. DNS değişikliği öncesi/sonrası kayıt ve TTL kanıtı alınır. Production zone kayıtları okunabilir ama değiştirilmez.
3. Compose migration ve iki sentetik tenant provisioning işi tamamlanmadan uygulama trafiği açılmaz.
4. Caddy ACME sertifika zinciri, son kullanma tarihi ve HTTP→HTTPS yönlendirmesi doğrulanır. HSTS yalnız doğrulanmış staging hostlarında `max-age=86400` ile başlar.
5. Unknown/reserved host, platform/tenant cookie değişimi, yanlış tenant session, proxy health, graceful restart ve worker SIGTERM davranışı test edilir.
6. Aynı immutable artifact ile rollback/roll-forward ve smoke çalıştırılır. Gerçek sunucu/DNS erişimi yoksa bütün adımlar `BLOCKED` kalır.

## Fiziksel passkey sırası

Her adımda cihaz modeli, Windows sürümü, tarayıcı/sürüm, URL, RP ID, zaman, operatör ve sonuç EVD-006’ya yazılır. Kullanıcı etkileşimi olmadan `PASSED` yazılmaz.

1. Windows Hello veya gerçek authenticator ile yeni passkey kaydı; kullanıcı doğrulaması zorunlu.
2. Oturumu kapatıp kayıtlı passkey ile giriş.
3. Aynı credential’ı yanlış origin/hosttan kullanma denemesi; reddedildiğini doğrula.
4. Aynı challenge response’unu ikinci kez gönder; tek kullanımlık challenge reddi bekle.
5. Güvenlik ekranından passkey’i iptal et; sonraki girişin reddini doğrula.
6. Test cihazını ve bütün oturumları sonlandır; eski cookie ve queued sync reddedilmeli.
7. Bir recovery code’u bir kez kullan; ikinci kullanım reddedilmeli.
8. Kritik işlem yeniden doğrulamasını yap; süre dolduğunda tekrar doğrulama istenmeli.

İptal/dismiss senaryosu ayrıca çalıştırılır; kullanıcı passkey penceresini kapattığında kayıt veya giriş başarılı gösterilmemelidir. Token, cookie, recovery code, TOTP secret, ekran görüntüsü, video veya trace’e alınmaz.

## Fiziksel cihaz matrisi

| Hücre | Zorunlu kontrol | Sonuç başlangıcı |
|---|---|---|
| Windows masaüstü | Klavye, zoom/reflow, Windows Hello, session revoke | `NOT_RUN` |
| Android telefon | PWA install/update, kamera, storage, yeniden başlatma, ağ kesintisi | `NOT_RUN` |
| Tablet portrait/landscape | Orientation, büyük dokunma alanı, kamera | `NOT_RUN` |
| TV/büyük ekran | PII yokluğu, okunabilirlik, reconnect | `NOT_RUN` |
| QR/barkod kamera | İzin, doğru/yanlış/hasarlı/tekrar kod, manuel fallback | `NOT_RUN` |
| Yazıcı | UTF-8, QR ölçeği, spooler kesintisi, tekrar baskı nedeni | `NOT_RUN` |
| Terazi varsa | Birim, stabil okuma, timeout, kalibrasyon, manuel fallback | `NOT_RUN` |

Donanım yokluğu `BLOCKED`; planlı kapsam dışı terazi `SKIPPED_WITH_REASON` olabilir. Emülasyon fiziksel hücreyi `PASSED` yapmaz.

## Sonlandırma

Sentetik job/fixture kimlikleri ve temporary DB/backup sahipliği kaydedilir. Yalnız staging paketinin sahipliği kanıtlanan geçici hedefler temizlenir. Production destructive restore hiçbir koşulda bu runbook ile çalıştırılmaz.
