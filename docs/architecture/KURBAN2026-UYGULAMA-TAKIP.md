# TilbeCore – Kurban Takip Uygulama Takip Defteri

```yaml
id: TRK-001
status: IMPLEMENTING
owner: Product-and-Architecture
source_role: implementation_evidence_ledger
source_of_truth: true
last_reviewed: 2026-08-13
verified_against_commit: fef2154ac64c0948f51e42e34c3f93081928e2dd
```

Mimari hedef görev yönlendirmesi: [RMP-001](TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md). Kaynak çelişkileri [GOV-003](../governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md) ile çözülür.

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
| Saha satış transaction/idempotency teknik paketi | 21, 22, 29, 30 | Teknik paket tamamlandı; hedef iş kuralı `IMPLEMENTING` | `/api/saha-satis` atama + opsiyonel kaporayı tek transaction içinde yapıyor ve `clientRequestId` ile tekrarları engelliyor. Ancak sıfır kaporayla müşteri atayıp satış/alacak açabilen mevcut davranış, kaporasız kaydı yalnız rezervasyon sayan bağlayıcı hedefle uyumsuzdur. Teknik atomiklik kanıtı korunur; iş kuralı tamamlanmış sayılmaz. |
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
| Tenant izolasyon test planı | Uygulandı | `docs/testing/TST-001-MASTER-TEST-PLANI.md`; eski architecture yolu `ARC-010 / SUPERSEDED` uyumluluk yönlendirmesidir. |
| Faz 2A kapanış değerlendirmesi | Uygulandı | Faz 2A yalnız davranış değiştirmeyen sözleşme/plan/matris/test planı kapsamına göre kapanır; DB, tenant routing ve app taşıma sonraki fazlara bırakıldı. |

### Profesyonel ürün ve operasyon önerileri uyumlandırması

**Durum:** Planlandı; uygulama kodu başlatılmadı.

| İş | Durum | Kanıt |
|---|---|---|
| Yeni operasyon kapsamı | Planlandı | `PRO-030..PRO-036` kayıtları `11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md` içine eklendi. |
| Mükerrer olmayan güçlendirmeler | Planlandı | Yapay zekâ güvenli rolü, placeholder kuralı, kritik işlem güvenliği, güvenli sürüm geçişi ve Kurban Günü Provası ana yol haritası ile faz-risk belgesinde güçlendirildi. |
| Faz 2A durumu | Değişmedi | Bu uyumlandırma Faz 2A uygulama kapsamını büyütmez ve Faz 2A tamamlandı anlamına gelmez. |

## Faz 2B durumu

**Durum:** Uygulandı — genel doğrulama bekliyor. Platform Süper Admin kontrol düzlemi, gerçek PostgreSQL migration/repository testi ve iki firma izolasyon kapısı paket kapsamında çalıştırıldı; canlı altyapı ve Faz 2–12 genel kabul dönemi ayrıca bekliyor.

**Sabit kanıt:** `74915b6f3f1f8d53116b760b6a6be9797111efa5` ve [TilbeCore CI / 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803), sonuç `success`. Kapsam ve kanıtlanmayan alanlar için [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) ana özettir.

