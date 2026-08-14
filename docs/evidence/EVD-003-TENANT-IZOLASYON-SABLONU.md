# Tenant İzolasyonu Kanıt Şablonu

```yaml
id: EVD-003
title: Tenant İzolasyonu Kanıt Şablonu
status: PLANNED
owner: QA-and-Security
source_role: evidence_record_or_template
reviewers: [Platform, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: TENANT_TEST_PLANI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-049, REQ-059, REQ-062, REQ-066, PRO-020, PRO-021]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [tenant-runtime, database-tenant, tenant-web-runtime]
related_tests: [TST-004, TST-005]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-003-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
environment: TBD
database_engine_version: TBD
tenant_a_ref: OPAQUE_TBD
tenant_b_ref: OPAQUE_TBD
separate_physical_databases: NOT_RUN
same_record_id_isolation: NOT_RUN
host_session_mismatch: NOT_RUN
database_ref_mismatch: NOT_RUN
reserved_unknown_host: NOT_RUN
custom_domain_state: NOT_RUN
support_session_absent_expired_scope: NOT_RUN
concurrent_pool_isolation: NOT_RUN
backup_cross_tenant_rejection: NOT_RUN
secret_redaction: NOT_RUN
cleanup: NOT_RUN
tests_run: null
tests_skipped: null
artifacts: []
reviewer_decision: NOT_DECIDED
```

Tenant isimleri ve içerikleri sentetik/opaque tutulur. Aynı ID testi gerçekten iki fiziksel DB’de koşmadan `PASSED` yazılmaz.

## EVD-003-RUN-20260814-001

```yaml
result: PASSED_DISPOSABLE_TWO_DATABASES
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
ci_evidence: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
database_engine_version: POSTGRESQL_16_14_LOCAL_AND_16_CI
tenant_refs: [SYNTHETIC_A, SYNTHETIC_B]
separate_physical_databases: PASSED
same_record_id_isolation: PASSED_SHA256_9f46575d8215c80a2f7bae0f37854a51da49c2010c334cef88e6c05c7ac98da9
host_session_mismatch: PASSED
database_ref_mismatch: PASSED
reserved_unknown_host: PASSED
concurrent_pool_isolation: PASSED
backup_cross_tenant_rejection: PASSED
other_tenant_unchanged_during_restore: PASSED
secret_redaction: PASSED
postgresql_tests:
  platform: 9_OF_9
  tenant_runtime_pool_backup_restore: 1_OF_1
  invoice_360: 6_OF_6
  faz_2d_11_core: 7_OF_7
tests_skipped: 0
cleanup: PASSED
production_write: false
```
