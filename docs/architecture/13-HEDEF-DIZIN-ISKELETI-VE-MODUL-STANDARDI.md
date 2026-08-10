# 13 — Hedef Dizin İskeleti ve Modül Standardı

Bu belge fiziksel klasör taşıma talimatı değildir. Hedef yapıyı tarif eder; boş ve göstermelik kurumsal dizinler şimdi oluşturulmayacaktır. Yeni klasörler yalnız gerçek çalışan kod taşındığında veya yeni paket fiilen kullanılmaya başladığında açılacaktır.

Birinci kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir. Bu dosyadaki eski sıra veya adlandırma ana belgeyle çelişirse ana belge uygulanır.

## Kesin karar

- Mimari hedef: monorepo + modüler monolit.
- Uygulamalar ayrışacak; iş kuralları mikroservise bölünmeyecek.
- Faz 2A’da önce mimari sözleşme, gelişmiş dizin/monorepo iskeleti ve taşıma planı davranış değiştirmeden hazırlanacak.
- Kaynak kod taşıma, Prisma şeması değişikliği, PostgreSQL kurulumu ve Süper Admin kodlaması Faz 2A dokümantasyon/iskelet kapısı geçmeden başlamayacak.
- Eski “önce saha satış modüler pilotu, sonra monorepo” sırası yerine geçen karar: çok firma izolasyonu temel olduğu için önce platform/tenant sözleşmeleri ve dizin sınırları kurulacaktır.
- Boş veya göstermelik `apps/*` ve `packages/*` dizinleri açılmayacak; iskelet yalnız taşıma planı, bağımlılık kuralı ve testlenebilir sahiplik amacıyla kullanılacak.

## Hedef üst seviye yapı

```text
apps/
  platform-admin/
  tenant-web/
  tenant-mobile/
  public-display/
  worker/
  provisioning-cli/
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
  config/
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
fixtures/
```

## Uygulama alanları

