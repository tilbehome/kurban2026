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

## Lint warning durumu

Son P0 doğrulaması: `pnpm lint` 0 hata, 38 warning.

Kategoriler:

- Düşük risk: kullanılmayan import/değişkenler.
- Düşük risk: kullanılmayan `eslint-disable` yorumları.
- Orta risk: sidebar ve placeholder alanlarının üretim menüsünde karmaşa oluşturması.

P0 engelleyici güvenlik/doğruluk warning görülmedi; ancak Faz 1.1’de warning bütçesi sıfıra indirilmeli.
