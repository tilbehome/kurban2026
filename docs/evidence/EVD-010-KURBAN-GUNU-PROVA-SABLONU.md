# Kurban Günü Prova Kanıt Şablonu

```yaml
id: EVD-010
title: Kurban Günü Prova Kanıt Şablonu
status: PLANNED
owner: Operations-and-QA
source_role: evidence_record_or_template
reviewers: [Product, Security, Finance, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
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

## EVD-010-RUN-20260813-001

```yaml
result: NOT_RUN
commit_sha: dce7d539122c1ae263cec566d18e907a5a63b0f1
release: STAGING_ACCEPTANCE_CANDIDATE
environment: NOT_DEPLOYED
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
open_blockers:
  - Staging deployment ve gerçek cihaz katılımcıları hazır değil.
  - Bu paket YN-00–YN-26 veya genel Kurban Günü provasını başlatmaz.
```

## EVD-010-RUN-20260814-001

```yaml
result: PASSED_LOCAL_SYNTHETIC_SOFTWARE_REHEARSAL
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
ci_evidence: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
environment: TWO_DISPOSABLE_POSTGRESQL_16_TENANT_DATABASES
duration_ms: 2551
synthetic_tenants: 2
same_record_ids_sha256: 9f46575d8215c80a2f7bae0f37854a51da49c2010c334cef88e6c05c7ac98da9
per_tenant:
  animals: 50
  shares: 350
  deliveries: 7
  offline_queue_records: 1
  concurrent_sale_winners: 1
  concurrent_sale_rejections: 1
  reversal_records: 2
  weight_difference_try: 2200.00
  finance_difference: 0
  audit_outbox_records: 34
scenarios:
  tenant_setup_and_season: PASSED
  animal_and_seven_shares: PASSED
  concurrent_sale_and_downpayment: PASSED
  mixed_collection_and_reversal: PASSED
  proxy: PASSED
  slaughter_weigh_package: PASSED
  offline_queue: PASSED
  delivery: PASSED
  cash_and_ledger_reconciliation: PASSED
  season_close_and_write_rejection: PASSED
tenant_isolation: PASSED
physical_devices_and_participants: NOT_RUN
real_kurban_day_field_rehearsal: NOT_RUN
cleanup: PASSED
```

Bu kayıt yalnız “sentetik yazılım provası”dır; gerçek personel, saha, cihaz, elektrik/ağ kesintisi veya Kurban Günü provası değildir.