| İş | Durum | Kanıt |
|---|---|---|
| `packages/platform` domain paketi | Uygulandı | `Organization`, `TenantInstance`, `Plan`, `ModuleDefinition`, `License`, `LicenseEntitlement` domain temeli ve saf doğrulama fonksiyonları eklendi. |
| `packages/database-platform` şema paketi | Uygulandı | Ayrı PostgreSQL provider kullanan `packages/database-platform/prisma/schema.prisma` ve `0001_platform_baseline` migration SQL'i eklendi. |
| Platform repository port/adaptörleri | Uygulandı | Organization, TenantInstance ve plan/license repository portları ile Prisma adaptör eşlemeleri eklendi. |
| Platform–tenant veri sınırı | Uygulandı | Platform şemasında tenant operasyon modelleri, DB URL/parola/secret alanları ve tenant operasyon repository'si yoktur. |
| PostgreSQL integration | Uygulandı — genel doğrulama bekliyor | PostgreSQL 16 servisli GitHub CI platform migration/repository integration testlerini çalıştırır; tenant servisi de ayrı migration ve iki firma izolasyon test kapısı sağlar. |
| Faz 2B-1A platform Prisma/domain sınırı sağlamlaştırma | Uygulandı | `@tilbecore/*` public package importları, workspace dependency manifestleri, generated platform Prisma tipleri, nested relation write sözleşmeleri, `TenantDatabaseRefRepository`, `validUntil` ve tenant/lisans genel limit ayrımı, `0002_platform_baseline_hardening` migration SQL'i ve boundary/schema/repository testleri eklendi. |
| Faz 2B-1B gerçek PostgreSQL ve CI doğrulaması | CI kapısına bağlandı | `.github/workflows/webpack.yml` PostgreSQL 16 servisli CI kapısına dönüştürüldü; platform Prisma validate/generate, gerçek migration deploy, `pnpm test:platform-postgres`, typecheck, test, lint, build, PWA generated artefakt kontrolü ve `git diff --check` sırasıyla çalışır. Gerçek PostgreSQL kanıtı GitHub Actions yeşil koşusu ile raporlanmadan bu satır canlıya hazır kabul edilmez. |
| Faz 2B platform kimlik ve oturum | Uygulandı — gerçek cihaz kabulü bekliyor | Parola+TOTP korunarak WebAuthn passkey kayıt/giriş/iptal/cihaz adlandırma, merkezi RP/origin, tek kullanımlık hashlenmiş recovery code, cihaz ve bütün oturumları sonlandırma, yeniden doğrulama ve audit uygulandı. Yerel HTTPS üzerinde fiziksel authenticator kabulü genel kabul döneminde kanıtlanacaktır. |
| Faz 2B control-plane metadata temeli | Uygulandı — genel doğrulama bekliyor | `packages/platform/src/domain/platform-control-plane.ts` ve `0003_platform_control_plane_metadata` migration'ı eklendi. MFA/passkey kayıtları, platform session/device, provisioning job, tenant health snapshot, emergency stop, incident, maintenance ve support ticket link metadata'sı platform DB sınırında tutulur; tenant operasyon verisi eklenmedi. |
| Faz 2C/2D tenant çekirdek sözleşmesi ve DB başlangıcı | Uygulandı — genel doğrulama bekliyor | `@tilbecore/tenant-core` ve `@tilbecore/database-tenant` paketleri eklendi. Season, Customer, Supplier, Animal, ShareCard, Share, Sale, LedgerEntry, TenantAuditLog ve TenantOutboxMessage için PostgreSQL şema/migration başlangıcı oluşturuldu. Para/kilo alanları Decimal/Numeric sözleşmeyle tanımlandı; eski SQLite importu henüz yalnız iskelet düzeyindedir. |
| Faz 2C tenant-web request runtime ve pool | Uygulandı — genel doğrulama bekliyor | `@tilbecore/tenant-web-runtime`, Platform DB tenant/custom-domain/SupportSession metadata’sını `@tilbecore/tenant-runtime` request akışına bağlar. Host-session-ref uyuşmazlığı, pasif/reserved/console host ve desteksiz platform erişimi fail-closed reddedilir. Request-local context, ayrı Prisma pool, eşzamanlı reuse, event/metric, idle kapatma ve shutdown temizliği uygulanmıştır. Legacy Next.js route’larının modül bazlı taşınması ile DNS/TLS/deployment yapılmadı. |
| Faz 2B/2C devam ettirilebilir provisioning | Uygulandı — genel doğrulama bekliyor | Platform `0004` migration’ı ve job repository her adımın durumunu, idempotency fingerprint’ini, güvenli resume/failure/rollback sonucunu secret içermeden kaydeder. Başarılı tenant ikinci DB/platform kaydı oluşturmaz; platform kaydı tamamlanmış DB rollback edilmez. |
| Faz 2C gerçek PostgreSQL admin adapteri ve CLI | Uygulandı — genel doğrulama bekliyor | `@tilbecore/database-tenant` DB create/exists, tenant migration deploy/doğrulama, ownership marker, timeout ve injection-safe rollback sağlar. `apps/provisioning-cli` `dry-run/create/status/resume/rollback` komutlarını ham SQL ve secret çıktısı olmadan çalıştırır. |
| Faz 2C iki firma web request izolasyonu | CI kapısına bağlandı | İki ayrı organization/DB, aynı kayıt ID’leri, eşzamanlı A/B request’leri, custom-domain ve host/session/ref fail-closed davranışı, ayrı Prisma pool, süre/kapsam/onay kontrollü SupportSession, platform audit’i ve güvenli hata payload’ı gerçek PostgreSQL üzerinde doğrulanır. |
| Faz 2C firma bazlı backup/restore doğrulaması | CI kapısına bağlandı | `PostgresTenantBackupService` ve `apps/tenant-ops-cli`; gerçek `pg_dump`, SHA-256/boyut/migration metadata’sı, geçici `pg_restore`, tenant marker/ref doğrulaması, çapraz firma reddi ve hata halinde geçici DB/dosya temizliği sağlar. Production destructive restore kapalıdır. |
| Faz 2B Platform Süper Admin 360° uygulaması | Uygulandı — genel doğrulama bekliyor | `apps/platform-admin` içinde komuta merkezi, firma listesi/360°, async provisioning sihirbazı ve iş merkezi, plan/lisans/kota/entitlement, yaşam döngüsü, domain, backup/restore doğrulama, SupportSession, platform kullanıcı/rol ve audit sayfaları gerçek Platform DB repository adaptörlerine bağlandı. `0006_platform_admin_operations` migration’ı, optimistic concurrency, idempotent komut kuyruğu ve provisioning/tenant-ops `worker --once` yürütmesi eklendi. |
| Faz 2B kontrol düzlemi tamamlama | Uygulandı — genel doğrulama bekliyor | `0007`, `/security`, `/incidents`, `/maintenance`, incident timeline, planlı bakım, tenant runtime emergency/read-only/module-stop politikası, güvenli yapılandırma farkı, yeniden doğrulamalı/ikinci onaylı ve request/audit bağlı firma operasyon işleri ile backup sonrası tek kullanımlık aktivasyon bağlantılı Firma Admin daveti eklendi. Export içeriği Platform Admin’e verilmez. |

