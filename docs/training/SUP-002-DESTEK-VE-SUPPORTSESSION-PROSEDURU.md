# Destek Talebi ve SupportSession Prosedürü

```yaml
id: SUP-002
title: Destek Talebi ve SupportSession Prosedürü
status: REVIEW
owner: Support
reviewers: [Security, Privacy, Platform, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: ILK_CANLI_DESTEK_PROVASINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-059, REQ-068, PRO-020]
related_adrs: [ADR-0002]
related_modules: [platform, tenant-runtime, audit]
related_tests: [TST-005, TST-012]
supersedes: []
superseded_by: null
```

## Ticket asgari alanları

Tenant/ortam, release, kategori, etki/severity, güvenli hata kodu, requestId/traceId, oluşma zamanı, tekrar adımı ve beklenen/gerçek davranış. Müşteri adı/telefonu, ekran görüntüsünde PII, cookie/token, DB URL, parola veya secret eklenmez.

## Tanı sırası

1. Public metadata, health, release/config ve güvenli telemetry ile incele.
2. Kullanıcıdan secret/PII istemeden sentetik tekrar üret.
3. Tenant verisi gerekmiyorsa SupportSession açma.
4. Gerekirse istenen modül/veri sınıfı/okuma-yazma/süre ve gerekçeyi ticket’a bağla.
5. Firma yetkili onayı ve platform operatörü yeniden doğrulaması olmadan oturum açma.
6. Gerçek erişimi tenant audit’e, güvenli metadata’yı platform audit’e yaz.

## SupportSession kullanımı

- En dar kapsam ve varsayılan salt-okunur.
- Başka tenant, modül, işlem veya süreye taşınamaz.
- Yazma gerekiyorsa ayrı açık onay, gerekçe, önizleme/geri dönüş ve ikinci yetkili değerlendirilir.
- Export/ekran görüntüsü yerel cihaza kontrolsüz indirilmez.
- Firma oturumu istediği anda iptal edebilir; expiry otomatik kapanır.

## Kapatma

Oturum sonlandırılır, token/session/pool etkisi kapatılır, erişilen/değiştirilen güvenli özet firmaya görünür yapılır, workaround/kalıcı çözüm ve takip işi ticket’a bağlanır. Geçici dosya/export varsa erişim ve temizliği doğrulanır.

## Eskalasyon

Tenant karışması, PII/secret, finans/veri bozulması veya olağandışı erişim [tenant güvenlik olayı runbook’una](../runbooks/OPS-RB-007-TENANT-GUVENLIK-OLAYI.md) gider. Çözüm hedef süreleri destek kadrosu ve ticari SLA onayı olmadan uydurulmaz.
