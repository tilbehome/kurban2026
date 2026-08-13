# Backup, Restore ve PITR Kanıt Şablonu

```yaml
id: EVD-005
title: Backup, Restore ve PITR Kanıt Şablonu
status: PLANNED
owner: Operations
source_role: evidence_record_or_template
reviewers: [Data-Operations, Security, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-13
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