2B integration test kapsamı `packages/database-platform/tests/platform-postgres.integration.test.ts` içindedir. Testler `RUN_PLATFORM_POSTGRES_TESTS=1` ve `PLATFORM_TEST_DATABASE_URL` olmadan normal unit koşusunda atlanır; CI'da geçici PostgreSQL servisiyle çalışır. Kapsam: boş DB’ye `0001..0007`, eski migration sonrası güncel zincir, drift/idempotent deploy, check constraint, foreign key, unique, gerçek repository create/read/nested write, transaction commit/rollback, challenge/recovery tek kullanım ve connection string sızıntısı kontrolü. Önceki yerel kayıtlarda platform integration `9/9` ve iki firma web/pool/backup isolation `1/1` sonucu bulunur. Güncel değişmez kanıt, `74915b6` için GitHub Actions koşusundaki ilgili PostgreSQL, build ve kalite adımlarının başarılı olmasıdır; yerel sayı canlı kabul anlamına gelmez.

Bu kayıt Faz 2B’nin canlıya hazır olduğu anlamına gelmez. Fiziksel passkey cihaz kabulü, canlı DNS/TLS/deployment, production restore onayı, gerçek abonelik/faturalama ve genel güvenlik/E2E kabulü sonraki uygun kapılarda kalır.

## Faz 2–12 kalan işler ve uygulama sırası matrisi

Bu matris yalnız kaynak kod, migration, test ve takip belgesi kanıtıyla tutulur; kanıtı olmayan iş tamamlandı sayılmaz.

