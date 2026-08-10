# TilbeCore – Kurban Takip Uygulama Takip Defteri

Birinci kaynak sözleşme: `docs/architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md`

Eski ana yol haritası, yeni ana belgeyle çelişmeyen tarihsel analiz kaynağıdır: `docs/archive/legacy/KURBAN2026-ANA-ANALIZ-VE-GELISTIRME-YOL-HARITASI.md`

Bu defter, yol haritasındaki fazları ve 68 iş akışını kod değişikliklerine bağlamak için tutulur. Bir iş “tamamlandı” sayılmadan önce kod, yetki, hata senaryosu, test ve kabul kanıtı birlikte değerlendirilir.

## Faz 1 / P0 — güvenlik ve teknik stabilizasyon

**Durum:** Tamamlandı ve `origin/main` dalına gönderildi.

**Commit:** `a6720378123f01fb4e19db3fd782a910f18c0acf`

| İş | Bağlı akışlar | Durum | Kanıt |
|---|---:|---|---|
| Eksik API yetkileri | 60, 61 | Tamamlandı | `hisseler.ata`, `kasa.*`, `musteriler.*`, `hayvanlar.olustur`, `musteriler.vekalet.oku` kontrolleri eklendi. |
| Hisse atama race condition | 20, 21, 25 | Tamamlandı | Tekli ve toplu atama transaction + `musteriId=null` koşullu update kullanıyor; kısmi toplu atama kaldırıldı. |
| Ödemeli hisse iptal kilidi | 27, 33, 35 | Tamamlandı | Aktif tahsilat varsa hisse boşaltma 409 ile reddediliyor. |
| Hassas veri ignore kuralları | 62, 63 | Tamamlandı | SQLite WAL/SHM, seed kopyaları, `public/uploads/`, `data/uploads/` ignore ediliyor. |
| Korumalı vekâlet dosyası | 38, 62 | Tamamlandı | Yeni dosyalar `data/uploads/vekalet` altına yazılıyor, DB fiziksel yol göstermiyor, okuma `/api/vekaletler/[id]` üzerinden yetkili ve no-store. |
| Eski vekâlet taşıma hazırlığı | 38, 62 | Tamamlandı | `scripts/migrate-vekalet-files.mjs` eklendi; varsayılan dry-run, `--apply` verilmeden veri değiştirmiyor. |
| Saha satış + kapora atomikliği | 21, 22, 29, 30 | Tamamlandı | `/api/saha-satis` atama + opsiyonel kaporayı tek transaction içinde yapıyor, `clientRequestId` ile idempotent tekrarları engelliyor. |
| Build/start güvenliği | 63, 64, 65 | Tamamlandı | `baslat.bat` build yoksa loop'a girmiyor; `pnpm build` başarılı. |
| Lint kalite kapısı | 14, 23.2, 24.12 | Tamamlandı | `pnpm lint` 0 hata ile tamamlanıyor; kalan 41 warning sınıflandırıldı. |
| Node/pnpm sabitleme | 63, 65 | Tamamlandı | `packageManager` ve `engines` eklendi. |
| UTF-8 tarama kapısı | 52 | Faz 1 altyapısı eklendi | `scripts/check-utf8.mjs` ve `pnpm check:utf8` eklendi; aktif kaynaklarda mojibake kontrolü testle sabitlendi. |
| Merkezi hata katalogu | 53, 60, 62 | Faz 1 altyapısı eklendi | `shared/lib/hata-katalogu.ts`, `shared/lib/api-hata.ts`, geriye uyumlu `hata` alanı ve yeni `kod/mesajAnahtari/parametreler/requestId` alanları eklendi. |
| i18n/dil paketi temeli | 54, 55 | Faz 1 altyapısı eklendi | `tr/en/ar` locale iskeleti, TR fallback, parametreli mesaj çözümü, RTL yön bilgisi ve TRY format yardımcıları eklendi. |
| Pilot route hata dönüşümü | 2, 21, 24, 29, 52, 53, 60, 61, 62 | Faz 1 pilot uygulandı | `/api/saha-satis`, `/api/hisseler/ata`, `/api/hisseler/toplu-ata`, `/api/hisseler/[id]/iptal`, `/api/vekaletler/[id]` merkezi hata yanıtına bağlandı. |
| Program genel kapsam envanteri | Tüm program | Faz 1 analiz checkpoint'i eklendi | `docs/architecture/14-PROGRAM-TAM-KAPSAM-ENVANTERI.md` ile repo genelindeki sayfa, API, bileşen, Prisma modeli, placeholder ve dönüşüm listeleri izlenebilir hale getirildi. |

