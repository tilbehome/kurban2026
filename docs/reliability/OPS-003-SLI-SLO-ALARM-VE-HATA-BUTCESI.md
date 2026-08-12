# SLI, SLO, Alarm ve Hata Bütçesi Standardı

```yaml
id: OPS-003
title: SLI, SLO, Alarm ve Hata Bütçesi Standardı
status: PLANNED
owner: Reliability
source_role: reliability_policy_or_playbook
reviewers: [Operations, Product, Security, QA]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: STAGING_BASELINE_SONRASI
version: 0.1
source_of_truth: false
related_requirements: [REQ-067, PRO-016, PRO-017, PRO-022]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [operations, observability, tenant-runtime, worker]
related_tests: [TST-011]
supersedes: []
superseded_by: null
```

## Durum

Üretim/prova baseline’ı ve gerçek OpenTelemetry sağlayıcısı olmadığı için sayısal SLO/eşik tanımlanmamıştır. Sayılar staging yük testi, Kurban Günü prova profili, iş etkisi ve on-call kapasitesiyle onaylandıktan sonra sürümlenir.

## SLI kataloğu

| Kullanıcı yolu | SLI | Doğruluk sinyali |
|---|---|---|
| Login + tenant resolution | Geçerli istek başarı ve gecikmesi | Yanlış tenant/session kabulü sıfır olmalı |
| Satış/tahsilat | Komut başarı/gecikme | Mükerrerlik, rollback ve ledger dengesi |
| Kesim/paket/teslim | Geçiş başarı/gecikme | Kimlik zinciri ve tek teslim |
| Offline sync | Kuyruk yaşı, başarı, conflict | Kayıp/mükerrer ve uzlaştırma |
| DB | Pool wait/error, transaction rollback | Tenant ref uyuşmazlığı ve drift |
| Worker/outbox | Queue age, retry, DLQ | Atlanmış veya çift iş |
| Backup/restore | Son başarılı yaş, verify ve restore süresi | Checksum, tenant marker ve mutabakat |

Availability yalnız HTTP 2xx değildir; iş kuralı nedeniyle doğru ret ayrı, teknik hata ayrı sınıflanır. Hızlı fakat yanlış tenant/finans sonucu başarı olarak sayılmaz.

## SLO oluşturma yöntemi

1. Kritik kullanıcı yolunu ve owner’ı belirle.
2. Geçerli event pay/payda tanımı ile telemetry kalitesini doğrula.
3. Staging baseline, load/spike/soak ve tam prova ölçümü al.
4. Normal gün ile Kurban Günü penceresini gerekirse ayrı değerlendir.
5. Hedef, pencere, exclusions ve veri boşluğu davranışını onayla.
6. Burn-rate ve semptom tabanlı alarmı runbook’a bağla.
7. Her sezon sonrası hedefi gerçek ölçümle gözden geçir.

## Alarm kataloğu şablonu

Her alarm: benzersiz kimlik, severity, sinyal/sorgu, eşik+pencere, etkilenen yol/tenant kapsamı, runbook, owner/escalation, dedupe/silence, test yöntemi ve son prova tarihi içerir.

Başlangıç alarm adayları: tenant resolution reddinde anomali, kritik command teknik hata/burn, DB pool doygunluğu, transaction/deadlock, queue/DLQ, backup yaşı/verify, WAL archive gecikmesi, disk, telemetry gap, read-only/full-stop ve secret/PII canary.

## Hata bütçesi

Hata bütçesi tüketimi yüksekse riskli feature/release yavaşlatılır; güvenilirlik, test ve runbook işi öncelik kazanır. Tenant/finans/güvenlik doğruluk ihlalleri sıradan availability bütçesiyle kabul edilemez; release blocker olarak ele alınır.
