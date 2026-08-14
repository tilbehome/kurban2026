# Test ve Operasyon Kanıt İndeksi

```yaml
id: EVD-IDX-001
title: Test ve Operasyon Kanıt İndeksi
status: PLANNED
owner: QA-and-Operations
source_role: evidence_record_or_template
reviewers: [Security, Release]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: HER_RELEASE_ADAYINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-066, REQ-067, PRO-021, PRO-022, PRO-023, PRO-024, PRO-029, PRO-031]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [testing, operations]
related_tests: [TST-001]
supersedes: []
superseded_by: null
```

## Kural

Bu dizindeki dosyalar kanıt şablonudur; var olmaları bir kontrolün çalıştığını veya geçtiğini göstermez. Yeni kayıt varsayılan `NOT_RUN` ile açılır. `PASSED` yalnız commit/artifact, ortam, komut/senaryo, zaman, gerçek sonuç ve artefakt bağlantısı doldurulduğunda yazılır.

## Sonuç sözlüğü

| Sonuç | Anlam |
|---|---|
| `NOT_RUN` | Çalıştırılmadı |
| `RUNNING` | Devam ediyor; başarı kararı yok |
| `PASSED` | Tanımlı kabul ölçütleri kanıtla geçti |
| `FAILED` | Bir veya daha fazla ölçüt başarısız |
| `BLOCKED` | Ön koşul/altyapı engeli nedeniyle sonuç yok |
| `SKIPPED_WITH_REASON` | Bilinçli atlandı; gerekçe ve release etkisi zorunlu |

## Şablonlar

- [Genel kanıt kaydı](EVD-000-KANIT-KAYDI-SABLONU.md)
- [CI ve kalite kapısı](EVD-001-CI-VE-KALITE-KAPISI-SABLONU.md)
- [Migration](EVD-002-MIGRATION-SABLONU.md)
- [Tenant izolasyonu](EVD-003-TENANT-IZOLASYON-SABLONU.md)
- [Finans mutabakatı](EVD-004-FINANS-MUTABAKAT-SABLONU.md)
- [Backup, restore ve PITR](EVD-005-BACKUP-RESTORE-PITR-SABLONU.md)
- [E2E, erişilebilirlik ve cihaz](EVD-006-E2E-ERISILEBILIRLIK-CIHAZ-SABLONU.md)
- [Yük ve soak](EVD-009-YUK-SOAK-SABLONU.md)
- [Kurban Günü provası](EVD-010-KURBAN-GUNU-PROVA-SABLONU.md)
- [Release go/no-go](EVD-012-RELEASE-GO-NO-GO-SABLONU.md)

## Güncel Faz 12 kanıt seti

PR #5 için repo içi Faz 12 kanıtı `699e0d2298b2dbcf913781134d850aaafbb661a7` ve [CI 31822828259](https://github.com/tilbehome/kurban2026/actions/runs/31822828259) üzerine kayıtlıdır. Ayrıntılar EVD-001, EVD-002, EVD-003, EVD-004, EVD-005, EVD-006, EVD-009, EVD-010 ve EVD-012 belgelerindeki `RUN-20260814-001` bölümlerindedir. Bu set production veya fiziksel dış kabul değildir.
- [Faz 2D–6 kapanış kanıtı](EVD-013-FAZ-2D-6-KAPANIS-KANITI.md)

## Hassas bilgi

Kanıta production secret, connection string, cookie/token, gerçek müşteri verisi, tam DB dump, hassas belge veya gereksiz ekran görüntüsü eklenmez. Gerekiyorsa yalnız opaque kimlik, güvenli hata kodu ve erişim kontrollü artefakt referansı kullanılır.