## Son doğrulama komutları

| Komut | Sonuç |
|---|---|
| `pnpm exec tsc --noEmit` | Geçti |
| `pnpm test` | Geçti — 7 dosya, 84 test |
| `pnpm lint` | Geçti — 0 hata, 38 warning |
| `pnpm build` | Geçti — Next.js production build başarılı, `.next/BUILD_ID` üretildi |
| `node scripts/migrate-vekalet-files.mjs` | Geçti — dry-run, taşınacak/başarısız kayıt yok |
| Local HTTP smoke | Geçti — `GET /giris` 200, `GET /uploads/vekalet/test.png` 403 |

## Eklenen test kapsamı

- `/api/saha-satis`: yetkisiz erişim, başarılı kaporalı satış, eşzamanlı hisse dolması, satılmış hisse, eksik müşteri/hisse, tutar validasyonları, idempotent tekrar, gizli hata sızdırmama.
- `/api/hisseler/toplu-ata`: hisselerden biri doluysa hiçbir atama yazmama.
- `/api/hisseler/[id]/iptal`: ödemesi olan hisseyi doğrudan boşaltmayı engelleme.
- `shared/lib/vekalet-dosya`: API URL üretimi, dosya adı/path traversal koruması, yeni ve legacy dosya çözümleme.
- `shared/lib/i18n`: Türkçe karakter koruması, TR fallback, eksik anahtar davranışı, `ar` RTL ve TRY para formatı.
- `shared/lib/api-hata`: katalog eşleşmesi, geriye uyumlu hata gövdesi, beklenmeyen hatada stack/secret sızdırmama.
- `scripts/check-utf8.mjs`: kaynak ağacında bilinen mojibake desenlerini yakalayan kalite kapısı.

## Lint warning sınıflandırması

- Kullanılmayan import/değişkenler: müşteri, rapor, tahsilat, hayvan, TV ve sidebar bileşenlerinde kozmetik/dead-code niteliğinde.
- Kullanılmayan `eslint-disable` satırları: bazı React hook uyarıları artık global Faz 1 ayarıyla bastırıldığı için etkisiz kalmış.
- Güvenlik veya veri bütünlüğü açısından P0 engelleyici warning görülmedi.

## Bilerek ertelenenler

1. Saha satış ekranında yeni müşteri oluşturma: P0 atomiklik kuruldu; yeni müşteri yaratma ayrı davranış ve UX kararı gerektirdiği için Faz 2 paketine bırakıldı.
2. Çoklu firma mimarisi: P0/Faz 1 kapanmadan başlanmadı; yeni ana belgeye göre veri izolasyonu ve çok firma temeli Faz 2’de zorunlu çekirdek kapsamdır.
3. Ürün kimliği/platform panelleri: Faz 1 dışında tutuldu; Platform Süper Admin ve Firma Admin ayrımı Faz 2B/2C paketlerinde ele alınacaktır.
4. Para modeli `Float` dönüşümü: Canlı veri migrasyon kararı ve yedek planı gerektirdiği için ayrı migrasyon paketi olarak ele alınacak.
5. Tüm UI metinlerinin i18n'e taşınması: Faz 1'de altyapı ve pilot API hataları tamamlandı; ekran bazlı metin taşıma sonraki dil/RTL fazına bırakıldı.
6. Tam Arapça/İngilizce çeviri seti: Faz 1'de `tr` ana kaynak ve `en/ar` genişleyebilir iskelet kuruldu; eksik çeviriler Türkçeye düşer.
7. Program genelindeki tüm route ve ekranların merkezi hata/i18n dönüşümü: Faz 1'de ortak altyapı ve beş pilot route tamamlandı; kalan route grupları program kapsam envanterinde dönüşüm listesine alındı.

