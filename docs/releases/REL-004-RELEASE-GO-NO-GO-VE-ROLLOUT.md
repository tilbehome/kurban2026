# Release, Go/No-Go ve Kademeli Yayın Planı

```yaml
id: REL-004
title: Release, Go/No-Go ve Kademeli Yayın Planı
status: REVIEW
owner: Release
reviewers: [Product, QA, Security, Operations, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_RELEASE_ADAYINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-063, REQ-064, PRO-014, PRO-015, PRO-016, PRO-021, PRO-031]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [operations, platform, feature-flags, provisioning]
related_tests: [TST-001, TST-011, TST-014]
supersedes: []
superseded_by: null
```

## Release kimliği

Her release tek commit SHA, immutable artifact digest, uygulama sürümü, migration seti, config/feature flag snapshot’ı, SBOM/provenance ve kanıt indeksiyle tanımlanır. Dal veya “latest” etiketi release kimliği değildir.

## Hazırlık

- Kapsam, kullanıcı/tenant etkisi, risk sahibi ve destek planı.
- Gereksinim/ADR/domain/test/release bağlantıları ve güncel bilinen sorunlar.
- Typecheck, test, lint, build, secret/dependency ve mimari sınır sonuçları.
- PostgreSQL gerekiyorsa gerçek integration; skip/flake/failure görünür.
- Migration ön kontrolü, doğrulanmış yedek ve rollback/roll-forward planı.
- Tenant izolasyonu, ledger/veri bütünlüğü, güvenlik, E2E/axe, yük ve restore kanıtı riskle orantılı.
- Dashboard/alarm/runbook, nöbet, bakım ve firma iletişimi hazır.

## Kesin no-go

- Açık kritik/yüksek tenant sızıntısı, auth bypass, finans/teslim bütünlüğü bulgusu.
- Migration drift, test edilmemiş destructive adım veya doğrulanmamış backup.
- Gerekli testin `NOT_RUN/SKIPPED/BLOCKED` olması ve onaylı alternatif kontrol bulunmaması.
- Artifact/commit/migration/kanıt eşleşmemesi.
- Rollback/roll-forward, telemetry veya olay sorumluluğunun belirsiz olması.
- Kurban Günü kritik sürümü için tam prova ve operasyon sign-off eksikliği.

## Rollout

1. Sürüm dondurma ve imzalı aday.
2. Staging smoke + kritik E2E + migration/restore doğrulaması.
3. Internal/sentetik tenant.
4. Onaylı pilot/canary tenant.
5. Gözlem penceresi: kullanıcı yolu, DB/pool, queue, ledger/tenant doğruluk ve hata bütçesi.
6. Kademeli cohort; her aşamada otomatik durdurma ölçütü.
7. Genel yayın ve production health doğrulaması.

Gözlem penceresi ve eşikler baseline/SLO olmadan uydurulmaz; release planında sayısal ve onaylı olmalıdır.

## Durdurma ve geri dönüş

Semptom, hata bütçesi, tenant/ledger invariant veya alarm eşiği aşılırsa rollout durur. Uygulama rollback’i ile DB rollback’i ayrı karardır. Uyumlu schema’da uygulama geri alınabilir; destructive/uyumsuz schema’da ileri düzeltme veya onaylı restore gerekir. Ayrıntı [migration planındadır](REL-005-MIGRATION-VE-ROLLBACK.md).

## Kanıt

Go/no-go kararı toplantı notu değildir; [EVD-012](../evidence/EVD-012-RELEASE-GO-NO-GO-SABLONU.md) içinde karar verenler, açık riskler, commit/artifact ve gerçek sonuçlar bulunur. Varsayılan karar `NO_GO/NOT_DECIDED` olur.