| Sıra | Faz | Kanıtla tamamlanan işler | Uygulanmış fakat belgede eksik görünen işler | Yalnız sözleşme/iskelet kalan işler | Başlanmamış veya sonraki davranış işleri |
|---|---|---|---|---|---|
| 1 | Faz 2B | Platform PostgreSQL `0001..0007`, ayrı Platform Admin, parola+TOTP+passkey/recovery, DB session/device, komuta merkezi, firma 360°, provisioning, plan/lisans, domain, backup, SupportSession, kullanıcı/audit, incident/bakım/acil durdurma, yapılandırma farkı ve onaylı firma operasyon akışları. | Provisioning sonrası ilk backup işi ve davet hazırlığı gerçek worker zincirine; tenant erişim modu gerçek request runtime’a bağlandı. | Data export içeriğini üreten tenant tarafı executor Faz 2D–6 modül taşımasına bağlıdır; Platform yalnız güvenli işi ve metadata’yı yönetir. | Fiziksel passkey cihaz kabulü, canlı DNS/TLS/deployment, production restore onayı, gerçek abonelik/faturalama ve genel E2E/güvenlik kabulü. |
| 2 | Faz 2C | Gerçek tenant DB create/exists/migrate/verify/rollback adapteri, ownership marker, idempotent/resumable provisioning, kontrollü CLI’lar, host/custom-domain resolution, request-local context, session/databaseRef fail-closed guard, auditli SupportSession, gözlemlenebilir tenant Prisma pool’u, tenant bazlı dump/geçici restore doğrulaması ve iki firma PostgreSQL web/backup isolation CI testi. | Platform metadata–tenant request composition bridge’i; pool event/metric portu ve tenant ops CLI sözleşme düzeyinden çalışan altyapıya taşındı. OpenTelemetry Node SDK ve collector paketi eklendi, gerçek staging trace kanıtı bekliyor. | Mevcut legacy route’lar yeni runtime’a toplu taşınmamıştır. | Legacy route’ların modül bazlı runtime’a taşınması, pool kapasite eşikleri/alarmları, ölçülmüş RPO/RTO, production restore onay akışı ve canlı DNS/TLS/deployment. |
| 3 | Faz 2D–4 | BusinessProfile/Location/Setting/Season, Customer/Phone/Address/SeasonAccount, Supplier/Account/PurchaseInvoice/Payment/ExpenseDocument, Animal/Weight/Health/QurbanAssignment tenant modelleri; atomik authorization/audit/idempotency/outbox use-case'leri ve adaptif ekranlar kodlandı. | Müşteri ve hayvan mevcut API/liste/detay yolları `TENANT_MASTER_DATA_MODE` adapter'ıyla tenant PostgreSQL'e geçirildi; legacy varsayılan geri dönüşü korundu. | Kod üretimi dışında test, lint, typecheck, build ve PostgreSQL migration uygulanmadı; durum `IMPLEMENTED_UNVERIFIED`. | Legacy veri dry-run/import, satış/tahsilat/ledger tam taşıması, rezervasyon worker'ı, finans mutabakatı ve genel kalite turu. |
| 4 | Faz 7–10 | Proxy document, QR token, slaughter state machine, weighing/package/delivery/offline/device adapter sözleşmeleri ve tenant DB `0002`. | Tenant/sezon/kullanıcı/cihaz bağlı, TTL/idempotency/retry/conflict/poison kurallı güvenli offline runtime paketi ve görünür durum bileşeni eklendi. | TV/customer tracking ve cihaz doğrulama sözleşme düzeyinde. | Offline runtime’ın gerçek oturum ve saha ekranlarına bağlanması, vekâlet belge runtime, kesim/paket/teslim API taşıması ve cihaz adapter uygulamaları. |
| 5 | Faz 11–12 | Operations package: dashboard KPI, exception queue, universal search, observability, release, backup/restore, simulation readiness ve acil durum runbook. | OpenTelemetry Node SDK/collector, Playwright 13 proje, axe, k6 profilleri, sentetik staging compose ve WAL/PITR hazırlık paketi eklendi. | ASVS/WCAG manuel kabul ve fiziksel cihaz matrisi dış ortam bekliyor. | Gerçek staging deployment/E2E/prova/yük/PITR tatbikatı, fiziksel cihaz-passkey kabulü ve ölçülmüş sonuçlar. |

Node.js 20 GitHub Actions annotation'ı CI'yı bozmadığı için Faz 2–12 geliştirmesini durdurmaz; nihai CI/altyapı temizlik aşamasına bırakıldı.

## Faz 3–6 durumu

**Durum:** Başladı — ticari domain ve finans çekirdeği uygulandı — genel doğrulama bekliyor.

