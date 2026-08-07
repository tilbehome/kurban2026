# 13 — Hedef Dizin İskeleti ve Modül Standardı

Bu belge fiziksel klasör taşıma talimatı değildir. Hedef yapıyı tarif eder; boş ve göstermelik kurumsal dizinler şimdi oluşturulmayacaktır. Yeni klasörler yalnız gerçek çalışan kod taşındığında veya yeni paket fiilen kullanılmaya başladığında açılacaktır.

## Kesin karar

- Mimari hedef: monorepo + modüler monolit.
- Uygulamalar ayrışacak; iş kuralları mikroservise bölünmeyecek.
- İlk kanıt saha satış modüler pilotuyla üretilecek.
- Fiziksel monorepo taşıması, modüler sınırlar kodla ve testle kanıtlandıktan sonra başlayacak.
- Platform uygulaması, firma sınırı ve ayrı veritabanı temeli hazır olmadan `apps/platform` açılmayacak.

## Hedef üst seviye yapı

```text
apps/
  platform/
  tenant/
  worker/
  integration-gateway/   # gelecek
  print-agent/           # gelecek
  sync-agent/            # gelecek

packages/
  core/
  platform/
  database-platform/
  database-tenant/
  identity-platform/
  identity-tenant/
  ui/
  i18n/
  documents/
  file-storage/
  contracts/
  event-bus/
  workflow-engine/
  rules-engine/
  module-registry/
  feature-flags/
  observability/
  testing/

tests/
infrastructure/
scripts/
docs/
data/
```

## Uygulama alanları

| Hedef | Sorumluluk | Ne zaman oluşur? |
|---|---|---|
| `apps/tenant` | Firma operasyon uygulaması: müşteri, hayvan, hisse, tahsilat, kesim, teslimat | Mevcut uygulama taşınacak kadar modüler sınırlar kanıtlandıktan sonra |
| `apps/platform` | TilbeCore platform paneli, firma/lisans/deployment/support yönetimi | Platform DB ve platform kimliği tasarımı hazır olduğunda |
| `apps/worker` | Zamanlanmış işler, migration orchestration, yedek, lisans kontrolü | Tenant DB ve job ihtiyaçları gerçek use-case ile doğduğunda |
| `apps/integration-gateway` | WhatsApp Business, SMS, e-fatura, POS gibi dış entegrasyon sınırı | Entegrasyonlar gerçek sözleşme ve güvenlik modeliyle açıldığında |
| `apps/print-agent` | Yerel yazıcı, etiket, A4 belge, offline print köprüsü | Yerel kurulumlarda browser baskısı yetmediğinde |
| `apps/sync-agent` | Yerel/bulut senkron, lisans heartbeat, health reporting | Offline-first senkron gereksinimi netleştiğinde |

## Paket alanları

| Paket | Sorumluluk | Yasak bağımlılık |
|---|---|---|
| `packages/core` | Ortak value object, hata kodu, sonuç tipi, tarih/para gibi framework bağımsız çekirdek | Next.js, React, Prisma |
| `packages/platform` | Firma, lisans, deployment, support domain/use-case | Tenant operasyon verisi |
| `packages/database-platform` | Platform Prisma/SQL migration ve repository adapter | Firma operasyon tabloları |
| `packages/database-tenant` | Firma operasyon DB migration, repository adapter | Platform kullanıcı/secret UI |
| `packages/identity-platform` | Platform auth, MFA, platform session ve izinler | Firma içi rol varsayımı |
| `packages/identity-tenant` | Firma kullanıcı, rol, izin, destek oturumu adapter’ı | Platform admin ayrıcalığı |
| `packages/ui` | Ortak tasarım sistemi, form, tablo/kart, shell parçaları | Domain iş kuralı |
| `packages/i18n` | Dil dosyaları, mesaj anahtarı, formatlama, RTL yardımcıları | DB durum metni çevirisi |
| `packages/documents` | Dekont, QR belge, PDF/HTML belge şablonları | Fiziksel dosya yolu sızıntısı |
| `packages/file-storage` | Yerel/S3 benzeri storage port/adapters | Doğrudan UI erişimi |
| `packages/contracts` | API/event sözleşmeleri, DTO, schema | Runtime iş kuralı |
| `packages/event-bus` | Domain event publish/subscribe, idempotent outbox | UI state |
| `packages/workflow-engine` | Kesim, satış, teslim gibi state machine motoru | Prisma doğrudan erişimi |
| `packages/rules-engine` | Yetki dışı iş kuralları, kabul/override politikaları | Kullanıcı session implementasyonu |
| `packages/module-registry` | Modül manifestleri, feature görünürlüğü, menü kayıtları | Route içi hard-code menü |
| `packages/feature-flags` | Firma/paket/modül bazlı flag değerlendirme | Lisans verisini istemciye sızdırma |
| `packages/observability` | Log, audit adapter, metric, health check | PII/secret açık log |
| `packages/testing` | Test factory, PG test harness, route/use-case test yardımcıları | Canlı DB varsayımı |

