# Tenant Güvenlik Olayı Runbook’u

```yaml
id: OPS-RB-007
title: Tenant Güvenlik Olayı Runbook'u
status: REVIEW
owner: Security
reviewers: [Privacy, Operations, Legal, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_GUVENLIK_TATBIKATINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-049, REQ-059, REQ-062, REQ-068, PRO-020, PRO-027]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [security, platform, tenant-runtime, audit]
related_tests: [TST-005, TST-012]
supersedes: []
superseded_by: null
```

## Tetikleyici

Başka tenant verisi görülmesi, yanlış DB ref/pool, yetkisiz `SupportSession`, PII/secret sızıntısı, hesap/cihaz ele geçirilmesi, olağandışı export veya audit bütünlüğü şüphesi.

Tenant karışması şüphesi kanıt beklenirken düşük önemde sınıflandırılmaz; SEV-1 değerlendirmesi başlatılır.

## Containment

1. Güvenlik incident’i aç; olay komutanı, Privacy/Legal ve etkilenen tenant yetkilisini dahil et.
2. Etkilenen tenant/modül/kimlik/credential kapsamını belirle; en küçük yeterli read-only/full-stop uygula.
3. Şüpheli session, cihaz, passkey/recovery seti, service account veya SupportSession’ı iptal et.
4. Secret şüphesinde değeri görüntülemeden rotasyon/iptal planını başlat.
5. Pool/worker/offline queue erişimini dondur; başka tenantlara yayılım göstergelerini araştır.
6. Log, trace, audit, DB metadata, release/config ve erişim zaman çizelgesini değiştirilemez kanıt olarak koru.

## İnceleme sınırı

- Gerçek PII veya secret genel incident kanalına kopyalanmaz.
- Platform audit’te tenant operasyon içeriği çoğaltılmaz; gerekirse onaylı SupportSession ve tenant audit kullanılır.
- Etkilenen kayıt/kişiler tahmin edilmez; sorgu yöntemi ve veri aralığı kanıtlanır.
- Hukuki bildirim gerekliliği ve zamanlaması yalnız Legal/Privacy kararıdır; bu runbook süre uydurmaz.

## Eradication ve recovery

Kök neden host/session/ref, authorization, credential, release/config, storage/export veya insan işlemi olarak sınıflanır. Kontrol düzeltmesi test edilir; credential/session’lar yenilenir; tenant izolasyon negatif matrisi ve secret canary testi koşar. Read-only/full-stop kademeli kaldırılır; finans/operasyon mutabakatı ve başka tenant etkisizliği doğrulanır.

## Kapanış

Etkilenen tenant/veri/kişi kapsamı, zaman çizelgesi, containment, bildirim kararı, düzeltme, tekrar önleme ve bağımsız doğrulama kayıtlıdır. Kanıt yokluğu “etki yok” sayılmaz. Postmortem aksiyonları sahip ve doğrulama ölçütüyle izlenir.