| Hedef | Sorumluluk | Ne zaman oluşur? |
|---|---|---|
| `apps/tenant-web` | Firma operasyon uygulaması: müşteri, hayvan, hisse, tahsilat, kesim, teslimat | Faz 2A taşıma matrisi ve import sınırları onaylandıktan sonra |
| `apps/platform-admin` | TilbeCore platform paneli, firma/lisans/deployment/support yönetimi | Faz 2B Platform DB ve platform kimliği tasarımı hazır olduğunda |
| `apps/tenant-mobile` | Role özel mobil saha PWA ekranları | Firma auth/izin ve saha görev sözleşmeleri netleştiğinde |
| `apps/public-display` | TV ve PII içermeyen tokenlı müşteri takip ekranı | Public read-model ve rate-limit sözleşmeleri hazır olduğunda |
| `apps/worker` | Zamanlanmış işler, migration orchestration, yedek, lisans kontrolü | Tenant DB ve job ihtiyaçları gerçek use-case ile doğduğunda |
| `apps/provisioning-cli` | Firma DB oluşturma, migration, doğrulama ve geri alma komutları | Faz 2C provisioning tasarımı onaylandığında |
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
| `packages/provisioning` | Firma kurulum/provisioning application use-case'i; DB create/migrate/verify, platform kayıt ve rollback sırası | UI, gerçek secret veya tenant operasyon verisi |
| `packages/identity-platform` | Platform auth, MFA, platform session ve izinler | Firma içi rol varsayımı |
| `packages/identity-tenant` | Firma kullanıcı, rol, izin, destek oturumu adapter’ı | Platform admin ayrıcalığı |
| `packages/ui` | Ortak tasarım sistemi, form, tablo/kart, shell parçaları | Domain iş kuralı |
| `packages/i18n` | Dil dosyaları, mesaj anahtarı, formatlama, RTL yardımcıları | DB durum metni çevirisi |
| `packages/documents` | Dekont, QR belge, PDF/HTML belge şablonları | Fiziksel dosya yolu sızıntısı |
| `packages/file-storage` | Yerel/S3 benzeri storage port/adapters | Doğrudan UI erişimi |
| `packages/contracts` | API/event sözleşmeleri, DTO, schema | Runtime iş kuralı |
| `packages/config` | Ortam, domain, URL, origin, trusted host, cookie ve public/private servis sözleşmeleri | Next.js, React, Prisma, app/domain kodu, secret değeri |
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
| `app` | Next.js sayfa ve API route’ları | `apps/tenant-web/app` | Faz 2A sonrası davranış değiştirmeyen taşıma paketi | Route import kırılması | Taşıma matrisi, import graph ve ortak paket sınırları | `pnpm build`, route smoke | Import alias revert |
| `modules` | UI, servis ve bazı domain mantığı karışık | Önce mevcut yerde standardize, sonra domain bazlı paket/app sınırı | Faz 2–6 | Büyük taşıma karmaşası | `module.manifest.ts` standardı | Unit + mock route | Modül bazlı revert |
| `shared` | Prisma, session, para, tarih, events, UI shell | `packages/core`, `packages/ui`, `packages/i18n`, `packages/event-bus`, `packages/observability` | Faz 6–7 | Her yerden import var | Alias haritası ve adapter planı | Typecheck + import graph | Paket çıkarma revert |
| `components` | UI primitive bileşenleri | `packages/ui` | Faz 7 | Stil kırılması | Tasarım token standardı | Component smoke | Eski import alias |
| `prisma` | Tek SQLite tenant şeması ve seed | `packages/database-tenant`, sonra `packages/database-platform` ayrı | Faz 5 ve 9 | Veri kaybı/migration | PG test DB, dry-run | Migration + mutabakat | DB backup restore |
| `tests` | Route/helper testleri | `tests`, `packages/testing`, modül içi `tests` | Faz 3 ve sonrası | Test keşfi bozulması | Test naming standardı | `pnpm test` | Test config revert |
| `scripts` | Seed, yedek, kontrol, migration yardımcıları | `scripts` + paket özel scriptleri | Faz 5–15 | Yanlış DB/script | Dry-run standardı | Script dry-run | Script revert |
| `public` | PWA manifest, ikon, SW, public asset | `apps/tenant-web/public`; firma assetleri storage/config | Faz 2A sonrası taşıma paketi | Firma markası sabit kalır | Branding ayrımı | PWA smoke | Eski public fallback |
| Runtime dosyaları/yüklemeler | `.next`, `data/uploads`, `backups`, SQLite WAL/SHM | Repo dışı runtime volume; `data` yalnız örnek/fixture | Faz 9–15 | Canlı dosya karışması | Storage port ve backup policy | File/security/restore | Runtime volume restore |

Toplu klasör taşıma yapılmayacaktır. Her taşıma küçük commit, test ve geri dönüş noktasıyla yapılır.

## Kök dizin tasnifi ve zorunlu taşıma matrisi

Mevcut kök dizin, Faz 2A kapsamında davranış değiştirmeden tasnif edilecek ve hedef monorepo/modüler monolit yapısına küçük, izlenebilir taşıma commitleriyle hazırlanacaktır. Bu bölüm plan niteliğindedir; şu anda toplu taşıma, silme veya runtime veri temizliği yapılmaz.

Zorunlu kurallar:

- `.env` Git’e eklenmez; yalnız `.env.example` şablon olarak kalır.
- `.next`, `node_modules` ve `*.tsbuildinfo` kaynak kod sayılmaz.
- `backups` ve gerçek `data` repo dışında runtime volume olarak tutulur.
- Örnek/seed verileri canlı veri içermediği kanıtlandıktan sonra `fixtures/` altına alınır.
- Git geçmişini korumak için `git mv` ile küçük taşıma commitleri kullanılır.
- Her taşıma commitinden sonra `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm lint`, `pnpm build` ve ilgili smoke testleri çalıştırılır.
- İşlevi doğrulanmadan hiçbir eski dosya silinmez; önce arşivleme veya redirect/fallback planı yapılır.
- Her taşıma için geri dönüş yöntemi commit revert veya alias/fallback revert olarak önceden yazılır.

### Kök öğe taşıma matrisi

