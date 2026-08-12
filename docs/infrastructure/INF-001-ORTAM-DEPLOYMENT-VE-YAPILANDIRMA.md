# Ortam, Deployment ve Yapılandırma Standardı

```yaml
id: INF-001
title: Ortam, Deployment ve Yapılandırma Standardı
status: PLANNED
owner: Operations
source_role: infrastructure_operating_standard
reviewers: [Architecture, Security, Release]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: CANLI_TOPOLOJI_SECIMINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-051, REQ-063, REQ-064, PRO-014, PRO-016, PRO-022]
related_adrs: [ADR-0001, ADR-0002, ADR-0003]
related_modules: [config, platform-admin, tenant-runtime, worker, provisioning]
related_tests: [TST-004, TST-011]
supersedes: []
superseded_by: null
```

## Durum

Local/staging/production domain sözleşmesi ve uygulama paketleri vardır; canlı sağlayıcı, DNS/TLS/reverse proxy, container orchestration, object storage ve telemetry deployment’ı bu repo kanıtlarıyla tamamlanmış değildir. Bu belge hedef standardı ve yayın kapısını tanımlar.

## Ortam ayrımı

| Alan | Local | Staging | Production |
|---|---|---|---|
| Base domain | `tilbecore.test` | `staging.tilbecore.com` | `tilbecore.com` |
| Veri | Sentetik | Sentetik/maskeli ve geri alınabilir | Gerçek tenant verisi |
| DB/secret/storage | Ayrı | Ayrı | Ayrı; en dar workload erişimi |
| Cookie/origin | Local namespace | Staging namespace | Production namespace |
| Telemetry | Geliştirici | Kabul/prova | Canlı izleme; PII/secret yok |
| Release | Geliştirici build’i | İmzalı aday/pilot | Onaylı immutable artifact |

Bir ortamın credential, DB, bucket, queue, cookie anahtarı veya telemetry endpoint’i başka ortamda kullanılmaz.

## Hedef deployment akışı

1. Commit ve temiz kaynak kapsamı doğrulanır.
2. Tekrarlanabilir immutable artifact üretilir; sürüm/commit/provenance bağlanır.
3. Typecheck, test, lint, build, secret/dependency taraması ve SBOM kapıları çalışır.
4. Migration expand/contract uyumu, backup ve rollback/roll-forward planı incelenir.
5. Staging smoke, tenant negatifleri ve kritik E2E koşar.
6. Pilot/canary tenant veya instance’a aynı artifact yayınlanır.
7. Telemetry, veri bütünlüğü ve hata bütçesi gözlem penceresinde izlenir.
8. Kademeli rollout yapılır; eşik aşımında otomatik durdurulur.
9. Production doğrulama, sürüm matrisi ve kanıt indeksi kapatılır.

## Yapılandırma ve secret

- Domain/origin merkezi tipli config’ten gelir; kod içine dağılmaz.
- Secret artifact içine gömülmez; runtime secret mekanizmasından alınır.
- `TenantDatabaseRef` connection string değildir; gerçek credential log/UI/audit’e çıkmaz.
- Config değişikliği de review, audit, geri dönüş ve environment karşılaştırması ister.
- Güvenli varsayılan: bilinmeyen host, eksik config, migration uyumsuzluğu ve yanlış tenant ref ile uygulama fail-closed olur.

## Zero/low-downtime koşulları

- Schema değişikliği önce geriye uyumlu expand, sonra kod rollout, veri backfill/doğrulama, en son contract uygular.
- Eski ve yeni uygulama aynı geçiş penceresinde desteklenen schema ile çalışabilmelidir.
- Worker graceful shutdown, outbox/inflight iş görünürlüğü ve retry güvenliği sağlar.
- DB pool deployment sırasında drain edilir; yanlış tenant pool reuse oluşmaz.
- Kritik sezonda plansız schema contract veya destructive migration yapılmaz.

## Açık kararlar

Canlı sağlayıcı/bölge, HA topolojisi, TLS yönetimi, object storage, secret store, container/VM yöntemi, kapasite, WAL/PITR ve sayısal SLO değerleri seçilmemiştir. Bu kararlar ADR ve ölçüm kanıtı olmadan varsayılmaz.
