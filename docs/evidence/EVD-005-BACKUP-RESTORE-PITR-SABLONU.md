# Backup, Restore ve PITR Kanıt Şablonu

```yaml
id: EVD-005
title: Backup, Restore ve PITR Kanıt Şablonu
status: PLANNED
owner: Operations
source_role: evidence_record_or_template
reviewers: [Data-Operations, Security, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: BACKUP_DR_STANDARDI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-046, PRO-021, PRO-029]
related_adrs: [ADR-0003]
related_modules: [database-tenant, tenant-ops-cli, operations]
related_tests: [TST-013]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-005-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
environment: TBD
opaque_tenant_ref: TBD
backup_id: TBD
backup_started_at: null
backup_completed_at: null
checksum_verified: NOT_RUN
artifact_size_check: NOT_RUN
migration_version: TBD
temporary_restore: NOT_RUN
tenant_marker_ref_check: NOT_RUN
schema_record_check: NOT_RUN
financial_reconciliation: NOT_RUN
other_tenants_unchanged: NOT_RUN
cleanup: NOT_RUN
pitr_supported: UNKNOWN
recovery_target: NOT_SET
measured_rpo: NOT_MEASURED
measured_rto: NOT_MEASURED
production_write: false
approvals: []
artifacts: []
```

`pg_dump` dosyasının bulunması restore başarısı değildir. PITR uygulanmadıysa alanlar `UNKNOWN/NOT_MEASURED` kalır; hedef sayı uydurulmaz.

## EVD-005-RUN-20260813-001

```yaml
result: BLOCKED
commit_sha: dce7d539122c1ae263cec566d18e907a5a63b0f1
environment: LOCAL_REPOSITORY_PREPARATION
staging_compose_package: IMPLEMENTED_UNVERIFIED
logical_backup_restore_existing_ci: PASSED_AT_BASE_COMMIT_31626396792
local_postgresql_version: 16.14
local_platform_migration_apply: PASSED
local_tenant_migration_apply: PASSED
local_platform_postgresql_integration: PASSED_9_OF_9
local_two_tenant_isolation: PASSED_1_OF_1
local_logical_backup_checksum: PASSED
local_temporary_restore_verification: PASSED
local_wrong_tenant_backup_rejection: PASSED
local_other_tenant_unchanged: PASSED
local_temporary_restore_cleanup: PASSED
staging_base_backup: NOT_RUN
checksum_verified: NOT_RUN
wal_archiving: NOT_RUN
pitr_time_target: NOT_RUN
pitr_lsn_target: NOT_RUN
temporary_restore: NOT_RUN
wrong_tenant_backup_rejection: NOT_RUN
record_fk_checks: NOT_RUN
financial_reconciliation: NOT_RUN
audit_outbox_check: NOT_RUN
other_tenants_unchanged: NOT_RUN
cleanup: NOT_RUN
measured_rpo: NOT_MEASURED
measured_rto: NOT_MEASURED
production_restore: NOT_RUN
production_write: false
blockers:
  - Docker CLI/Engine bu çalışma makinesinde bulunmuyor.
  - Erişilebilir sentetik staging PostgreSQL sunucusu ve WAL/PITR sağlayıcısı verilmedi.
```

Yerel `PASSED` alanları yalnız izole `127.0.0.1:55433` sentetik PostgreSQL kümesinde çalışan mevcut logical backup/geçici restore entegrasyon testidir. Staging base backup, WAL/PITR tatbikatı veya ölçülmüş RPO/RTO kanıtı değildir.

## EVD-005-RUN-20260813-002

