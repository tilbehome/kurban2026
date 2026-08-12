# Migration Kanıt Şablonu

```yaml
id: EVD-002
title: Migration Kanıt Şablonu
status: REVIEW
owner: Data-Operations
reviewers: [QA, Release, Finance]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: MIGRATION_STANDARDI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-063, REQ-064, REQ-066, PRO-014]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [database-platform, database-tenant, provisioning]
related_tests: [TST-004]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-002-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
environment: TBD
target_scope: PLATFORM_OR_OPAQUE_TENANT_REF
from_schema: TBD
to_schema: TBD
migration_ids: []
empty_db_apply: NOT_RUN
supported_upgrade: NOT_RUN
replay_idempotency: NOT_RUN
drift_check: NOT_RUN
constraint_check: NOT_RUN
dry_run: NOT_RUN
backup_id: TBD
restore_verification: NOT_RUN
record_count_reconciliation: NOT_RUN
financial_reconciliation: NOT_RUN
rollback_or_roll_forward: TBD
cleanup: NOT_RUN
approvals: []
artifacts: []
```

Ham connection string, SQL içindeki hassas değer veya gerçek kayıt örneği eklenmez. Production migration çalıştırılmadan bu kayıt ön kontrol olarak `NOT_RUN/NOT_DECIDED` kalabilir; belge varlığı uygulama onayı değildir.
