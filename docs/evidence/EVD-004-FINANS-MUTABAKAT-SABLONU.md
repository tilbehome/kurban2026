# Finans ve Veri Bütünlüğü Kanıt Şablonu

```yaml
id: EVD-004
title: Finans ve Veri Bütünlüğü Kanıt Şablonu
status: PLANNED
owner: Finance-and-QA
source_role: evidence_record_or_template
reviewers: [Domain, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: FINANS_TEST_PLANI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-024, REQ-040, REQ-068, PRO-032]
related_adrs: []
related_modules: [finance-ledger, share-sales, delivery]
related_tests: [TST-006]
supersedes: []
superseded_by: null
```

```yaml
evidence_record: EVD-004-RUN-YYYYMMDD-NNN
result: NOT_RUN
commit_sha: TBD
environment: TBD
data_profile: SYNTHETIC_TBD
journal_debit_credit_difference: null
receipt_split_difference: null
allocation_difference: null
customer_ledger_difference: null
cash_expected_counted_difference: null
bank_pos_difference: null
active_share_ownership_violations: null
idempotency_duplicates: null
package_delivery_violations: null
reversal_link_violations: null
accepted_exceptions: []
queries_or_scenarios: []
artifacts: []
finance_signoff: NOT_DECIDED
```

Fark alanları ölçülmeden `0` yazılmaz. Kabul edilen fark kod, iş kuralı, sahip ve onay olmadan başarıya çevrilmez.

## EVD-004-RUN-20260814-001

```yaml
result: PASSED_LOCAL_SYNTHETIC_POSTGRESQL
tested_source_sha: 699e0d2298b2dbcf913781134d850aaafbb661a7
ci_evidence: https://github.com/tilbehome/kurban2026/actions/runs/31822828259
environment: DISPOSABLE_POSTGRESQL_16
data_profile: SYNTHETIC_TWO_TENANT
journal_debit_credit_difference: 0
receipt_split_difference: 0
allocation_difference: 0
customer_ledger_difference: 0
active_share_ownership_violations: 0
idempotency_duplicates: 0
package_delivery_violations: 0
reversal_link_violations: 0
weight_difference_example_try: 2200.00
invoice_tax_ledger_tests: PASSED_6_OF_6
faz_2d_11_core_tests: PASSED_7_OF_7
rehearsal_finance_difference: 0
accepted_exceptions: []
production_write: false
```

Ölçülen sıfırlar yalnız bu sentetik PostgreSQL senaryolarına aittir; gerçek firma import/mutabakatı ve production finans kabulü yapılmadı.