```yaml
result: PASSED_LOCAL_DISPOSABLE_PITR
tested_source_sha: d87b1c4ca5cd8d7b2865d506c17ba4967dddb296
executed_at_utc: 2026-08-13T11:29:58Z/2026-08-13T11:38:02Z
environment: WINDOWS_LOCAL_DISPOSABLE_POSTGRESQL_16_14
host: 127.0.0.1
source_ports: [55434, 55435]
restore_port: 55436
persistent_test_cluster: 127.0.0.1:55433_UNCHANGED_AND_ACCEPTING_CONNECTIONS
synthetic_data:
  tenant_a: tenant_accept_a/dbref_accept_a
  tenant_b: tenant_accept_b/dbref_accept_b
  baseline_ledger_a: 1/1250.50
  retained_ledger_a: 1/249.50
  post_target_ledger_a: 1/9999.99
  tenant_b_ledger_after_target: 2/1000.00
commands:
  - initdb --auth-local=trust --auth-host=trust
  - pnpm test:platform-postgres
  - pnpm test:tenant-isolation
  - pg_basebackup -Fp -Xs -c fast --manifest-checksums=SHA256
  - pg_verifybackup
  - pg_switch_wal / CHECKPOINT
  - recovery.signal ile recovery_target_lsn ve recovery_target_action=promote
platform_postgresql_integration: PASSED_9_OF_9_38_31_SECONDS
tenant_isolation_backup_restore: PASSED_1_OF_1_137_79_SECONDS
environment_preparation_attempts:
  - NOT_COUNTED_WRONG_OPT_IN_VARIABLE_RESULTED_IN_1_SKIPPED
  - FAILED_BEFORE_TEST_PLATFORM_PUBLIC_MIGRATIONS_MISSING
  - FAILED_DURING_TEST_PG_DUMP_NOT_ON_CHILD_PROCESS_PATH
  - PASSED_AFTER_EXISTING_MIGRATIONS_AND_POSTGRESQL_16_BIN_PATH_WERE_PROVIDED
base_backup: PASSED
base_backup_duration_ms: 5066
base_backup_files: 1479
base_backup_bytes: 52489980
backup_manifest_sha256: 7607FACCB875E549A63E1055A58BC6C3133CDE82C4A90DCF7F0F541991A20F29
pg_verifybackup: PASSED
wal_archiving: PASSED
wal_archive_failed_count: 0
wal_artifacts_at_cleanup: 10_SEGMENTS_AND_1_BACKUP_HISTORY
recovery_target_kind: LSN
recovery_target: 0/8000360
timeline_after_promote: 2
retained_row_after_restore: 1
post_target_row_after_restore: 0
restored_tenant_marker: tenant_accept_a/dbref_accept_a
restored_ledger: 2/1500.00
restored_ledger_constraints: 2
tenant_b_database_present_in_tenant_a_cluster: 0
tenant_b_after_pitr: tenant_accept_b/dbref_accept_b_AND_2/1000.00
measured_rpo_ms: 847
measured_rpo_scope: LAST_RETAINED_COMMIT_TO_SIMULATED_POST_TARGET_COMMIT
measured_rto_ms: 1425
measured_rto_scope: POSTGRES_PROCESS_START_TO_WRITABLE_READY_FROM_SERVER_LOG
post_restore_validation_duration_ms: 501
first_restore_attempt: FAILED_WINDOWS_FORWARD_SLASH_COPY_PATH_TARGET_NOT_REACHED
final_restore_attempt: PASSED_WINDOWS_NATIVE_COPY_PATH_TARGET_REACHED_AND_PROMOTED
production_restore: NOT_RUN
production_write: false
cleanup:
  processes: PASSED_ALL_DISPOSABLE_CLUSTERS_STOPPED
  ports: PASSED_55434_55435_55436_NOT_LISTENING
  temporary_root: MOVED_TO_WINDOWS_RECYCLE_BIN_SOURCE_PATH_GONE
  persistent_cluster: PASSED_55433_STILL_ACCEPTING_CONNECTIONS
artifacts:
  - docs/evidence/EVD-005-BACKUP-RESTORE-PITR-SABLONU.md#evd-005-run-20260813-002
```

Bu koşu production kapasitesi veya production restore yetkisi kanıtı değildir. RTO yalnız disposable restore sürecinin PostgreSQL logundaki başlangıç ile yazılabilir bağlantıya hazır olma zamanları arasındadır; doğrulama süresi ayrıca kaydedilmiştir.

## EVD-005-RUN-20260814-001

```yaml
result: PASSED_LOCAL_DISPOSABLE_BACKUP_RESTORE_AND_TIME_PITR
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
ci_evidence: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
environment: WINDOWS_LOCAL_POSTGRESQL_16_14
data_profile: SYNTHETIC_PLATFORM_AND_TWO_TENANTS
logical_backup_checksum_verification:
  platform: PASSED
  tenant_a: PASSED
  tenant_b: PASSED
logical_restore: PASSED_THREE_FRESH_DATABASES
restored_schema_counts:
  platform: 34_TABLES_135_CONSTRAINTS
  tenant_a: 109_TABLES_416_CONSTRAINTS
  tenant_b: 108_TABLES_415_CONSTRAINTS
row_count_manifest_reconciliation: PASSED_ALL_THREE
base_backup: PASSED
pg_verifybackup: PASSED
backup_manifest_sha256: 2344DF12656433F540935DE49C19AE659DBCA50636DABA60F85ACA9DC349B6C7
wal_archiving: PASSED_6_SEGMENTS_AT_CHECKPOINT
recovery_target_kind: TIME
recovery_target: 2026-08-14T19:00:20.696652+03:00
timeline_after_promote: 2
target_before_row_retained: PASSED
target_after_row_excluded: PASSED
other_tenant_unchanged: PASSED
post_restore_write_and_rollback_health: PASSED
measured_rto_ms: 1602
measured_rpo: TARGET_TIME_BOUNDARY_CONFIRMED_NOT_PRODUCTION_SLO
first_restore_attempt: FAILED_WINDOWS_FORWARD_SLASH_COPY_PATH_TARGET_NOT_REACHED
final_restore_attempt: PASSED_WINDOWS_CMD_COPY_AND_PROMOTE
cleanup_processes_and_ports: PASSED
cleanup_temporary_roots: PASSED
production_restore: NOT_RUN
production_write: false
```

İlk restore denemesi gizlenmemiştir. Uygulama health kontrolü DB-only sentetik kümede `NOT_RUN`; production veya yönetilen PostgreSQL restore kabulü değildir.