| Sınıf | Mevcut konum | Hedef konum | Gerekçe | Bağımlılık | Taşıma fazı | Test | Geri dönüş |
|---|---|---|---|---|---|---|---|
| Kökte kalacak yapılandırma | `.gitignore` | `.gitignore` | Repo ignore politikası kökte olmalı. | Yok | Faz 2A | `git status --ignored`, `git diff --check` | Commit revert |
| Kökte kalacak yapılandırma | `AGENTS.md` | `AGENTS.md` | Codex kök talimatı kökte kalmalı. | Ana mimari belgeler | Faz 2A | Belge bağlantısı kontrolü | Commit revert |
| Kökte kalacak yapılandırma | `.env.example` | `.env.example` | Güvenli ortam değişkeni şablonu. | Secret taraması | Faz 2A | Secret scan, `pnpm check:utf8` | Commit revert |
| Repo dışında tutulacak secret | `.env` | Repo dışı yerel secret / deployment secret store | Gerçek bağlantı/parola/token riski; Git’e eklenmez. | `.gitignore`, deployment notu | Faz 2A | `git status --ignored`, secret scan | Dosya repo dışı korunur |
| Kökte kalacak yapılandırma | `package.json` | `package.json` | Workspace ve script giriş noktası. | pnpm workspace | Faz 2A | install, typecheck, test, lint, build | Commit revert |
| Kökte kalacak yapılandırma | `pnpm-lock.yaml` | `pnpm-lock.yaml` | Tek dependency lock kaynağı. | `package.json` | Faz 2A | `pnpm install --frozen-lockfile` | Commit revert |
| Kökte kalacak yapılandırma | `pnpm-workspace.yaml` | `pnpm-workspace.yaml` | Monorepo workspace tanımı kökte kalır. | `apps/*`, `packages/*` planı | Faz 2A | Workspace listeleme | Commit revert |
| Kökte kalacak yapılandırma | `tsconfig.json` | `tsconfig.json` | Ortak TS tabanı ve path alias kökte yönetilir. | App/package tsconfigleri | Faz 2A | `pnpm exec tsc --noEmit` | Commit revert |
| Gitignore’a alınacak üretilmiş dosya | `tsconfig.tsbuildinfo` | Git dışı build cache | TypeScript cache kaynak değildir. | `.gitignore` | Faz 2A | `git status --ignored` | Cache yeniden oluşur |
| Kökte kalacak yapılandırma | `eslint.config.mjs` | `eslint.config.mjs` | Repo genel lint kuralı. | App/package lint configleri | Faz 2A | `pnpm lint` | Commit revert |
| Kökte kalacak yapılandırma | `next.config.ts` | Geçici kök; sonra `apps/tenant-web/next.config.ts` | Mevcut Next app taşınana kadar kökte kalır. | `app`, `public`, middleware | Faz 2A sonrası taşıma | `pnpm build`, smoke | Git move revert |
| Kökte kalacak yapılandırma | `postcss.config.mjs` | Geçici kök; sonra app/package config ayrımı | Tailwind/PostCSS app taşımasına bağlı. | UI taşıma planı | Faz 2A sonrası | `pnpm build` | Git move revert |
| Kökte kalacak yapılandırma | `components.json` | Geçici kök; sonra `packages/ui` veya `apps/tenant-web` | UI generator ayarı ortak UI ayrışınca taşınır. | `packages/ui` | Faz 2A sonrası | UI build/smoke | Git move revert |
| Apps/tenant altına taşınacak kaynak | `app` | `apps/tenant-web/app` | Mevcut firma web uygulaması. | Import graph, alias planı | Faz 2A sonrası küçük move | Typecheck, test, lint, build, route smoke | Git move revert |
| Apps/tenant altına taşınacak kaynak | `middleware.ts` | `apps/tenant-web/middleware.ts` veya app-level middleware | Next runtime davranışına bağlı app sınırı. | Auth/session, route matcher | Faz 2A sonrası | Auth smoke, route protection | Git move revert |
| Apps/tenant altına taşınacak kaynak | `next-env.d.ts` | App tarafından yeniden üretilecek; kaynak kabul edilmez | Next generated type dosyasıdır. | Next build | Faz 2A sonrası | `pnpm build` | Yeniden üretim |
| Apps/tenant altına taşınacak kaynak | `public` | `apps/tenant-web/public`; firma assetleri storage/config | PWA/manifest/app assetleri app sınırına taşınır, firma varlıkları ayrılır. | Branding kararı, PWA smoke | Faz 2A sonrası | PWA/manifest smoke, build | Git move revert |
| Apps/tenant veya modül standardı | `modules` | Önce mevcut yerde standardize; sonra `apps/tenant-web/modules` veya domain paketleri | Karışık UI/domain kodu aşamalı ayrışmalı. | Module manifest, import graph | Faz 2A sonrası | Unit/route tests, build | Modül bazlı revert |
| Packages altına ayrıştırılacak kaynak | `shared` | `packages/core`, `packages/ui`, `packages/i18n`, `packages/event-bus`, `packages/observability` | Ortak kaynakların sahipliği ayrılmalı. | Adapter/alias planı | Faz 2A sonrası parçalı | Typecheck, unit, import boundary | Alias revert |
| Packages altına ayrıştırılacak kaynak | `components` | `packages/ui` | UI primitive sahipliği ortak UI paketine taşınır. | Design tokens | Faz 2A sonrası | Component smoke, build | Git move revert |
| Packages altına ayrıştırılacak kaynak | `prisma` | `packages/database-tenant`; sonra `packages/database-platform` | Tek SQLite şeması tenant/platform sınırına ayrılacak. | PG planı, migration dry-run | Faz 2C/2D | Migration dry-run, PG integration | DB backup + commit revert |
| Tests altında kalacak/ayrışacak | `tests` | `tests`, `packages/testing`, modül içi `tests` | Test harness ve modül testleri ayrılır. | Test naming/workspace config | Faz 2A sonrası | `pnpm test` | Test config revert |
| Scripts altına taşınacak araç | `scripts` | `scripts` + gerektiğinde package özel scriptleri | Bakım araçları zaten doğru kökte; dry-run/apply standardı eklenecek. | Script sahipliği | Faz 2A sonrası | Script dry-run, test | Commit revert |
| Scripts altına taşınacak araç | `baslat.bat` | `scripts/windows/baslat.bat` veya `scripts/dev/baslat.bat` | Yerel Windows başlatma aracı kaynak kökünü kirletmemeli. | Kullanıcı kısayolu/README güncellemesi | Faz 2A sonrası | Windows smoke, `pnpm start` | Git move revert |
| Scripts altına taşınacak araç | `durdur.bat` | `scripts/windows/durdur.bat` | Yerel durdurma aracı scripts sahipliğinde olmalı. | `baslat.bat` taşıması | Faz 2A sonrası | Manuel/ps process smoke | Git move revert |
| Scripts altına taşınacak araç | `yedek-acil.bat` | `scripts/windows/yedek-acil.bat` | Yedek aracı scripts altında açıkça işaretlenmeli. | Backup policy | Faz 2A sonrası | Dry-run/restore prova | Git move revert |
| Docs altına taşınacak belge | `README.md` | `README.md` + ayrıntılar `docs/` | Kök özet kalır; uzun mimari docs altında. | Belge linkleri | Faz 2A | Link check | Commit revert |
| Docs altına taşınacak belge | `CLAUDE.md` | `docs/archive/legacy/CLAUDE.md` | Eski ajan talimatı kökte bağlayıcı olmamalı; AGENTS kökte kalır. | AGENTS referansı | Faz 2A-0 tamamlandı | Belge link kontrolü | Git move revert |
| Docs altına taşınacak belge | `MIMARI.md` | `docs/archive/legacy/MIMARI.md` | Tarihsel mimari belge docs altında tutulmalı. | Yeni ana belge notu | Faz 2A-0 tamamlandı | Link check | Git move revert |
| Docs altına taşınacak belge | `DATABASE_FACE_AUDIT.md` | `docs/archive/legacy/DATABASE_FACE_AUDIT.md` | Audit dokümanı mimari docs altında izlenmeli. | Link güncelleme | Faz 2A-0 tamamlandı | Link check | Git move revert |
| Docs altına taşınacak belge | `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` | `docs/architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` | Kök kopya tekil ana belgeyle karışır; bir kaynak kalmalı. | Kullanıcı onayı, içerik karşılaştırma | Faz 2A-0 tamamlandı | Diff/link check | Git move veya kopya kaldırma revert |
| Fixtures altına alınacak örnek veri | `seed-data.example.json` | `fixtures/seed/seed-data.example.json` | Örnek veri fixtures altında açıkça ayrılır. | PII kontrolü, seed script path | Faz 2A-0 tamamlandı | Seed dry-run, tests | Git move revert |
| Fixtures veya arşiv | `seed-data.json` | `fixtures/seed/seed-data.json` veya repo dışı gerçek veri | Gerçek veri içerip içermediği belirlenmeden taşınmaz. | PII/secret inceleme | Faz 2A inceleme | PII scan, seed dry-run | Git move revert / repo dışı taşıma |
| Repo dışında tutulacak eski veri | `seed-data.eski.json` | Repo dışı güvenli veri arşivi | Eski seed olabilir; gerçek veri riski yüksek ve belge arşivine alınmaz. | PII inceleme, kullanıcı kararı | Faz 2A inceleme | PII scan | Repo dışı kopyadan dönüş |
| Repo dışında tutulacak runtime veri | `data` | Repo dışı runtime volume; fixtures ayrı | Upload/DB/runtime veri kaynak kod değildir. | Storage policy, backup planı | Faz 2C/15 | File security, restore prova | Runtime volume restore |
| Repo dışında tutulacak runtime veri | `backups` | Repo dışı backup dizini | Yedekler Git’e girmez. | Backup/restore policy | Faz 2A/15 | Restore prova, gitignore check | Repo dışı kopyadan dönüş |
| Gitignore’a alınacak üretilmiş dosya | `.next` | Git dışı build output | Next build çıktısıdır. | `.gitignore` | Faz 2A | `git status --ignored` | Yeniden build |
| Gitignore’a alınacak üretilmiş dosya | `node_modules` | Git dışı dependency cache | Paket yöneticisi çıktısıdır. | `.gitignore` | Faz 2A | `pnpm install --frozen-lockfile` | Yeniden install |
| Tamamlanan tekilleştirme | Kök belgelerin `docs/architecture` kopyaları | Tekil docs konumu | Aynı belgenin kök ve docs kopyası çelişki doğuruyordu. | İçerik karşılaştırma, kullanıcı onayı | Faz 2A-0 tamamlandı | Link/diff check | Git move revert |

