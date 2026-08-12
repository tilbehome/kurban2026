# Tenant İzolasyonu Kanıt Şablonu

```yaml
id: EVD-003
title: Tenant İzolasyonu Kanıt Şablonu
status: REVIEW
owner: QA-and-Security
reviewers: [Platform, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
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
