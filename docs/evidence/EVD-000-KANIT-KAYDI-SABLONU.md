# Genel Kanıt Kaydı Şablonu

```yaml
id: EVD-000
title: Genel Kanıt Kaydı Şablonu
status: PLANNED
owner: QA-and-Operations
source_role: evidence_record_or_template
reviewers: [Security, Release]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HER_KANIT_SISTEMI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: []
related_adrs: []
related_modules: [testing, operations]
related_tests: []
supersedes: []
superseded_by: null
```

## Kopyalanacak kayıt

```yaml
evidence_record: EVD-RUN-YYYYMMDD-NNN
template: EVD-000
result: NOT_RUN
scope: TBD
requirement_ids: []
test_ids: []
commit_sha: TBD
artifact_digest: TBD
release: TBD
environment: TBD
started_at: null
finished_at: null
operator: TBD
reviewer: TBD
data_profile: SYNTHETIC_TBD
command_or_scenario: TBD
exit_code: null
tests_run: null
tests_passed: null
tests_failed: null
tests_skipped: null
artifacts: []
deviations: []
open_risks: []
follow_up_owner: TBD
```

## Zorunlu açıklamalar

- Beklenen sonuç ve kabul ölçütleri.
- Gerçek gözlem; başarı diline çevrilmemiş ham özet.
- Atlanan kontrol ve bunun release etkisi.
- Başarısızlık/flake/blokaj ile artefakt bağlantısı.
- Temizleme ve üretim verisine etkisizlik kanıtı.
- İnceleyen kararı ve tarih.

`result` alanı kontrol çalışmadan değiştirilmez. Başka commit veya ortamın sonucu kopyalanıp güncel kanıt yapılmaz.