### Kök sınıflandırma özeti

1. **Kökte kalacak yapılandırmalar:** `.gitignore`, `AGENTS.md`, `.env.example`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`; geçici olarak `next.config.ts`, `postcss.config.mjs`, `components.json`.
2. **`docs` altında tasnif edilen belgeler:** `CLAUDE.md`, `MIMARI.md`, `DATABASE_FACE_AUDIT.md` ve eski belgeler `docs/archive` altında; tek ana mimari belge `docs/architecture` altında tutulur.
3. **`scripts` altına taşınacak araçlar:** `baslat.bat`, `durdur.bat`, `yedek-acil.bat`; mevcut `scripts` korunur.
4. **Repo dışında tutulacak runtime verileri ve yedekler:** `.env`, `data`, `backups`, yerel DB/WAL/SHM ve upload içerikleri.
5. **`fixtures` altındaki örnek/seed verileri:** `fixtures/seed/seed-data.example.json`; gerçekliği doğrulanmayan `seed-data.json` ve `seed-data.eski.json` repo dışında kalır.
6. **Gitignore’a alınacak üretilmiş dosyalar:** `.next`, `node_modules`, `tsconfig.tsbuildinfo`, generated build/cache çıktıları.
7. **`apps/tenant-*` altına taşınacak uygulama kaynakları:** `app`, `middleware.ts`, `public`, tenant UI/route parçaları.
8. **`packages` altına ayrıştırılacak ortak kaynaklar:** `shared`, `components`, veritabanı adapterleri, i18n, hata, audit, event, UI ve test yardımcıları.
9. **Arşivlenecek veya kaldırılacak eski dosyalar:** eski ajan/prompt belgeleri, eski seed dosyaları, tarihsel sprint dosyaları; kaldırma yalnız doğrulama ve kullanıcı onayı sonrası.
10. **Sahipliği belirsiz/incelenecek dosyalar:** kök ana belge kopyası, canlı veri olabilecek seed dosyaları, eski batch dosyalarının operasyonel kullanım durumu.

## Dizin dönüşüm fazları

| Aşama | Giriş şartı | Değişecek alanlar | Testler | Build kontrolü | Smoke testi | Commit noktası | Geri dönüş |
|---|---|---|---|---|---|---|---|
| 1. Faz 2A mimari sözleşme ve iskelet | Faz 1 commit’i ve ana belge uyumu | Workspace/dizin sözleşmesi, import graph, taşıma matrisi, platform/tenant contract, domain/origin config | Belge bağlantısı, mimari kural kontrolleri, sözleşme testleri | `pnpm build` davranış değişmeden geçmeli | Giriş + kritik route smoke | `feat(faz-2a): workspace ve mimari sınırları oluştur` ve domain/origin sözleşme commit’i | Commit revert |
| 2. Saha satış modüler pilotu | Erken pilot olarak tamamlandı | `/api/saha-satis`, tahsilat/hisse use-case | Unit, mock route | `pnpm build` | Kaporalı/kaporasız satış | `b536078` erken pilot commit’i | Route eski adaptöre döner |
| 3. Müşteri/hayvan/hisse modülleri | Pilot kalıbı kanıtlandı | Domain/application ayrımı | Unit + route | `pnpm build` | Müşteri/hisse atama | Modül bazlı commit | Modül revert |
| 4. Tahsilat ve finans modülleri | PG test harness hazır | Tahsilat, kasa, ledger hazırlığı | Ledger unit, concurrency | `pnpm build` | Tahsilat/dekont | Finans checkpoint | Backup + revert |
| 5. Vekâlet/kesim/paket/teslimat | Dosya ve workflow portları hazır | Vekâlet, state machine | Workflow + security | `pnpm build` | Dosya/TV/teslim | Operasyon checkpoint | Feature flag kapat |
| 6. `shared` ayrıştırması | Domain sınırları net | Shared alt parçaları | Import graph + unit | `pnpm build` | Ana sayfalar | Paket hazırlık commitleri | Alias revert |
| 7. `packages/core`, `ui`, `i18n`, `contracts` | Shared ayrıştırması güvenli | İlk gerçek packages | Unit + component | `pnpm build` | UI/i18n smoke | Package checkpoint | Workspace revert |
| 8. Mevcut uygulama `apps/tenant-web` | Import alias stabil | App taşıma | Full test | `pnpm build` | Login, müşteri, satış | Move commit | Git move revert |
| 9. Platform/firma DB sınırı | Tenant app stabil | DB packages, provisioning | PG integration | `pnpm build` | İki firma izolasyon | DB boundary commit | Backup restore |
| 10. `apps/platform-admin` | Platform DB/IAM hazır | Platform UI/API | Security + MFA | `pnpm build` | Platform login | Platform checkpoint | Feature flag |
| 11. Worker/entegrasyon ajanları | İş gereksinimi gerçek | Worker, gateway, agents | Integration + offline | `pnpm build` | Yedek/lisans heartbeat | Agent checkpoint | Agent kapat |

## Kabul kriteri

- Bu belge onaylanmadan fiziksel dizin taşıması yapılmaz.
- UTF-8/i18n temeli Faz 1’de tamamlandı.
- Sıradaki aşama Faz 2A’dır; bu aşama workspace/sözleşme/sınır paketiyle başlamıştır fakat tamamlandı kabul edilmez. Fiziksel taşıma veya kod davranışı değiştirme başlamadan önce mimari sözleşme, gelişmiş dizin/monorepo iskeleti ve taşıma planı testlerle kanıtlanmalıdır.
