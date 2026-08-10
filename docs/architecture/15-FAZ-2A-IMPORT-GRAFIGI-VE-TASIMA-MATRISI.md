# 15 — Faz 2A Import Grafiği ve Taşıma Matrisi

Birinci kaynak: `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md`.

Bu belge Faz 2A kapsamında davranış değiştirmeden çıkarılan import grafiğini, bağımlılık sınırlarını ve sonraki küçük taşıma paketlerinin matrisini tutar. Bu paket uygulama route davranışını, Prisma şemasını, veritabanını veya mevcut app dizinlerini taşımaz.

## Doğrulama kanıtı

Başlangıç commit’i:

- `120afa16e8b635823a80b0967cbfe18e651bd2ad`

İncelenen komutlar:

- `git log --oneline --decorate -n 12`
- `rg --files app modules shared components tests scripts`
- Modül ve kök bazlı `import/export ... from` satır sayımı
- `rg -n "from ...(@/shared/lib/prisma|@prisma/client|next|react)..." app modules shared components tests`
- `Get-Content -Raw package.json`
- `Get-Content -Raw pnpm-workspace.yaml`
- `Get-Content -Raw tsconfig.json`
- `Get-Content -Raw vitest.config.ts`

## Faz sınıflandırması

`b536078` commit’i “erken tamamlanan saha satış modüler pilotu” olarak sınıflandırılır.

Bu commit:

- `/api/saha-satis` route’unu ince adaptöre yaklaştırmıştır,
- saha satış iş kurallarını `modules/tahsilat/application` ve `modules/tahsilat/domain` altına ayırmıştır,
- transaction, idempotency, audit ve merkezi hata akışını koruyan pilot kanıt üretmiştir.

Bu commit Faz 2A’nın tamamlandığı anlamına gelmez. Faz 2A’nın gerçek kapsamı workspace/paket sözleşmesi, mimari sınır testi, import grafiği, taşıma matrisi ve platform/tenant TypeScript sözleşmeleridir.

## Mevcut workspace durumu

`package.json` kök uygulama paketidir ve Next.js uygulaması hâlâ kökte çalışır.

Faz 2A öncesinde `pnpm-workspace.yaml` dosyasında `packages` deseni yoktu; yalnız `allowBuilds` politikası vardı. Bu pakette davranış değiştirmeden `packages/*` workspace deseni eklenmiştir. Boş `apps/*` veya göstermelik klasör oluşturulmamıştır.

İlk gerçek paket:

- `packages/contracts`
- `packages/config`

`packages/contracts` platform/tenant TypeScript sözleşmelerini içerir. `packages/config` ortam, domain, URL, origin, trusted host, cookie ve public/private servis sözleşmesini içerir. Bu paketlerde Next.js, React, Prisma, uygulama route’u veya veritabanı bağımlılığı yoktur.

## Kök bazlı import grafiği

| Kök | TS/TSX/MTS/MJS dosya sayısı | Import/export satırı | Durum |
|---|---:|---:|---|
| `app` | 225 | 883 | Next route/page ağırlıklı tenant web uygulaması; Prisma ve Next importları yaygın. |
| `modules` | 170 | 744 | UI, servis, lib, domain ve application karışık; saha satış pilotu ayrışmış ilk örnektir. |
| `shared` | 57 | 132 | Prisma, session, hata, i18n, audit, UI shell ve yardımcılar karışık ortak alan. |
| `components` | 15 | 51 | UI primitive bileşenleri; hedefte `packages/ui` adayıdır. |
| `tests` | 8 | 15 | Vitest route/unit testleri; Faz 2A’da mimari sınır testleri eklendi. |
| `scripts` | 11 | 17 | Bakım, migration hazırlık ve kontrol scriptleri. |

## Modül bazlı import grafiği

| Modül | Dosya | Import/export satırı | Gözlem | Hedef |
|---|---:|---:|---|---|
| `_core` | 3 | 4 | Ayar servisi doğrudan Prisma kullanıyor. | `packages/core` ve tenant adapter ayrımı sonrası netleştirilecek. |
| `_example` | 2 | 3 | Örnek modül. | Standart manifest örneği veya arşiv kararı gerekir. |
| `dashboard` | 13 | 57 | Servis ve UI birlikte. | Read-model/panel ayrımı sonrası taşınacak. |
| `hayvanlar` | 28 | 143 | UI ve servis yoğun; Prisma servisleri var. | Faz 4/5 küçük modül paketleri. |
| `kasa` | 3 | 5 | Finans servisleri Prisma’ya bağlı. | Ledger fazı sonrası ayrılacak. |
| `kesim` | 2 | 10 | UI bileşenleri. | Operasyon motoru sonrası ayrılacak. |
| `musteriler` | 29 | 158 | UI, servis ve müşteri yardımcıları karışık. | Faz 3 müşteri/sezon modeli sonrası ayrılacak. |
| `raporlar` | 8 | 35 | Rapor UI ve servisleri karışık. | Ledger/read-model sonrası ayrılacak. |
| `tahsilat` | 23 | 52 | Saha satış domain/application pilotu mevcut; lib servislerinde Prisma sürüyor. | Faz 2A pilot kanıtı + Faz 6 ledger geçişi. |
| `tv` | 40 | 182 | TV UI, hook ve servisleri karışık. | Faz 10 public/display sınırı sonrası ayrılacak. |
| `vekalet` | 5 | 31 | Dosya/vekalet UI bileşenleri. | Faz 7 belge ve dosya portları sonrası ayrılacak. |
| `whatsapp` | 14 | 64 | Şablon, UI ve servisler karışık. | Bildirim entegrasyon sınırı sonrası ayrılacak. |