## Gerçek iş modülü standardı

Her gerçek iş modülü hedefte şu yapıyı kullanır:

```text
modules/<is-modulu>/
  module.manifest.ts
  domain/
    entities/
    value-objects/
    ports/
    events/
    rules/
  application/
    use-cases/
    services/
    dto/
  infrastructure/
    prisma/
    file-storage/
    external/
  presentation/
    api/
    components/
    pages/
  i18n/
    tr.json
    ar.json
    en.json
  tests/
    unit/
    integration/
    e2e/
```

Zorunlu bağımlılık kuralı:

```text
UI/API → Application → Domain
```

Infrastructure, domain portlarını uygular. Domain; Next.js, React, Prisma, HTTP ve dosya sistemine bağımlı olmaz.

## `module.manifest.ts` içeriği

Minimum alanlar:

- `id`
- `displayNameKey`
- `descriptionKey`
- `ownerDomain`
- `routes`
- `permissions`
- `eventsPublished`
- `eventsConsumed`
- `featureFlags`
- `dependencies`
- `mobileEntryPoints`
- `desktopEntryPoints`
- `testCoverageTargets`

## Mevcut klasörlerden hedef yapıya göç tablosu

| Mevcut konum | Mevcut sorumluluk | Hedef konum | Taşıma fazı | Risk | Önkoşul | Test | Geri dönüş |
|---|---|---|---|---|---|---|---|
| `app` | Next.js sayfa ve API route’ları | `apps/tenant/app` | Fiziksel taşıma fazı 8 | Route import kırılması | Saha satış pilotu ve ortak paketler | `pnpm build`, route smoke | Import alias revert |
| `modules` | UI, servis ve bazı domain mantığı karışık | Önce mevcut yerde standardize, sonra domain bazlı paket/app sınırı | Faz 2–6 | Büyük taşıma karmaşası | `module.manifest.ts` standardı | Unit + mock route | Modül bazlı revert |
| `shared` | Prisma, session, para, tarih, events, UI shell | `packages/core`, `packages/ui`, `packages/i18n`, `packages/event-bus`, `packages/observability` | Faz 6–7 | Her yerden import var | Alias haritası ve adapter planı | Typecheck + import graph | Paket çıkarma revert |
| `components` | UI primitive bileşenleri | `packages/ui` | Faz 7 | Stil kırılması | Tasarım token standardı | Component smoke | Eski import alias |
| `prisma` | Tek SQLite tenant şeması ve seed | `packages/database-tenant`, sonra `packages/database-platform` ayrı | Faz 5 ve 9 | Veri kaybı/migration | PG test DB, dry-run | Migration + mutabakat | DB backup restore |
| `tests` | Route/helper testleri | `tests`, `packages/testing`, modül içi `tests` | Faz 3 ve sonrası | Test keşfi bozulması | Test naming standardı | `pnpm test` | Test config revert |
| `scripts` | Seed, yedek, kontrol, migration yardımcıları | `scripts` + paket özel scriptleri | Faz 5–15 | Yanlış DB/script | Dry-run standardı | Script dry-run | Script revert |
| `public` | PWA manifest, ikon, SW, public asset | `apps/tenant/public`; firma assetleri storage/config | Faz 4 ve 8 | Firma markası sabit kalır | Branding ayrımı | PWA smoke | Eski public fallback |
| Runtime dosyaları/yüklemeler | `.next`, `data/uploads`, `backups`, SQLite WAL/SHM | Repo dışı runtime volume; `data` yalnız örnek/fixture | Faz 9–15 | Canlı dosya karışması | Storage port ve backup policy | File/security/restore | Runtime volume restore |

