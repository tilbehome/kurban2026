# Migration Kanıt Şablonu

```yaml
id: EVD-002
title: Migration Kanıt Şablonu
status: PLANNED
owner: Data-Operations
source_role: evidence_record_or_template
reviewers: [QA, Release, Finance]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
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

## EVD-002-RUN-20260814-001

```yaml
result: PASSED_LOCAL_AND_CI_DISPOSABLE
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
ci_evidence: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
environment: WINDOWS_LOCAL_POSTGRESQL_16_14_AND_GITHUB_POSTGRESQL_16
data_profile: SYNTHETIC_ONLY
migration_sets:
  platform: 0001_0007
  tenant: 0001_0016
empty_platform_apply: PASSED
empty_tenant_apply: PASSED
supported_upgrade_0010_to_0015: PASSED
upgrade_fixture_scope: PROXY_SALE_RECEIPT_ANIMAL_SHARE_OPERATION
backfill_record_preservation: PASSED
tenant_season_link_preservation: PASSED
constraint_and_trigger_checks: PASSED
duplicate_object_negative_case: PASSED_FAILED_CLOSED_SQLSTATE_42710
failed_migration_transaction_rollback: PASSED
drift_check: PASSED_NO_DIFFERENCE
schema_migration_alignment: PASSED
production_write: false
cleanup: PASSED
```

İlk hata `0011` içinde mevcut `ProxyDocument_status_check` adının tekrar eklenmesiydi. `0011`, eski constraint'i açıkça düşürüp genişletilmiş listeyle aynı ad altında yeniden kurar. Eski `0001..0010` dosyaları değiştirilmedi. `0016`, `0008` içinde constraint sanılarak düşürülemeyen eski unique index'i ileri yönlü ve ayrı migration ile kaldırır.
