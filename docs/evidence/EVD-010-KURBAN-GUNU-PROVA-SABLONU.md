# Kurban Günü Prova Kanıt Şablonu

```yaml
id: EVD-010
title: Kurban Günü Prova Kanıt Şablonu
status: REVIEW
owner: Operations-and-QA
reviewers: [Product, Security, Finance, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_PROVA_ONCESI
version: 0.1
source_of_truth: false
related_requirements: [REQ-067, PRO-021, PRO-031, PRO-033, PRO-034, PRO-035]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [all]
related_tests: [TST-014, TST-015]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-010-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
release: TBD
environment: TBD
synthetic_tenants: 0
participants_by_role: {}
devices: []
scenarios:
  tenant_setup_and_season: NOT_RUN
  animal_and_seven_shares: NOT_RUN
  sale_collection_proxy: NOT_RUN
  slaughter_weigh_package: NOT_RUN
  internet_outage_and_sync: NOT_RUN
  database_read_only_recovery: NOT_RUN
  printer_qr_device_failure: NOT_RUN
  wrong_package_share: NOT_RUN
  delivery: NOT_RUN
  cash_and_ledger_reconciliation: NOT_RUN
  backup_restore: NOT_RUN
  season_close: NOT_RUN
tenant_isolation: NOT_RUN
open_blockers: []
incident_timeline: TBD
artifacts: []
signoffs: []
```

Gerçek müşteri/veri kullanılmaz. Bir kritik senaryo `NOT_RUN/FAILED/BLOCKED` ise genel sonuç `PASSED` olamaz.
