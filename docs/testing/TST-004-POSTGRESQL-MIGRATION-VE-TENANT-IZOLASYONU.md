# PostgreSQL Integration ve Migration Test Planı

```yaml
id: TST-004
title: PostgreSQL Integration ve Migration Test Planı
status: PLANNED
owner: QA
source_role: test_plan
reviewers: [Data, Security, Platform, Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HER_SCHEMA_VE_TENANT_RUNTIME_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-049, REQ-059, REQ-062, REQ-066, PRO-020, PRO-021, PRO-029]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [database-platform, database-tenant, provisioning, tenant-runtime, tenant-web-runtime]
related_tests: [TST-004, TST-005]
supersedes: []
superseded_by: null
```

## Mevcut otomasyon

- `packages/database-platform/tests/platform-postgres.integration.test.ts`: platform migration apply/replay/drift, constraint, repository, transaction, idempotent iş, challenge/recovery tek kullanım ve hassas alan sızıntısı kontrolleri.
- `packages/database-tenant/tests/tenant-isolation.integration.test.ts`: tenant migration/provisioning ile gerçek dump/geçici restore akışını da çalıştırır; izolasyon kabulü ayrı [TST-005](TST-005-TENANT-IZOLASYONU.md) planındadır.
- Bu testler environment flag’leri yoksa atlanır; koşmuş sayılmaları için çıktı kanıtı gerekir.
- Legacy Next.js route’larının tamamı tenant runtime’a taşınmış değildir; kapsama alınmayan route’lar ayrıca risk olarak tutulur.

[TilbeCore CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803), `74915b6f3f1f8d53116b760b6a6be9797111efa5` commit’i için Platform/Tenant PostgreSQL migration apply ve Platform PostgreSQL integration adımlarını `success` sonucuyla çalıştırmıştır. Bu kanıt CI test ortamıyla sınırlıdır; production migration veya canlı restore kanıtı değildir.

## Test kurulumu

- Ayrı platform PostgreSQL ve en az iki tenant PostgreSQL DB.
- Birbirinden ayrılmış test credentials ve hiçbir production endpoint’i içermeyen config.
- Tenant A/B için aynı schema/migration sürümü, aynı season/customer/share gibi kimlikler ve ayırt edilebilir sentetik değerler.
- Testin oluşturduğu schema/DB/dump/geçici dizinleri sahiplik etiketiyle izleme.
- Başlangıç ve bitişte açık bağlantı, geçici DB ve artefakt envanteri.

## Migration matrisi

| Senaryo | Beklenen |
|---|---|
| Boş DB’ye tam zincir | Tüm migration’lar sırayla uygulanır; schema doğrulanır |
| Eski desteklenen sürüm → güncel | Kayıtlar korunur; yeni constraint/index geçerli |
| Aynı deploy’un tekrarı | Pending yok; veri veya sürüm bozulmaz |
| Yarım/başarısız migration | Durum görünür; otomatik destructive geri alma yok |
| Drift | Release/migration kapısı bloklanır |
| Constraint | FK/unique/check ihlali gerçek PostgreSQL’de reddedilir |
| Transaction | Hata bütün yazıları rollback eder |
| Geri dönüş | Expand-contract veya ileri düzeltme; planlı restore noktası |

## Tenant migration matrisi

Her tenant migration sonucu ayrı kaydedilir. Aynı migration seti Tenant A’da başarılıyken Tenant B’de başarısız olabilir; toplu başarı yazılmaz. Provisioning marker/ref sahipliği, DB oluşturma/varlık kontrolü, resume/idempotency ve yalnız aynı işin sahip olduğu tamamlanmamış hedef için rollback sınırı doğrulanır.

## Çalıştırma kapısı

Komutlar repo scriptidir; secret değerler kanıta kopyalanmaz:

```text
RUN_PLATFORM_POSTGRES_TESTS=1 + PLATFORM_TEST_DATABASE_URL ile pnpm test:platform-postgres
RUN_TENANT_ISOLATION_TESTS=1 + gerekli platform/tenant test DB referansları ile pnpm test:tenant-isolation
```

Ortam değişkenlerinin tam adları test dosyası ve güncel CI tanımından doğrulanır. Dokümandaki açıklama copy/paste secret veya production komutu değildir.

## Kabul ve kanıt

- Her assertion gerçekten koşmuştur; skip yoktur veya gerekçesi release engelidir.
- Test sonrası Tenant A/B, platform DB, dump, geçici restore ve cleanup sonuçları kaydedilir.
- Kayıt sayısı, schema/migration sürümü ve tenant marker/ref doğrulanır.
- Aynı test en az bir kez CI veya tekrarlanabilir izole ortamda çalışır.
- Migration sonucu [EVD-002](../evidence/EVD-002-MIGRATION-SABLONU.md) ile; tenant sınırı ayrı [EVD-003](../evidence/EVD-003-TENANT-IZOLASYON-SABLONU.md) ile kaydedilir.

WAL/PITR bu testin tamamlandığı anlamına gelmez; ayrı [restore/WAL/PITR planı](../operations/OPS-008-RESTORE-WAL-PITR.md) ve tatbikat kanıtı gerekir.
