# Release Go/No-Go Kanıt Şablonu

```yaml
id: EVD-012
title: Release Go/No-Go Kanıt Şablonu
status: REVIEW
owner: Release
reviewers: [Product, QA, Security, Operations, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
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