| İş | Durum | Kanıt |
|---|---|---|
| Müşteri/sezon cari sözleşmesi | Uygulandı — genel doğrulama bekliyor | `@tilbecore/tenant-core` içinde müşteri oluşturma, telefon normalizasyonu ve sezon bazlı cari hesap özet sözleşmesi eklendi. |
| Satış ve hisse kuralı | Uygulandı — genel doğrulama bekliyor | `confirmSale` akışı satılabilir hisse kontrolü, fiyat snapshot'ı, idempotency key ve ledger satış kaydı üretir. |
| Rezervasyon–kesin satış ve işletme envanteri hedef farkı | `IMPLEMENTING` | Tenant `confirmSale` pozitif kaporayı zorunlu kılar ve süre sonu domain komutu finans reversal'ı üretmez; legacy saha satış hâlâ taşınmadığı için uçtan uca Faz 5 hedefi tamamlanmış sayılmaz. |
| Ledger/tahsilat temeli | Uygulandı — genel doğrulama bekliyor | Decimal string para sözleşmesi, ödeme dağıtımı toplam kontrolü, ödeme ledger kayıtları ve ters kayıt/reversal akışı eklendi. Yeni `Float` para modeli eklenmedi. |

## Faz 7–10 durumu

**Durum:** Başladı — operasyon, belge, kesim, paketleme, teslimat ve offline sözleşmeleri uygulandı — genel doğrulama bekliyor.

| İş | Durum | Kanıt |
|---|---|---|
| Vekâlet, korumalı belge ve QR | Uygulandı — genel doğrulama bekliyor | `ProxyDocument`, `QrToken`, protected storage guard ve QR usable guard sözleşmeleri `@tilbecore/tenant-core` ile tenant DB `0002_tenant_operation_flow` migration'ına eklendi. |
| Kesim operasyon motoru | Uygulandı — genel doğrulama bekliyor | `SlaughterJob` state machine ve tenant DB modeli eklendi. Yönetici istisnası/UI iş akışı henüz mevcut ekranlara bağlanmadı. |
| Tartım, paketleme ve kilo farkı | Uygulandı — genel doğrulama bekliyor | `WeighingRecord`, `PackageRecord`, kilo Decimal/Numeric modeli ve kilo farkı ledger adjustment sözleşmesi eklendi. |
| Teslimat, offline kuyruk ve cihaz adaptörleri | Uygulandı — genel doğrulama bekliyor | `DeliveryRecord`, teslimat geri alma, `OfflineQueueItem`, secret-safe offline payload guard ve cihaz adapter sözleşmeleri eklendi. PWA runtime senkronizasyonu genel doğrulama/daha sonraki bağlantı işlerine kaldı. |

## Faz 11–12 durumu

**Durum:** Başladı — yönetim, observability ve canlı hazırlık sözleşmeleri uygulandı — genel doğrulama bekliyor.

| İş | Durum | Kanıt |
|---|---|---|
| Yönetim paneli/operasyon merkezi sözleşmeleri | Uygulandı — genel doğrulama bekliyor | `@tilbecore/operations` içinde dashboard KPI, istisna kuyruğu ve evrensel arama sonuç sözleşmeleri eklendi. |
| Observability, erişilebilirlik ve güvenlik kabul hedefleri | `IMPLEMENTED_UNVERIFIED` | Trace context/redaction sözleşmelerine ek olarak OpenTelemetry Node SDK ve collector; 13 Playwright projesi, axe/keyboard/zoom/form-error kontrolleri ve sentetik kabul korumaları eklendi. Gerçek staging/browser/fiziksel cihaz koşuları `BLOCKED` veya `NOT_RUN` durumundadır. |
| Release, backup/restore ve simülasyon hazırlığı | `IMPLEMENTED_UNVERIFIED` | Release gate ve tenant dump doğrulamasına ek olarak iki tenant PostgreSQL, reverse proxy/TLS, worker, telemetry, sentetik provisioning, WAL arşivi, base-backup ve izole PITR profilli tekrar üretilebilir staging paketi eklendi. Deployment, restore tatbikatı ve ölçülmüş RPO/RTO dış altyapı olmadığı için tamamlanmış sayılmaz. |
| Runbook | Uygulandı — genel doğrulama bekliyor | `docs/runbooks/KURBAN-GUNU-ACIL-DURUM-RUNBOOK.md` eklendi. |

## Faz 1–12 staging ve nihai kabul altyapısı checkpoint'i

**Durum:** `IMPLEMENTED_UNVERIFIED`

**Doğrulanmış taban:** `fef2154ac64c0948f51e42e34c3f93081928e2dd`, GitHub Actions `31626396792` (`PASSED`)