## Bağımlılık sınırları

Faz 2A’da testle yakalanan ilk sınırlar:

| Alan | İzinli yön | Yasaklanan bağımlılık | Test |
|---|---|---|---|
| `packages/contracts` | Salt TypeScript sözleşmeleri | Next.js, React, Prisma, `@/app`, `@/modules`, `@/shared`, `@/components` | `tests/architecture-boundaries.test.ts` |
| `packages/config` | Ortam/domain/origin üretimi ve host validasyonu; yalnız `packages/contracts` tiplerini kullanabilir | Next.js, React, Prisma, `@/app`, `@/modules`, `@/shared`, `@/components` | `tests/architecture-boundaries.test.ts`, `tests/saas-domain-config.test.ts` |
| `packages/*/package.json` | Paket manifestleri davranışsız sözleşme ve config bağımlılıklarını taşır | Next.js, React, Prisma ve uygulama alias paket bağımlılıkları | `tests/architecture-boundaries.test.ts` |
| `modules/**/domain` | Domain kuralı ve framework bağımsız yardımcılar | Next.js, React, Prisma, route adapterleri, dosya sistemi | `tests/architecture-boundaries.test.ts` |
| `modules/**/application` | Use-case orkestrasyonu | Next.js, React, doğrudan Prisma client değeri, route/UI importları | `tests/architecture-boundaries.test.ts` |

Geçiş notu: `modules/tahsilat/application` içinde yalnız `import type { Prisma } from "@prisma/client"` kullanımı mevcut transaction tipi için geçici olarak kabul edilir. Değer olarak Prisma client importu ve `@/shared/lib/prisma` importu yasaktır.

## Platform/tenant sözleşmesi

`packages/contracts/src/platform-tenant.ts` içinde şu sözleşmeler oluşturuldu:

- platformun görebileceği tenant metadata descriptor’ı,
- tenant runtime context,
- opaque `TenantDatabaseRef`,
- support session sözleşmesi,
- platform/tenant olay tipleri,
- platform descriptor içinde bağlantı parolası, token, secret veya connection string taşınmasını reddeden runtime doğrulama,
- support session yokken platformun müşteri/finans/vekalet/hisse/kesim/teslim operasyon verisini okuyamayacağını belirten yardımcı.

Test:

- `tests/platform-tenant-contracts.test.ts`

## Domain/origin config sözleşmesi

`packages/config/src/saas-domain-config.ts` içinde şu kararlar kodla testlenebilir sözleşmeye bağlandı:

- production base domain: `tilbecore.com`,
- production domain sahipliği doğrulandı; bağlayıcı değer `BASE_DOMAIN=tilbecore.com`,
- staging base domain: `staging.tilbecore.com`,
- local base domain: `tilbecore.test`,
- platform origin: `https://console.{baseDomain}`,
- tenant origin: `https://{tenantSlug}.{baseDomain}`,
- tenant yüzeyleri: `/giris`, `/panel`, `/saha`, `/tv`, `/takip/{opaqueToken}`, `/q/{opaqueToken}`, `/davet/{opaqueToken}`, `/api/v1`,
- reserved subdomain listesi,
- host header normalize ve validasyon kuralları,
- platform/tenant/system/custom domain host ayrımı,
- custom domain aktiflik için DNS + TLS + `ACTIVE` koşulu,
- private servisler için public URL üretmeme kuralı,
- platform/tenant cookie namespace sözleşmesi.

Test:

- `tests/saas-domain-config.test.ts`

## Taşıma matrisi

