# Yük, Performans ve Soak Kanıt Şablonu

```yaml
id: EVD-009
title: Yük, Performans ve Soak Kanıt Şablonu
status: PLANNED
owner: QA-and-Reliability
source_role: evidence_record_or_template
reviewers: [Operations, Architecture, Product]
effective_date: 2026-08-12
last_reviewed: 2026-08-13
verified_against_commit: not_applicable
next_review: YUK_MODELI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-067, PRO-017, PRO-022]
related_adrs: []
related_modules: [tenant-runtime, operations, worker]
related_tests: [TST-011]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-009-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
artifact_digest: TBD
environment_topology: TBD
data_profile: SYNTHETIC_TBD
script_version: TBD
load_model_source: TBD
stages: []
latency_summary: {}
throughput_summary: {}
technical_error_rate: NOT_MEASURED
business_rejection_rate: NOT_MEASURED
db_pool_queue_summary: {}
resource_summary: {}
data_integrity_after_run: NOT_RUN
tenant_isolation_after_run: NOT_RUN
bottlenecks: []
capacity_headroom: NOT_MEASURED
artifacts: []
```

Hedef/eşik alanları baseline öncesi doldurulmaz. Test sonunda doğruluk mutabakatı yoksa performans sonucu `PASSED` olamaz.

## EVD-009-RUN-20260813-001

```yaml
result: BLOCKED
commit_sha: dce7d539122c1ae263cec566d18e907a5a63b0f1
environment_topology: REPO_STAGING_COMPOSE_PREPARED_NOT_DEPLOYED
data_profile: SYNTHETIC_FIXTURES_PREPARED
script_version: performance/k6/tilbecore-staging.js
load_model_source: TST-011_AND_ADR-0004
profiles_prepared: [baseline, load, spike, soak, concurrency, idempotency, tenant-isolation, db-pool, worker-backlog, report, read-only, failure-injection, offline-sync]
k6_version: 2.2.0
k6_profile_inspection: PASSED_13_OF_13
production_target_guard: PASSED_REJECTED_BEFORE_NETWORK
load_execution: NOT_RUN
latency_summary: {}
throughput_summary: {}
technical_error_rate: NOT_MEASURED
business_rejection_rate: NOT_MEASURED
resource_summary: {}
data_integrity_after_run: NOT_RUN
tenant_isolation_after_run: NOT_RUN
capacity_headroom: NOT_MEASURED
blockers:
  - Sentetik staging deployment, auth ve fixture kimlikleri çalışır durumda değil.
```

`k6 inspect` scriptin k6 runtime’ında yüklenebildiğini ve profil yapılandırmalarının üretilebildiğini kanıtlar; HTTP yükü üretmediği için performans sonucu değildir.

## EVD-009-RUN-20260813-002

```yaml
result: BLOCKED
tested_source_sha: d87b1c4ca5cd8d7b2865d506c17ba4967dddb296
executed_at_utc: 2026-08-13
environment_topology: WINDOWS_LOCAL_NO_HTTPS_STAGING_DEPLOYMENT
machine:
  cpu: Intel_R_Core_TM_i7_2600_CPU_3_40GHz
  cores: 4
  logical_processors: 8
  total_ram_gib: 15.89
k6_version: 2.2.0
script_version: performance/k6/tilbecore-staging.js
production_target_guard: PASSED_REJECTED_BEFORE_NETWORK
profiles:
  baseline: NOT_RUN
  load: NOT_RUN
  spike: NOT_RUN
  soak: NOT_RUN
virtual_users: NOT_SET
durations: NOT_SET
latency_summary: {}
throughput_summary: {}
technical_error_rate: NOT_MEASURED
business_rejection_rate: NOT_MEASURED
resource_summary: {}
data_integrity_after_run: NOT_RUN
tenant_isolation_after_run: NOT_RUN
capacity_headroom: NOT_MEASURED
production_capacity_inference: FORBIDDEN_AND_NOT_MADE
artifacts:
  - docs/evidence/EVD-009-YUK-SOAK-SABLONU.md#evd-009-run-20260813-002
blockers:
  - k6 binary mevcut; erişilebilir güvenilir local HTTPS staging endpointi yok.
  - Docker/Caddy/local domain hazırlığı bulunmadığı için HTTP yükü üretilmedi.
```