**Aday uygulama commit'i:** `dce7d539122c1ae263cec566d18e907a5a63b0f1`

| Kapsam | Repo kanıtı | Gerçek kabul durumu |
|---|---|---|
| Sentetik staging | Platform Admin, tenant web/PWA, ayrı platform + iki tenant PostgreSQL, worker, Caddy HTTPS, Docker secret, OTel/Prometheus ve sentetik fixture compose paketi | `BLOCKED` — staging sunucusu, DNS yetkisi ve Docker runtime yok |
| Playwright/axe | 13 proje; masaüstü, mobil/tablet, platform, tenant, saha, TV, `tr/en/ar+RTL`; kritik yüzeyler ve sentetik provisioning/davet senaryosu | Test keşfi `PASSED`; gerçek browser/E2E/axe `NOT_RUN` |
| Passkey ve cihaz | Güvenilir local/staging HTTPS runbook'u, yanlış origin/challenge/revoke/recovery/re-auth adımları ve cihaz matrisi | `BLOCKED` — Windows Hello/authenticator ve fiziksel cihaz etkileşimi yok |
| Offline | Fail-closed capability politikası, IndexedDB repository, tenant/sezon/kullanıcı/cihaz bağı, idempotency, TTL, izin yeniden doğrulama, retry/backoff, poison/conflict ve durum bileşeni | Unit testleri çalıştırıldı; gerçek PWA/oturum entegrasyonu ve cihaz/ağ kabulü `NOT_RUN` |
| Yük ve telemetry | k6 baseline/load/spike/soak ve dayanıklılık profilleri; düşük cardinality/PII-redaction OTel SDK ve collector | Araç/staging olmadığı için ölçüm ve gerçek trace `BLOCKED`; eşik veya latency sonucu uydurulmadı |
| Backup/WAL/PITR | WAL arşivli PostgreSQL imajı, checksum'lı base backup ve time/LSN hedefli izole PITR hazırlığı | Yerel PostgreSQL 16.14 üzerinde migration, iki tenant izolasyonu ve logical backup/geçici restore doğrulaması `PASSED`; staging WAL/PITR, RPO/RTO ve production restore `NOT_RUN` |

Bu checkpoint YN-00–YN-26'yı başlatmaz ve bu yol haritasındaki YN durumlarını değiştirmez. Production DNS, production veri ve production restore işlemi yapılmamıştır.

### 2026-08-13 gerçek yerel kabul güncellemesi

`d87b1c4ca5cd8d7b2865d506c17ba4967dddb296` kaynak commit'i üzerinde, kalıcı `127.0.0.1:55433` test kümesine dokunmadan iki disposable PostgreSQL 16.14 tenant kümesi çalıştırıldı. Platform PostgreSQL integration 9/9 ve iki-tenant provisioning/runtime/backup/restore izolasyon testi 1/1 geçti. Checksum'lı base backup ile WAL arşivi üretildi; `0/8000360` LSN hedefindeki PITR yeni timeline'a promote oldu. Hedef öncesi kayıt korundu, hedef sonrası kayıt yoktu, tenant B marker ve `2/1000.00` ledger toplamı değişmedi. Ölçülen yerel RPO 847 ms, PostgreSQL başlangıcından yazılabilir hazır durumuna RTO 1.425 ms ve son doğrulama sorguları 501 ms'dir. Ayrıntı `EVD-005-RUN-20260813-002` kaydındadır.

Docker/Compose, Caddy, güvenilir local HTTPS ve `.test` DNS/hosts hazırlığı bulunmadığından Playwright sayfa assertion'ları, axe, gerçek OpenTelemetry collector/export ve k6 baseline/load/spike/soak çalıştırılmadı. Browser binary launch kontrolü E2E sayılmadı; k6 için hiçbir VU/süre veya kapasite sonucu üretilmedi. Windows Hello/passkey `MANUAL_ACCEPTANCE_REQUIRED`, mevcut olmayan fiziksel Android/tablet/TV/yazıcı/QR/terazi hücreleri `NOT_RUN` kaldı. Ayrıntılar `EVD-006-RUN-20260813-002`, `EVD-009-RUN-20260813-002` ve `EVD-012-RUN-20260813-002` kayıtlarındadır.
