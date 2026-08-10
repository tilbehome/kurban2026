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

## Lint warning durumu

Son P0 doğrulaması: `pnpm lint` 0 hata, 38 warning.

Kategoriler:

- Düşük risk: kullanılmayan import/değişkenler.
- Düşük risk: kullanılmayan `eslint-disable` yorumları.
- Orta risk: sidebar ve placeholder alanlarının üretim menüsünde karmaşa oluşturması.

P0 engelleyici güvenlik/doğruluk warning görülmedi; ancak Faz 1.1’de warning bütçesi sıfıra indirilmeli.
