# CI ve Kalite Kapısı Kanıt Şablonu

```yaml
id: EVD-001
title: CI ve Kalite Kapısı Kanıt Şablonu
status: REVIEW
owner: QA
reviewers: [Engineering, Security, Release]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: CI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-066, PRO-023, PRO-024, PRO-027]
related_adrs: []
related_modules: [testing]
related_tests: [TST-001]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-001-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
workflow_run: TBD
runner_image: TBD
node_version: TBD
pnpm_version: TBD
checks:
  utf8: NOT_RUN
  typecheck: NOT_RUN
  unit_contract: NOT_RUN
  platform_postgres: NOT_RUN
  tenant_isolation: NOT_RUN
  lint: NOT_RUN
  build: NOT_RUN
  secret_dependency_scan: NOT_RUN
  e2e_axe: NOT_RUN
skipped_checks: []
artifacts: []
reviewer_decision: NOT_DECIDED
```

## Notlar

- Koşullu PostgreSQL testinde `skipped` veya suite’in hiç toplanmaması başarı değildir.
- Lint warning sayısı ve kabul/borç kararı açık yazılır; yalnız exit code yeterli değildir.
- Yeniden koşu ilk başarısızlığı gizlemez; iki run da bağlanır.
- Bu şablonun kopyası doldurulur; ana şablon `PASSED` yapılmaz.
