# Finans ve Veri Bütünlüğü Kanıt Şablonu

```yaml
id: EVD-004
title: Finans ve Veri Bütünlüğü Kanıt Şablonu
status: PLANNED
owner: Finance-and-QA
source_role: evidence_record_or_template
reviewers: [Domain, Data-Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
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
