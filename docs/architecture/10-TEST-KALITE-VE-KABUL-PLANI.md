# 10 — Test, Kalite ve Kabul Planı

## Mevcut test sınıflandırması

| Dosya | Tür | Kapsam |
|---|---|---|
| `shared/lib/para.test.ts` | Unit | Para parse/format/yuvarlama |
| `shared/lib/tarih.test.ts` | Unit | Tarih/saat yardımcıları |
| `modules/tahsilat/lib/dagitim.test.ts` | Unit | Tahsilat dağıtımı |
| `tests/saha-satis-route.test.ts` | Mock route | Yetki, atomiklik, idempotency, hata sızdırmama |
| `tests/toplu-atama-route.test.ts` | Mock route | Kısmi atama engeli |
| `tests/hisse-iptal-route.test.ts` | Mock route | Ödemeli hisse boşaltma engeli |
| `tests/vekalet-dosya.test.ts` | Unit/security | Path traversal ve dosya URL modeli |

Toplam: 84 test.

## Mock testlerin kanıtlayamadıkları

- Gerçek PostgreSQL transaction davranışı.
- Gerçek unique constraint ve eşzamanlı istek yarışı.
- Prisma connection pool/tenant routing.
- Gerçek dosya izinleri ve Windows/Linux path farkları.
- Browser/PWA davranışı.
- PDF font/RTL çıktısı.
- 5–20 cihaz LAN yükü.
- Elektrik/ağ kesintisi ve restore provası.

## Gerekli test katmanları

- Unit: domain value object ve durum makineleri.
- Application: use-case servisleri transaction mock/fake ile.
- Integration: gerçek PostgreSQL test DB.
- Concurrency: paralel satış/tahsilat/idempotency.
- Security: yetki, dosya, tenant izolasyonu, rate-limit.
- E2E: saha satış, tahsilat, kesim, teslim.
- UI/component: mobil kart, RTL, yüksek stres ekranı.
- PDF/Excel: font, encoding, belge snapshot.
- Migration: dry-run, rollback, checksum.
- Operasyon provası: 5–20 cihaz, LAN, internet kesintisi, yedekten dönüş.
- Playwright E2E: masaüstü, mobil, locale ve RTL varyantları.
- axe erişilebilirlik: kritik panel ve mobil ekranlarda otomatik kontrol.
- WCAG 2.2 AA: klavye, focus, kontrast, label, hata mesajı ve ekran okuyucu kabul listesi.
- OWASP ASVS Level 2: kimlik, oturum, yetki, dosya, hata, logging, tenant isolation ve destek erişimi.
- OpenTelemetry doğrulaması: traceId/requestId/auditId korelasyonu, metric ve log redaction.
- OpenFeature contract testi: firma/modül bazlı flag, rollout, kill switch ve audit.
- WAL/PITR/restore provası: yönetilen PostgreSQL için kurtarma hedefleri ve kanıt.

## Profesyonel PRO kalite kapıları

| PRO aralığı | Test odağı | Kabul kanıtı |
|---|---|---|
| `PRO-001..PRO-011` | Firma paneli, mobil görev, onay, import, arama, KVKK, eğitim ve erişilebilirlik | Playwright masaüstü/mobil, axe, yetki/audit testleri |
| `PRO-012..PRO-021` | Platform Süper Admin, provisioning, migration, kill switch, incident, export ve restore | Tenant isolation, backup/restore, security, platform audit |
| `PRO-022..PRO-029` | Observability, E2E, erişilebilirlik, passkey/MFA, ASVS, feature flag, WAL/PITR | CI raporu, güvenlik kontrol listesi, trace/log/metric ve restore kanıtı |

## Tenant izolasyon test planı

Birinci karar kaynağı: `docs/adr/ADR-0002-PLATFORM-TENANT-VERI-SINIRI-VE-ERISIM-STANDARDI.md`.

Bu plan Faz 2A kapanışında dokümante edilmiştir. Faz 2C paketleri gerçek PostgreSQL provisioning, doğrulanmış tenant request runtime, tenant-aware pool ve iki firma backup/restore izolasyon otomasyonunu eklemiştir. Legacy Next.js route’larının yeni runtime’a modül bazlı taşınması sonraki iş fazlarında sürer.

