# E2E, Erişilebilirlik ve Cihaz Kanıt Şablonu

```yaml
id: EVD-006
title: E2E, Erişilebilirlik ve Cihaz Kanıt Şablonu
status: PLANNED
owner: QA
source_role: evidence_record_or_template
reviewers: [UX, Accessibility, Product]
effective_date: 2026-08-12
last_reviewed: 2026-08-13
verified_against_commit: not_applicable
next_review: E2E_CIHAZ_MATRISI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [PRO-011, PRO-023, PRO-024, PRO-025, PRO-035]
related_adrs: []
related_modules: [platform-admin, tenant-web, tenant-mobile, public-display]
related_tests: [TST-008, TST-009, TST-010]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-006-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
environment: TBD
playwright_version: TBD
axe_version: TBD
projects_run: []
locales_run: []
rtl: NOT_RUN
keyboard: NOT_RUN
screen_reader_smoke: NOT_RUN
axe_critical_pages: NOT_RUN
real_devices: []
printer_qr_scale_devices: []
tests_run: null
tests_failed: null
tests_skipped: null
accessibility_findings: []
approved_exceptions: []
artifacts: []
```

Viewport emülasyonu gerçek cihaz alanına yazılmaz. Screenshot/video sentetik veri kullanmalı ve token/PII içermemelidir.

## EVD-006-RUN-20260813-001

```yaml
result: BLOCKED
commit_sha: dce7d539122c1ae263cec566d18e907a5a63b0f1
environment: LOCAL_REPOSITORY_PREPARATION
playwright_version: 1.62.1
axe_version: 4.13.0
project_discovery: PASSED
projects_listed: 13
tests_listed: 42
browser_binaries_installed: PASSED
browser_launch_smoke:
  chromium_151_0_7922_34: PASSED
  firefox_153_0: PASSED
  webkit_26_5: PASSED
production_target_guard: PASSED_REJECTED_BEFORE_BROWSER
browser_execution: NOT_RUN
axe_execution: NOT_RUN
rtl: NOT_RUN
keyboard: NOT_RUN
zoom_reflow: NOT_RUN
form_error_relationship: NOT_RUN
physical_passkey: BLOCKED
real_devices:
  windows_desktop: BLOCKED
  android_phone: BLOCKED
  tablet: BLOCKED
  tv_large_screen: BLOCKED
  qr_barcode_camera: BLOCKED
  printer: BLOCKED
  scale: NOT_RUN
artifacts_policy: TRACE_SCREENSHOT_VIDEO_OFF_BY_DEFAULT
blockers:
  - Erişilebilir sentetik local/staging HTTPS deployment yok.
  - Windows Hello/gerçek authenticator ve fiziksel cihaz kullanıcı etkileşimi yapılmadı.
```

## EVD-006-RUN-20260813-002

```yaml
result: BLOCKED
tested_source_sha: d87b1c4ca5cd8d7b2865d506c17ba4967dddb296
executed_at_utc: 2026-08-13
environment: WINDOWS_LOCAL_NO_HTTPS_STAGING_DEPLOYMENT
playwright_version: 1.62.1
axe_version: 4.13.0
projects_listed: 13
tests_listed: 42
staging_package_static_validation: PASSED
browser_binaries_installed: PASSED
browser_launch_assertion_only:
  chromium: PASSED
  firefox: PASSED
  webkit: PASSED
production_target_guard: PASSED_REJECTED_BEFORE_BROWSER
local_domains:
  console.tilbecore.test: UNRESOLVED
  tenant_a_requested_alias: UNRESOLVED
  tenant_b_requested_alias: UNRESOLVED
documented_compose_hosts:
  demo.tilbecore.test: UNRESOLVED
  sentetik-b.tilbecore.test: UNRESOLVED
docker_compose: MISSING
caddy: MISSING
staging_env_and_secrets: NOT_CREATED
staging_preflight: BLOCKED_ENOENT_STAGING_ENV
page_open_and_assertions: NOT_RUN
real_e2e_execution: NOT_RUN
axe_execution: NOT_RUN
rtl: NOT_RUN
keyboard: NOT_RUN
zoom_reflow: NOT_RUN
form_error_relationship: NOT_RUN
physical_passkey: MANUAL_ACCEPTANCE_REQUIRED
real_devices:
  windows_hello: MANUAL_ACCEPTANCE_REQUIRED
  android_phone: NOT_RUN
  tablet: NOT_RUN
  tv_large_screen: NOT_RUN
  qr_barcode_camera: NOT_RUN
  printer: NOT_RUN
  scale: NOT_RUN
artifacts:
  - docs/evidence/EVD-006-E2E-ERISILEBILIRLIK-CIHAZ-SABLONU.md#evd-006-run-20260813-002
blockers:
  - Docker Engine/Compose ve Caddy kurulu değil.
  - Güvenilir local HTTPS, local DNS/hosts, staging.env ve Git dışı sentetik secret seti yok.
```

Browser launch assertion yalnız kurulu motorların açılabildiğini gösterir; sayfa açan gerçek E2E veya axe sonucu değildir. Fiziksel passkey için [OPS-RB-008](../runbooks/OPS-RB-008-STAGING-KABUL-VE-FIZIKSEL-PASSKEY.md) içindeki kayıt, giriş, yanlış origin, replay, revoke, recovery code ve re-auth adımları kullanıcı etkileşimiyle uygulanmalıdır.
