# Backup, Restore ve PITR Kanıt Şablonu

```yaml
id: EVD-005
title: Backup, Restore ve PITR Kanıt Şablonu
status: REVIEW
owner: Operations
reviewers: [Data-Operations, Security, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
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
