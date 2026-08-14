# Release Go/No-Go Kanıt Şablonu

```yaml
id: EVD-012
title: Release Go/No-Go Kanıt Şablonu
status: PLANNED
owner: Release
source_role: evidence_record_or_template
reviewers: [Product, QA, Security, Operations, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: RELEASE_KAPISI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [PRO-014, PRO-015, PRO-016, PRO-021, PRO-031]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [operations, release]
related_tests: [TST-001, TST-014]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-012-RUN-YYYYMMDD-NNN
decision: NOT_DECIDED
commit_sha: TBD
artifact_digest: TBD
release: TBD
migration_set: []
config_flag_snapshot: TBD
ci_evidence: TBD
tenant_isolation_evidence: TBD
financial_integrity_evidence: TBD
e2e_accessibility_evidence: TBD
load_evidence: TBD
backup_restore_evidence: TBD
simulation_evidence: TBD
security_findings_open: []
known_issues: []
rollback_or_roll_forward: TBD
monitoring_and_runbooks_ready: NOT_RUN
canary_scope: TBD
stop_conditions: []
approvals: []
```

Varsayılan `NOT_DECIDED` güvenli durumdur. Kanıt referansı eksik veya kritik kontrol çalıştırılmamışsa `GO` yazılmaz.

## EVD-012-RUN-20260813-001

```yaml
result: BLOCKED
decision: NOT_DECIDED
commit_sha: dce7d539122c1ae263cec566d18e907a5a63b0f1
release: FAZ_1_12_STAGING_ACCEPTANCE_INFRASTRUCTURE
ci_evidence: CANDIDATE_RUN_31692186321_SUCCESS_HEAD_71db94ff45e642411c32a6b99675daab52f14c51
tenant_isolation_evidence: LOCAL_POSTGRESQL_16_14_PASSED_AND_BASE_CI_PASSED
local_typecheck: PASSED
local_unit_route_tests: PASSED_242_OF_242_WITH_MAX_WORKERS_2
local_unit_pre_stabilization_attempts: FAILED_TIMEOUT_SAME_EXISTING_CONCURRENCY_TEST_TWICE
local_platform_postgresql_integration: PASSED_9_OF_9
local_two_tenant_isolation_backup_restore: PASSED_1_OF_1
local_lint: PASSED_0_ERRORS_11_EXISTING_WARNINGS
local_main_build: PASSED
local_platform_admin_build: PASSED
local_docs_validation_before_unrelated_user_document: PASSED
local_docs_validation_final_worktree: BLOCKED_BY_UNTRACKED_USER_SECURITY_ROADMAP
local_utf8_secret_diff: PASSED
financial_integrity_evidence: UNIT_AND_TWO_TENANT_INTEGRATION_PASSED_FULL_STAGING_RECONCILIATION_NOT_RUN
e2e_accessibility_evidence: EVD-006-RUN-20260813-001_BLOCKED
load_evidence: EVD-009-RUN-20260813-001_BLOCKED
backup_restore_evidence: EVD-005-RUN-20260813-001_BLOCKED
simulation_evidence: EVD-010-RUN-20260813-001_NOT_RUN
monitoring_and_runbooks_ready: IMPLEMENTED_UNVERIFIED
production_deployment: NOT_RUN
production_write: false
stop_conditions:
  - Fiziksel passkey ve cihaz kabulü tamamlanmadı.
  - Staging E2E/axe/yük/restore/PITR tatbikatı tamamlanmadı.
```

## EVD-012-RUN-20260813-002

```yaml
result: PARTIAL_LOCAL_ACCEPTANCE
tested_source_sha: d87b1c4ca5cd8d7b2865d506c17ba4967dddb296
release: FAZ_12_STAGING_ACCEPTANCE_INFRASTRUCTURE
code_merge_ready: YES_WITH_EXTERNAL_ACCEPTANCE_OPEN
production_release_ready: NO
ci_evidence_for_evidence_commit: PENDING
staging_package_static_validation: PASSED
platform_postgresql_integration: PASSED_9_OF_9
tenant_isolation_backup_restore: PASSED_1_OF_1
wal_pitr_evidence: EVD-005-RUN-20260813-002_PASSED_LOCAL_DISPOSABLE_PITR
e2e_accessibility_evidence: EVD-006-RUN-20260813-002_BLOCKED_REAL_EXECUTION_NOT_RUN
load_evidence: EVD-009-RUN-20260813-002_BLOCKED_NO_MEASUREMENTS
telemetry_source_redaction_regression: PASSED_AT_PREVIOUS_CANDIDATE_CI_31694519841
telemetry_collector_static_validation: PASSED_AT_PREVIOUS_CANDIDATE_CI_31694519841
telemetry_real_collector_runtime: NOT_RUN
telemetry_real_trace_export_and_backend_query: NOT_RUN
telemetry_blocker: DOCKER_OR_LOCAL_COLLECTOR_RUNTIME_AND_DEPLOYED_WORKLOAD_MISSING
physical_passkey: MANUAL_ACCEPTANCE_REQUIRED
physical_devices: NOT_RUN
simulation_evidence: EVD-010-RUN-20260813-001_NOT_RUN
production_deployment: NOT_RUN
production_write: false
merge_blockers: []
production_release_blockers:
  - Gerçek local/staging HTTPS E2E ve axe koşusu yok.
  - Gerçek collector/export/backend trace kanıtı yok.
  - Baseline/load/spike/soak ölçümü yok.
  - Fiziksel passkey, cihaz ve Kurban Günü provası tamamlanmadı.
```

`code_merge_ready` kararı yalnız mevcut staging kabul altyapısı PR'ının kod kapsamına ilişkindir. Production release kararı değildir; PR draft durumda kalır ve bağımsız merge kararı sonraki adımda verilir.

## EVD-012-RUN-20260814-001

```yaml
result: REPOSITORY_ACCEPTANCE_COMPLETE_EXTERNAL_ACCEPTANCE_OPEN
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
ci_evidence: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
release: PR_5_FAZ_7_12_CANDIDATE
code_merge_ready: YES_WITH_EXTERNAL_ACCEPTANCE_OPEN
production_release_ready: NO
migration_evidence: EVD-002-RUN-20260814-001
tenant_isolation_evidence: EVD-003-RUN-20260814-001
financial_integrity_evidence: EVD-004-RUN-20260814-001
backup_restore_evidence: EVD-005-RUN-20260814-001
e2e_accessibility_evidence: EVD-006-RUN-20260814-001
load_evidence: EVD-009-RUN-20260814-001_MEASUREMENT_ONLY
simulation_evidence: EVD-010-RUN-20260814-001_SYNTHETIC_ONLY
telemetry_collector_config_and_runtime: PASSED_LOCAL_OTELCOL_CONTRIB_0_132_0
telemetry_sensitive_values_exported: 0
telemetry_stacktrace_keys_exported: 0
merge_blockers: []
production_release_blockers:
  - Gerçek e-Fatura/e-Arşiv sağlayıcısı ve resmî UBL-TR eşlemesi yok.
  - Gerçek firma verisi import ve mutabakatı yapılmadı.
  - Fiziksel passkey, Android, tablet, TV, yazıcı, QR okuyucu ve terazi kabulü yapılmadı.
  - Gerçek saha Kurban Günü provası yapılmadı.
  - Production DNS/TLS, deployment ve restore yapılmadı.
  - Uzun süreli staging soak/dayanıklılık ve onaylı kapasite SLO'su yok.
production_write: false
pr_state: OPEN_DRAFT_NOT_MERGED
```