Toplu klasör taşıma yapılmayacaktır. Her taşıma küçük commit, test ve geri dönüş noktasıyla yapılır.

## Dizin dönüşüm fazları

| Aşama | Giriş şartı | Değişecek alanlar | Testler | Build kontrolü | Smoke testi | Commit noktası | Geri dönüş |
|---|---|---|---|---|---|---|---|
| 1. UTF-8 ve i18n temeli | P0 + mimari docs tamam | Hata kodu, mesaj registry, encoding config | Encoding, API hata unit | `pnpm build` | Giriş + kritik API hata | `feat: add error/i18n foundation` | Commit revert |
| 2. Saha satış modüler pilotu | Hata kodu temeli | `/api/saha-satis`, tahsilat/hisse use-case | Unit, mock route, PG integration | `pnpm build` | Kaporalı/kaporasız satış | `refactor: modularize saha sales` | Route eski adaptöre döner |
| 3. Müşteri/hayvan/hisse modülleri | Pilot kalıbı kanıtlandı | Domain/application ayrımı | Unit + route | `pnpm build` | Müşteri/hisse atama | Modül bazlı commit | Modül revert |
| 4. Tahsilat ve finans modülleri | PG test harness hazır | Tahsilat, kasa, ledger hazırlığı | Ledger unit, concurrency | `pnpm build` | Tahsilat/dekont | Finans checkpoint | Backup + revert |
| 5. Vekâlet/kesim/paket/teslimat | Dosya ve workflow portları hazır | Vekâlet, state machine | Workflow + security | `pnpm build` | Dosya/TV/teslim | Operasyon checkpoint | Feature flag kapat |
| 6. `shared` ayrıştırması | Domain sınırları net | Shared alt parçaları | Import graph + unit | `pnpm build` | Ana sayfalar | Paket hazırlık commitleri | Alias revert |
| 7. `packages/core`, `ui`, `i18n`, `contracts` | Shared ayrıştırması güvenli | İlk gerçek packages | Unit + component | `pnpm build` | UI/i18n smoke | Package checkpoint | Workspace revert |
| 8. Mevcut uygulama `apps/tenant` | Import alias stabil | App taşıma | Full test | `pnpm build` | Login, müşteri, satış | Move commit | Git move revert |
| 9. Platform/firma DB sınırı | Tenant app stabil | DB packages, provisioning | PG integration | `pnpm build` | İki firma izolasyon | DB boundary commit | Backup restore |
| 10. `apps/platform` | Platform DB/IAM hazır | Platform UI/API | Security + MFA | `pnpm build` | Platform login | Platform checkpoint | Feature flag |
| 11. Worker/entegrasyon ajanları | İş gereksinimi gerçek | Worker, gateway, agents | Integration + offline | `pnpm build` | Yedek/lisans heartbeat | Agent checkpoint | Agent kapat |

## Kabul kriteri

- Bu belge onaylanmadan fiziksel dizin taşıması yapılmaz.
- İlk kodlama paketi hâlâ UTF-8/i18n temeli olmalıdır.
- Saha satış pilotu modüler sınırların ilk çalışan kanıtı olacaktır.