| Mevcut konum | Hedef konum | Gerekçe | Bağımlılık | Taşıma fazı | Test | Geri dönüş |
|---|---|---|---|---|---|---|
| `app/api/*` | Önce ince adapter standardı; sonra `apps/tenant-web/app/api/*` | Route’larda Next/Prisma yoğun; davranış kırmadan önce adapter/use-case ayrımı gerekir. | Merkezi hata, session, izin, import graph | Faz 2A sonrası route bazlı | Route unit + smoke + build | Route commit revert |
| `app/*` page/component | `apps/tenant-web/app/*` | Mevcut tenant web uygulaması. | Alias planı ve public asset planı | Faz 2A sonrası ayrı taşıma paketi | Typecheck, lint, build, login smoke | `git mv` revert |
| `middleware.ts` | `apps/tenant-web/middleware.ts` veya kök uyum katmanı | Next middleware davranışı route yapısına bağlı. | Auth/session route eşleşmeleri | App taşıma paketi | Auth smoke + build | Middleware move revert |
| `public` | `apps/tenant-web/public`; firma assetleri storage/config | PWA/manifest app assetidir, firma verisi public altında olmamalı. | PWA smoke, asset referans taraması | App/public taşıma paketi | Build + asset smoke | `git mv` revert |
| `modules/tahsilat/domain` | Mevcut yerde standart; sonra `packages/core` veya tenant domain paketi | Saha satış domain pilotu hazır. | Para/hata core ayrımı | Faz 3–6 | Unit + architecture test | Modül commit revert |
| `modules/tahsilat/application` | Mevcut yerde standart; sonra tenant application sınırı | Use-case pilotu mevcut. | Repository portları ve Prisma type bağımlılığı azaltma | Faz 3–6 | Unit + route tests | Use-case commit revert |
| `modules/*/lib` | Domain/application/infrastructure ayrımı | Servislerde Prisma erişimi var. | Repository port standardı | İlgili iş fazları | Unit + integration | Modül bazlı revert |
| `shared/lib/prisma.ts` | `packages/database-tenant` adapter | DB erişimi tek noktada ama shared altında. | PostgreSQL/tenant routing | Faz 2C | Tenant isolation + integration | DB adapter revert |
| `shared/lib/api-hata.ts` | `packages/core` veya API adapter paketi | Hata standardı ortak ama NextResponse içeriyor. | Framework bağımsız hata modeli | Faz 2A sonrası | Unit + architecture test | Alias revert |
| `shared/lib/i18n.ts` | `packages/i18n` | Dil/RTL ortak sözleşme. | Çeviri dosyaları | Dil fazı | i18n unit + UI smoke | Alias revert |
| `shared/components/*` | `packages/ui` veya `apps/tenant-web` | Bazıları app shell, bazıları ortak UI. | Tasarım sistemi ayrımı | Faz 7/10/11 | Component/build smoke | Alias revert |
| `components/ui/*` | `packages/ui` | UI primitive bileşenleri. | Tailwind/shadcn ayarı | UI paket fazı | Build + component smoke | `git mv` revert |
| `tests/*` | `tests`, modül içi tests, `packages/testing` | Route/unit/mimari testleri ayrılacak. | Vitest include standardı | Faz 2A sonrası | `pnpm test` | Test config revert |
| `scripts/*` | `scripts` veya ilgili package scripti | Bakım araçları zaten ayrı; sahiplik netleştirilecek. | Dry-run/apply standardı | Faz 2A sonrası | Script dry-run | Script commit revert |
| `prisma/*` | `packages/database-tenant`; sonra platform DB ayrı | Tek SQLite şeması hâlâ kökte. | PostgreSQL ve migration planı | Faz 2C/2D | Migration dry-run + backup restore | DB backup + revert |

## Faz 2A çıkış şartı durumu

| Çıkış şartı | Durum | Kanıt |
|---|---|---|
| Workspace durumu doğrulandı | Karşılandı | `pnpm-workspace.yaml` incelendi; `packages/*` deseni eklendi. |
| Gerçek sözleşme paketi var | Karşılandı | `packages/contracts` TypeScript sözleşme ve test içeriyor. |
| Gerçek config paketi var | Karşılandı | `packages/config` TypeScript URL/origin sözleşmesi ve test içeriyor. |
| Platform/tenant TS sözleşmeleri var | Karşılandı | `PlatformTenantDescriptor`, `TenantRuntimeContext`, `TenantDatabaseRef`, `SupportSessionContract`. |
| Profesyonel domain/origin sözleşmesi var | Karşılandı | `packages/config`, ADR-0001 ve `tests/saas-domain-config.test.ts`. |
| Paket/app bağımlılık sınırları tanımlandı | Karşılandı | Bu belge ve `tests/architecture-boundaries.test.ts`. |
| Yasak bağımlılıkları yakalayan test var | Karşılandı | `tests/architecture-boundaries.test.ts`. |
| Mevcut import grafiği çıkarıldı | Karşılandı | Kök ve modül bazlı sayım tablosu. |
| Mevcut modüller için taşıma matrisi var | Karşılandı | Bu belgedeki taşıma matrisi. |
| Toplu app/modules/shared taşıması yapılmadı | Karşılandı | Bu pakette fiziksel kaynak taşıma yok. |
| Prisma/DB değişmedi | Karşılandı | `prisma/` değişmedi; DB kurulumu yok. |
| Faz 2A tamamen kapandı | Eksik | Platform DB, tenant routing, PG isolation ve gerçek app taşıma sonraki Faz 2B/2C ve taşıma paketlerinin konusudur; bu paket yalnız Faz 2A’nın workspace/sözleşme/sınır kısmını karşılar. |