## Geri alma notu

Bu P0 paketi tek commit olarak tutulur. Geri alma gerektiğinde commit revert edilerek kod geri alınabilir. Vekâlet migrasyon scripti dry-run varsayılanlıdır; `--apply` çalıştırılmadıkça gerçek dosya/DB taşıması yapmaz.

## Faz 2 durumu

**Durum:** Başladı.

**Sıradaki aşama:** Faz 2A — mimari sözleşme, gelişmiş dizin/monorepo iskeleti ve taşıma planı.

Faz 2A gerçek workspace/sözleşme/sınır paketi `120afa16e8b635823a80b0967cbfe18e651bd2ad` başlangıç commit’i üzerinden başlatıldı. Kapanış paketiyle Faz 2A’nın davranış değiştirmeyen sözleşme, dokümantasyon, import grafiği, taşıma matrisi ve tenant izolasyon test planı çıkış kriterleri karşılandı. Platform DB, PostgreSQL kurulumu, tenant routing, Süper Admin ekranı ve gerçek app taşıması Faz 2A kapsamında değildir; Faz 2B, Faz 2C veya sonraki küçük taşıma paketlerine aittir.

### Faz 2A pilot — saha satış route ayrıştırması

**Sınıflandırma:** `b536078` commit’i erken tamamlanan saha satış modüler pilotudur; Faz 2A’nın tamamlandığı anlamına gelmez.

| İş | Bağlı akışlar | Durum | Kanıt |
|---|---:|---|---|
| `/api/saha-satis` ince adaptör pilotu | 21, 22, 29, 30, 60, 62 | Uygulandı | Route HTTP/Zod/oturum/hata adaptörüne indirildi; satış, idempotency, transaction, audit, kapora ve event orkestrasyonu `modules/tahsilat/application/saha-satis.use-case.ts` içine alındı. Saf hesap ve kural kontrolleri `modules/tahsilat/domain/saha-satis.ts` içinde testlendi. |

Bu pilotta Prisma şeması, veritabanı, `apps/*` veya `packages/*` yapısı değiştirilmedi. Geriye uyum için başarılı cevap gövdesi, merkezi hata `kod/mesajAnahtari/requestId` alanları ve mevcut HTTP statusleri korunur.

### Faz 2A workspace ve mimari sınır paketi

| İş | Durum | Kanıt |
|---|---|---|
| Workspace paket deseni | Uygulandı | `pnpm-workspace.yaml` içinde `packages/*` tanımlandı. |
| Platform/tenant TypeScript sözleşmeleri | Uygulandı | `packages/contracts/src/platform-tenant.ts`. |
| Mimari bağımlılık sınır testi | Uygulandı | `tests/architecture-boundaries.test.ts`. |
| Paket manifest bağımlılık sınırı | Uygulandı | `tests/architecture-boundaries.test.ts` artık `packages/*/package.json` bağımlılıklarında Next.js, React, Prisma ve uygulama alias bağımlılıklarını yasaklar. |
| Sözleşme davranış testi | Uygulandı | `tests/platform-tenant-contracts.test.ts`. |
| Import grafiği ve taşıma matrisi | Uygulandı | `docs/architecture/15-FAZ-2A-IMPORT-GRAFIGI-VE-TASIMA-MATRISI.md`. |
| Profesyonel domain/origin sözleşmesi | Uygulandı | `packages/config`, `packages/contracts`, `tests/saas-domain-config.test.ts`, ADR-0001. |
| Platform–tenant veri sınırı ADR’si | Uygulandı | `docs/adr/ADR-0002-PLATFORM-TENANT-VERI-SINIRI-VE-ERISIM-STANDARDI.md`. |
| Tenant izolasyon test planı | Uygulandı | `docs/architecture/10-TEST-KALITE-VE-KABUL-PLANI.md`. |
| Faz 2A kapanış değerlendirmesi | Uygulandı | Faz 2A yalnız davranış değiştirmeyen sözleşme/plan/matris/test planı kapsamına göre kapanır; DB, tenant routing ve app taşıma sonraki fazlara bırakıldı. |

### Profesyonel ürün ve operasyon önerileri uyumlandırması

