# CI ve Kalite Kapısı Kanıt Şablonu

```yaml
id: EVD-001
title: CI ve Kalite Kapısı Kanıt Şablonu
status: PLANNED
owner: QA
source_role: evidence_record_or_template
reviewers: [Engineering, Security, Release]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
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

## EVD-001-RUN-20260814-001

```yaml
result: PASSED_REPOSITORY_ACCEPTANCE
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
workflow_run: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
workflow_result: SUCCESS
runner: GITHUB_UBUNTU_POSTGRESQL_16
node_version: 22.13.0
pnpm_version: 11.2.2
checks:
  utf8: PASSED
  documentation_inventory_and_policy: PASSED
  secret_scan: PASSED_1041_FILES_FINAL_DOCS_WORKTREE
  staging_static_validation: PASSED_PRODUCTION_WRITE_FALSE
  otel_collector_config: PASSED_VERSION_0_132_0
  playwright_discovery: PASSED_40_TESTS_8_FILES
  prisma_platform_validate_generate: PASSED
  prisma_tenant_validate_generate: PASSED
  migration_apply: PASSED_PLATFORM_AND_TENANT
  platform_postgres: PASSED_9_OF_9
  tenant_isolation: PASSED_1_OF_1
  invoice_postgres: PASSED_6_OF_6
  core_postgres: PASSED_7_OF_7
  typecheck: PASSED
  unit_route: PASSED_38_FILES_261_TESTS
  lint: PASSED_0_ERRORS_11_WARNINGS
  main_build: PASSED_51_STATIC_PAGES
  platform_admin_build: PASSED_22_STATIC_PAGES
  pwa_generated_artifact: PASSED
  git_diff_check: PASSED
local_supplemental_checks:
  playwright_https_axe: PASSED_26_OF_26_APPLICABLE_14_EXTERNAL_PREREQUISITE_SKIPS
  synthetic_rehearsal: PASSED
  disposable_backup_restore_pitr: PASSED
production_write: false
remaining_risk: EXTERNAL_AND_PHYSICAL_ACCEPTANCE_OPEN
```

Bu kayıt repo içi merge kapılarını kanıtlar; production deployment, gerçek firma verisi, gerçek sağlayıcı veya fiziksel cihaz kabulü değildir.
