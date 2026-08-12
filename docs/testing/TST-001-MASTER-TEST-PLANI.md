# Master Test Planı

```yaml
id: TST-001
title: Master Test Planı
status: REVIEW
owner: QA
reviewers: [Engineering, Security, Operations, Product]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_RELEASE_ADAYINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-001, REQ-068, PRO-011, PRO-021, PRO-023, PRO-024, PRO-027, PRO-031]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [all]
related_tests: [TST-004, TST-006, TST-008, TST-010, TST-011]
supersedes: []
superseded_by: null
```

## Amaç ve gerçek durum

Bu plan gereksinim → risk → test → kanıt → release kararını tanımlar. Repo unit, route, mimari sınır ve koşullu gerçek PostgreSQL testleri içerir. Playwright, axe, gerçek cihaz, yük, offline sync, WAL/PITR ve tam Kurban Günü prova kanıtları henüz mevcut kabul edilmez.

`74915b6f3f1f8d53116b760b6a6be9797111efa5` için [TilbeCore CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) doğrulanmıştır: koşu `completed/success` durumundadır ve `headSha` bu tam commit SHA’sıyla eşleşir. Başarılı job; UTF-8, Platform/Tenant Prisma validate-generate, provisioning CLI dry-run, Platform/Tenant PostgreSQL migration apply, Platform PostgreSQL integration, iki-tenant web/pool/backup-restore izolasyonu, TypeScript, unit/route, lint, ana ve Platform Admin build, PWA artefakt ve Git diff kontrollerini çalıştırmıştır. Koşuda Playwright/axe, fiziksel HTTPS passkey, gerçek cihaz, yük/soak, offline cihaz veya WAL/PITR adımı yoktur; bunlar doğrulanmış sayılmaz.

## Test katmanları

| Katman | Amaç | Asgari kapı |
|---|---|---|
| Domain unit | Invariant, Money/Measurement, state machine | Normal/sınır/hata/ters işlem |
| Application | Yetki niyeti, idempotency, transaction orkestrasyonu | Kısmi başarı yokluğu |
| Contract/architecture | Public API, event, import ve package sınırı | Uyumsuzluk fail |
| PostgreSQL integration | Migration, constraint, repository, transaction, pool | Gerçek PostgreSQL ve temiz ortam |
| Security/tenant | Auth, session, host/ref, SupportSession, sızıntı | Negatif iki firma matrisi |
| Route/UI | Validation, güvenli hata, rol görünümü | Doğrudan API negatifleri |
| E2E/accessibility | Kritik yol, cihaz, locale, RTL, klavye | Playwright + axe + manuel kontrol |
| Performance/resilience | Load, spike, soak, dependency failure | Baseline, bütçe ve bottleneck raporu |
| Operational | Deploy, rollback, backup, restore, PITR, incident | Tatbikat ve imzalı kanıt |
| UAT/simulation | Gerçek görev akışı | Rol sahibi sign-off; sentetik veri |

## Risk öncelikli kritik yollar

1. Tenant çözümleme → oturum → DB ref → doğru fiziksel DB.
2. Müşteri → hisse satışı → fiyat snapshot → tahsilat/ledger → audit/outbox.
3. Yedi hisse ve vekâlet → kesim → tartım → paket → tek teslim.
4. Kasa açılış → karma ödeme → iade/ters kayıt → sayım/mutabakat.
5. Ağ kesintisi → izinli kuyruk → yeniden sync → çatışma/uzlaştırma.
6. Backup → checksum → geçici restore → tenant/şema/ledger doğrulama.
7. Release → migration → canary → telemetry → rollback/roll-forward.

## Ortam ve veri

- Unit/contract testleri deterministik sentetik fixture kullanır.
- Integration ortamı production’dan ayrı PostgreSQL instance/DB ve secret kullanır.
- Tenant testi en az iki firma, ayrı fiziksel DB ve aynı kayıt ID’lerini içerir.
- E2E/UAT gerçek kişisel veri kullanmaz; sentetik isim/telefon/finans üretir.
- Test temizliği yalnız test tarafından sahipliği kanıtlanan hedefleri kaldırır.
- Production’da test yazısı ancak açık, onaylı smoke planıyla ve geri alınabilir veriyle yapılır.

## Mevcut repo komutları

```text
pnpm check:utf8
pnpm exec tsc --noEmit
pnpm test
pnpm lint
pnpm build
pnpm test:platform-postgres
pnpm test:tenant-isolation
```

PostgreSQL komutları gerekli environment ve opt-in flag olmadan atlanabilir. “Exit 0” tek başına integration testinin çalıştığını kanıtlamaz; koşan/atlanan test sayısı ve environment profili kanıta yazılır. Playwright/axe/yük komutu repo scripti olarak henüz yoksa komut uydurulmaz.

## Giriş ve çıkış kriterleri

Giriş: gereksinim/acceptance, veri-migration etkisi, yetki matrisi, sentetik veri, test ortamı ve rollback yöntemi hazırdır.

Çıkış:

- Kapsamdaki bloklayıcı testler koşmuş ve sonuç/atlama bilgisi kaydedilmiştir.
- Kritik/yüksek açık güvenlik, tenant veya finans bulgusu yoktur.
- Başarısız/flake/istisna sonuçları sahibi ve süresiyle görünürdür.
- Migration/backup etkisinde restore kanıtı vardır.
- Release adayı commit/artifact ile kanıt birebir eşleşir.

## Sonuç dili

`NOT_RUN`, `RUNNING`, `PASSED`, `FAILED`, `BLOCKED`, `SKIPPED_WITH_REASON`. Şablon varsayılanı `NOT_RUN` olur; boş alan veya belge varlığı başarı sayılmaz. Kanıt standardı [evidence indeksinde](../evidence/README.md) tanımlıdır.