**Durum:** Planlandı; uygulama kodu başlatılmadı.

| İş | Durum | Kanıt |
|---|---|---|
| Yeni operasyon kapsamı | Planlandı | `PRO-030..PRO-036` kayıtları `11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md` içine eklendi. |
| Mükerrer olmayan güçlendirmeler | Planlandı | Yapay zekâ güvenli rolü, placeholder kuralı, kritik işlem güvenliği, güvenli sürüm geçişi ve Kurban Günü Provası ana yol haritası ile faz-risk belgesinde güçlendirildi. |
| Faz 2A durumu | Değişmedi | Bu uyumlandırma Faz 2A uygulama kapsamını büyütmez ve Faz 2A tamamlandı anlamına gelmez. |

## Faz 2B durumu

**Durum:** Başladı — 2B-1 platform domain ve database-platform şema temeli uygulandı.

| İş | Durum | Kanıt |
|---|---|---|
| `packages/platform` domain paketi | Uygulandı | `Organization`, `TenantInstance`, `Plan`, `ModuleDefinition`, `License`, `LicenseEntitlement` domain temeli ve saf doğrulama fonksiyonları eklendi. |
| `packages/database-platform` şema paketi | Uygulandı | Ayrı PostgreSQL provider kullanan `packages/database-platform/prisma/schema.prisma` ve `0001_platform_baseline` migration SQL'i eklendi. |
| Platform repository port/adaptörleri | Uygulandı | Organization, TenantInstance ve plan/license repository portları ile Prisma adaptör eşlemeleri eklendi. |
| Platform–tenant veri sınırı | Uygulandı | Platform şemasında tenant operasyon modelleri, DB URL/parola/secret alanları ve tenant operasyon repository'si yoktur. |
| PostgreSQL integration | Eksik | Docker kullanılamıyor ve `PLATFORM_TEST_DATABASE_URL` tanımlı değil; gerçek test DB'ye migration uygulanmadı. Prisma schema validate ve offline migration diff çalıştırıldı. |
| Faz 2B-1A platform Prisma/domain sınırı sağlamlaştırma | Uygulandı | `@tilbecore/*` public package importları, workspace dependency manifestleri, generated platform Prisma tipleri, nested relation write sözleşmeleri, `TenantDatabaseRefRepository`, `validUntil` ve tenant/lisans genel limit ayrımı, `0002_platform_baseline_hardening` migration SQL'i ve boundary/schema/repository testleri eklendi. |
| Faz 2B-1B gerçek PostgreSQL ve CI doğrulaması | CI kapısına bağlandı | `.github/workflows/webpack.yml` PostgreSQL 16 servisli CI kapısına dönüştürüldü; platform Prisma validate/generate, gerçek migration deploy, `pnpm test:platform-postgres`, typecheck, test, lint, build, PWA generated artefakt kontrolü ve `git diff --check` sırasıyla çalışır. Gerçek PostgreSQL kanıtı GitHub Actions yeşil koşusu ile raporlanmadan bu satır canlıya hazır kabul edilmez. |
| Faz 2B platform kullanıcı/rol repository temeli | Uygulandı — genel doğrulama bekliyor | Mevcut `PlatformUser`, `PlatformRole`, `PlatformUserRole` şeması değiştirilmeden domain tipleri, e-posta sözleşmesi, repository portu, Prisma adapter mapper'ları ve hedefli domain/repository testleri eklendi. Platform login/session/MFA, Süper Admin UI ve provisioning başlatılmadı. |
| Faz 2B control-plane metadata temeli | Uygulandı — genel doğrulama bekliyor | `packages/platform/src/domain/platform-control-plane.ts` ve `0003_platform_control_plane_metadata` migration'ı eklendi. MFA/passkey kayıtları, platform session/device, provisioning job, tenant health snapshot, emergency stop, incident, maintenance ve support ticket link metadata'sı platform DB sınırında tutulur; tenant operasyon verisi eklenmedi. |
| Faz 2C/2D tenant çekirdek sözleşmesi ve DB başlangıcı | Uygulandı — genel doğrulama bekliyor | `@tilbecore/tenant-core` ve `@tilbecore/database-tenant` paketleri eklendi. Season, Customer, Supplier, Animal, ShareCard, Share, Sale, LedgerEntry, TenantAuditLog ve TenantOutboxMessage için PostgreSQL şema/migration başlangıcı oluşturuldu. Para/kilo alanları Decimal/Numeric sözleşmeyle tanımlandı; eski SQLite importu henüz yalnız iskelet düzeyindedir. |
| Faz 2C tenant resolution ve connection sınırı | Uygulandı — genel doğrulama bekliyor | `@tilbecore/tenant-runtime` paketi eklendi. Host/custom-domain çözümleme, registry üzerinden tenant descriptor alma, inactive tenant reddi, session/databaseRef mismatch fail-closed davranışı ve connection pool key sözleşmesi kodlandı. DNS/TLS/deployment yapılmadı. |

