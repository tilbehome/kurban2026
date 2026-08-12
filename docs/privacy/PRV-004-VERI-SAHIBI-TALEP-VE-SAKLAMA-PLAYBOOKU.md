# Veri Sahibi Talebi ve Saklama Playbook’u

```yaml
id: PRV-004
title: Veri Sahibi Talebi ve Saklama Playbook'u
status: PLANNED
owner: Privacy
source_role: privacy_policy_or_playbook
reviewers: [Legal, Security, Support, Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HUKUKI_SURELER_ONAYLANDIGINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-005, PRO-009, PRO-019, PRO-020]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [customer, reporting, platform, audit]
related_tests: [TST-005, TST-012]
supersedes: []
superseded_by: null
```

## Talep türleri

Erişim/bilgilendirme, düzeltme, export, iletişim izni değişikliği, işlemeye itiraz ve anonimleştirme/silme adayı talepleri bu akışla yönetilir. Otomatik silme yapılmaz; finans, sözleşme, audit, devam eden uyuşmazlık ve yasal saklama yükümlülükleri ayrı değerlendirilir.

## İş akışı

1. Ticket aç: tenant, talep türü, alınma kanalı ve opaque talep sahibi kimliği.
2. Kimliği doğrula: gereğinden fazla yeni kişisel veri toplama; doğrulama yöntemini kaydet.
3. Tenant ve sezon kapsamını belirle; başka aile bireyi/aynı telefon kaydını otomatik kapsama alma.
4. Legal hold, finansal kayıt, audit, aktif işlem ve üçüncü kişi verisi kontrolü yap.
5. Onaylı sorgu/export aracıyla veri kaynaklarını bul; doğrudan production SQL veya el ile dosya kopyalama kullanma.
6. Maskeleme ve üçüncü kişi ayrıştırması uygula; export’u şifreli, süreli ve auditli kanaldan teslim et.
7. Düzeltme veya anonimleştirme gerekiyorsa domain kurallarını, ledger ve belge bütünlüğünü koruyan komut kullan.
8. Sonuç, kısmi ret/ret gerekçesi, onaylayan ve üretilen kanıtı kaydet.
9. Geçici export’u saklama politikası sonunda güvenli biçimde kaldır; asgari işlem kaydını koru.

## SupportSession sınırı

Platform destek ekibi tenant verisini talep sahibine göndermek için sessizce açamaz. Gerekirse ticket’a bağlı, süreli, mümkünse salt-okunur ve veri sınıfı kapsamlı `SupportSession` açılır. Gerçek erişim tenant audit’ine, güvenli metadata platform audit’ine yazılır.

## Saklama kararı matrisi

| Kayıt | Silme davranışı | Karar sahibi |
|---|---|---|
| Finans/ledger ve bağlantılı satış | Fiziksel silme yok; mevzuata göre sakla, gerekiyorsa erişimi sınırla | Legal + Finance |
| Audit/güvenlik olayı | Bütünlük korunur; erişim sınırlandırılır | Security + Legal |
| Müşteri iletişim bilgisi | Amaç/yükümlülük bittiğinde anonimleştirme veya silme adayı | Privacy + firma yetkilisi |
| Belge/vekalet/teslim kanıtı | Hukuki ve operasyonel yükümlülüğe göre | Legal + Domain owner |
| Geçici export | Kısa ömürlü teslim artefaktı; süre kararı gerekli | Privacy + Operations |
| Yedek kopya | Seçici silme yerine retention sonunda yok olma ve restore sonrası tekrar uygulama | Operations + Privacy |

## Kanıt ve kalite kapısı

Talep kaydı; request/audit ID, kimlik doğrulama yöntemi, kapsam, kaynak listesi, karar, onay, teslim/uygulama sonucu ve geçici artefakt temizleme durumunu içerir. Gerçek PII kanıt şablonuna eklenmez. Hukuki süreler onaylanana kadar SLA “belirlenecek” olarak tutulur; tahmini değer yazılmaz.
