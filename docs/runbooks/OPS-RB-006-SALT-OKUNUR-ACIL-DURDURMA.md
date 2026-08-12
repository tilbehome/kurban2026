# Salt-Okunur ve Acil Durdurma Runbook’u

```yaml
id: OPS-RB-006
title: Salt-Okunur ve Acil Durdurma Runbook'u
status: REVIEW
owner: Operations
reviewers: [Security, Product, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_ACIL_DURDURMA_PROVASINDA
version: 0.1
source_of_truth: false
related_requirements: [PRO-015, PRO-016, PRO-028, PRO-034]
related_adrs: [ADR-0002]
related_modules: [platform, tenant-runtime, feature-flags]
related_tests: [TST-010, TST-014]
supersedes: []
superseded_by: null
```

## Ne zaman

- `read_only`: veri doğruluğu şüpheli, bakım/migration riski veya DB stabil değil; güvenli görüntüleme mümkün.
- `module_stop`: tek modül/entegrasyon riskli, çekirdeğin kalanı güvenli.
- `full_stop`: tenant sınırı, yaygın veri bozulması, kritik güvenlik veya kontrolsüz finans/teslim yazısı riski.

## Açma

1. Incident, kapsam, gerekçe, tenant/modül, beklenen kullanıcı etkisi ve karar sahibi kaydedilir.
2. En küçük yeterli modu seç; tenant A olayında Tenant B’yi sebepsiz durdurma.
3. Kritik değişimde yeniden doğrulama/ikinci onayı uygula.
4. Tenant request runtime politikasının yeni yazıları fail-closed reddettiğini sentetik güvenli istekle doğrula.
5. Worker/outbox/offline queue davranışını belirle; retry fırtınasını dondur.
6. Kullanıcıya başarı gibi görünmeyen net bakım/read-only mesajı ve manuel prosedür ver.

## Mod açıkken

- Salt-okunur yüzeyde stale veri yaşı ve son güncelleme görünür.
- Kağıt/manual kayıtlar benzersiz acil kimlik, zaman, istasyon ve sorumlu taşır.
- Override ile normal yazı açılmaz; kapsam değişikliği yeni onaydır.
- Platform/tenant audit, telemetry ve incident zaman çizelgesi sürer.

## Kaldırma

1. Kök neden veya güvenli workaround doğrulanır.
2. DB/tenant/ref, app/schema/release, queue ve telemetry sağlığı kontrol edilir.
3. Manuel/offline kayıt envanteri ve mutabakat planı hazırlanır.
4. Önce sınırlı canary yazı, sonra tek istasyon/tenant, en son genel açılış yapılır.
5. Idempotency, ledger/audit/outbox ve paket/teslim tekilliği kontrol edilir.
6. Modu kapatan kişi/gerekçe/kanıt auditlenir.

## Geri dönüş

Açılış sonrası hata, fark veya tenant şüphesinde hemen önceki güvenli moda dönülür. Modun kapalı görünmesi kullanıcı yollarının sağlıklı olduğu anlamına gelmez.