| Senaryo | Amaç | Test tipi | Kabul kanıtı | Planlanan faz |
|---|---|---|---|---|
| İki test firmasının ayrı DB kullanması | Her firmanın operasyon verisinin kendi tenant DB’sinde kaldığını kanıtlamak | PostgreSQL integration | Firma A ve Firma B aynı şema sürümünde ayrı bağlantı hedeflerine gider; çapraz sorgu yoktur | Faz 2C |
| Aynı kayıt ID’lerinin firmalar arasında karışmaması | Aynı integer/UUID değerleri olsa bile tenant boundary’nin veri sızdırmadığını göstermek | Integration + repository test | Firma A’daki kayıt ID’si Firma B session’ı ile okunamaz/güncellenemez | Faz 2C |
| Başka firmaya ait session/cookie reddi | Cookie veya session tenant kimliği resolved tenant ile uyuşmadığında fail-closed davranmak | Security route/E2E | Yanlış tenant cookie 401/403 güvenli hata döndürür; veri sızmaz | Faz 2B, Faz 2C |
| Bilinmeyen ve reserved subdomain reddi | Tenant slug çözümlemesini güvenli yapmak | Contract + route test | Bilinmeyen veya reserved subdomain tenant context üretmez | Faz 2B |
| Host header ve custom domain doğrulaması | Host spoofing ve doğrulanmamış custom domain riskini kapatmak | Security integration | Host header tenant kaydıyla eşleşmezse veya custom domain aktif değilse istek reddedilir | Faz 2B, Faz 2C |
| Yanlış `TenantDatabaseRef` güvenli reddi | Opaque DB referansının başka firmaya veya platform DB’ye kaymasını önlemek | Contract + integration | Referans tenant kimliğiyle mutabık değilse bağlantı açılmaz; secret gösterilmez | Faz 2C |
| `SupportSession` olmadan operasyon verisine erişememe | Süper Admin’in normal şartlarda firma verisini görememesini kanıtlamak | Security + authorization | SupportSession yokken müşteri/finans/vekalet/hisse/kesim/teslim verisi okunamaz | Faz 2B, Faz 2C |
| Log/hata/API yanıtında DB secret sızmaması | Secret ve connection string değerlerinin dışarı çıkmasını engellemek | Log redaction + route test | Hata yanıtı yalnız güvenli kod/requestId içerir; loglarda DB secret yoktur | Faz 2A, Faz 2C, Faz 12 |
| Tenant-aware connection pool ayrımı | Pool reuse nedeniyle yanlış DB’ye bağlanmayı engellemek | Integration + concurrency | Her tenant pool anahtarı tenant ve DB referansına bağlıdır; yanlış reuse fail-closed olur | Faz 2C |
| Firma bazlı backup/restore izolasyonu | Bir firmanın restore işleminin başka firmayı etkilememesini kanıtlamak | Backup/restore prova | Restore yalnız hedef tenant DB’de çalışır; platform metadata ve diğer tenant DB’ler değişmez | Faz 2C, Faz 15 |

Bu plan tamamlanmadan Platform DB, tenant routing veya firma başına PostgreSQL canlıya hazır sayılmaz.

### Faz 2C otomasyon kanıtı

`packages/database-tenant/tests/tenant-isolation.integration.test.ts` CI’daki PostgreSQL 16 tenant servisi üzerinde iki ayrı organization ve iki ayrı fiziksel tenant DB oluşturur. Aynı season/customer ID’lerinin firma verisini karıştırmadığını; eşzamanlı A/B web request context ve Prisma client’larının ayrıldığını; custom domain ile pasif/bilinmeyen/reserved host davranışını; yanlış session ve `TenantDatabaseRef` reddini; `SupportSession` olmadan platform erişiminin kapalı, geçerli süre/kapsam/onayla sınırlı ve auditli olduğunu doğrular. Aynı test gerçek `pg_dump`, status, checksum, iki ayrı geçici `pg_restore` doğrulaması, çapraz tenant yedek reddi, production restore’un kapalı kalması, secret redaction ve geçici DB/dizin temizliğini de kanıtlar.

`packages/tenant-runtime/tests/tenant-request-runtime.test.ts` request-local context, session/permission guard, public tracking ayrımı ve SupportSession davranışını; `packages/tenant-runtime/tests/tenant-connection-pool.test.ts` eşzamanlı pool reuse, tenantlar arası ref sahipliği, event/metric, idle kapatma ve shutdown davranışını doğrular. `packages/operations/src/tests/backup-restore.test.ts` tenant/ref bağı ile destructive olmayan restore planını; `apps/tenant-ops-cli/tests/input.test.ts` komut/secret/SQL argüman sınırını; `packages/database-tenant/tests/postgres-tenant-database.test.ts` identifier/SQL injection sınırını; `packages/provisioning/tests/tenant-provisioning.test.ts` idempotency, adım durumu, resume ve platform kaydı sonrası rollback yasağını doğrular.

Henüz tamamlanmayan kabul kanıtları: canlı sağlayıcıda WAL/PITR ayarı ve ölçülmüş RPO/RTO, legacy route’ların modül bazlı tenant runtime’a taşınması ve geniş browser E2E, canlı custom-domain/DNS/TLS/deployment, production restore onay akışı ve genel Kurban Günü Provası.

## Lint warning durumu

Son P0 doğrulaması: `pnpm lint` 0 hata, 38 warning.

Kategoriler:

- Düşük risk: kullanılmayan import/değişkenler.
- Düşük risk: kullanılmayan `eslint-disable` yorumları.
- Orta risk: sidebar ve placeholder alanlarının üretim menüsünde karmaşa oluşturması.

P0 engelleyici güvenlik/doğruluk warning görülmedi; ancak Faz 1.1’de warning bütçesi sıfıra indirilmeli.