2B-1B integration test kapsamı `packages/database-platform/tests/platform-postgres.integration.test.ts` içindedir. Testler `RUN_PLATFORM_POSTGRES_TESTS=1` ve `PLATFORM_TEST_DATABASE_URL` olmadan normal unit koşusunda atlanır; CI'da geçici PostgreSQL servisiyle çalışır. Kapsam: boş DB'ye `0001`+`0002`, `0001` sonrası örnek kayıtlarla `0002`, drift/idempotent deploy, check constraint, foreign key, unique, gerçek repository create/read/nested write, transaction commit/rollback ve connection string sızıntısı kontrolü.

Bu kayıt Faz 2B'nin tamamlandığı, Platform PostgreSQL'in canlıya hazır olduğu, Süper Admin'in hazır olduğu, tenant provisioning'in hazır olduğu veya çok firmalı sistemin tamamlandığı anlamına gelmez.

## Faz 3–6 durumu

**Durum:** Başladı — ticari domain ve finans çekirdeği uygulandı — genel doğrulama bekliyor.

| İş | Durum | Kanıt |
|---|---|---|
| Müşteri/sezon cari sözleşmesi | Uygulandı — genel doğrulama bekliyor | `@tilbecore/tenant-core` içinde müşteri oluşturma, telefon normalizasyonu ve sezon bazlı cari hesap özet sözleşmesi eklendi. |
| Satış ve hisse kuralı | Uygulandı — genel doğrulama bekliyor | `confirmSale` akışı satılabilir hisse kontrolü, fiyat snapshot'ı, idempotency key ve ledger satış kaydı üretir. |
| Ledger/tahsilat temeli | Uygulandı — genel doğrulama bekliyor | Decimal string para sözleşmesi, ödeme dağıtımı toplam kontrolü, ödeme ledger kayıtları ve ters kayıt/reversal akışı eklendi. Yeni `Float` para modeli eklenmedi. |

## Faz 7–10 durumu

**Durum:** Başladı — operasyon, belge, kesim, paketleme, teslimat ve offline sözleşmeleri uygulandı — genel doğrulama bekliyor.

| İş | Durum | Kanıt |
|---|---|---|
| Vekâlet, korumalı belge ve QR | Uygulandı — genel doğrulama bekliyor | `ProxyDocument`, `QrToken`, protected storage guard ve QR usable guard sözleşmeleri `@tilbecore/tenant-core` ile tenant DB `0002_tenant_operation_flow` migration'ına eklendi. |
| Kesim operasyon motoru | Uygulandı — genel doğrulama bekliyor | `SlaughterJob` state machine ve tenant DB modeli eklendi. Yönetici istisnası/UI iş akışı henüz mevcut ekranlara bağlanmadı. |
| Tartım, paketleme ve kilo farkı | Uygulandı — genel doğrulama bekliyor | `WeighingRecord`, `PackageRecord`, kilo Decimal/Numeric modeli ve kilo farkı ledger adjustment sözleşmesi eklendi. |
| Teslimat, offline kuyruk ve cihaz adaptörleri | Uygulandı — genel doğrulama bekliyor | `DeliveryRecord`, teslimat geri alma, `OfflineQueueItem`, secret-safe offline payload guard ve cihaz adapter sözleşmeleri eklendi. PWA runtime senkronizasyonu genel doğrulama/daha sonraki bağlantı işlerine kaldı. |
