# KVKK ve Gizlilik Tasarımı

```yaml
id: PRV-001
title: KVKK ve Gizlilik Tasarımı
status: PLANNED
owner: Privacy
source_role: privacy_policy_or_playbook
reviewers: [Legal, Security, Product, Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HUKUKI_ENVANTER_ONAYINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-005, PRO-009, PRO-019, PRO-020]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [customer, proxy-documents, fulfillment, platform, reporting]
related_tests: [TST-005, TST-012]
supersedes: []
superseded_by: null
```

## Kapsam ve hukuki sınır

Bu belge privacy-by-design teknik ve operasyonel çerçevesidir; hukuki görüş değildir. Veri sorumlusu/veri işleyen rolleri, her işleme amacı için hukuki sebep, saklama süreleri, özel nitelikli veri kararı, yurt dışı aktarım ve aydınlatma/açık rıza metinleri yetkili hukuk ve iş sahipleri tarafından onaylanmadan kesinleşmiş sayılmaz.

## Tasarım ilkeleri

- Amaçla sınırlılık ve veri minimizasyonu.
- Platform DB’de tenant müşteri/finans/operasyon içeriği bulunmaması.
- Yetki, tenant, sezon ve amaç bazlı erişim; varsayılan maskeleme.
- TV ve açık takipte PII/finans bulunmaması; yalnız opaque token kapsamındaki asgari durum.
- Gerçek müşteri verisinin repo, fixture, ekran görüntüsü, ticket veya test loguna alınmaması.
- Export, destek erişimi, düzeltme, anonimleştirme/silme adayı ve ret kararının auditlenmesi.
- Fiziksel silmenin finans, audit, sözleşme ve yasal saklama yükümlülükleriyle çelişmemesi.

## Asgari veri envanteri

| Veri grubu | Sistem amacı | Ana konum | Paylaşım sınırı | Açık karar |
|---|---|---|---|---|
| Müşteri kimlik/iletişim | Satış, vekâlet, teslim ve bilgilendirme | Tenant DB | Yetkili firma rolleri | Hukuki sebep ve saklama |
| Finans/cari | Tahsilat, iade ve mutabakat | Tenant DB/ledger | Finans rolleri | Mali saklama yükümlülüğü |
| Vekâlet ve belge | Dinî/operasyonel kanıt | Tenant DB + korumalı storage | Yetkili roller | Ses/görüntü ve açık rıza kararı |
| Teslim/QR kanıtı | Doğru paketin teslimi | Tenant DB + storage | Teslim/yönetim | Fotoğraf/imza minimizasyonu |
| Kullanıcı/cihaz/audit | Güvenlik ve denetim | Platform veya tenant güven alanı | Güvenlik/operasyon | Saklama ve çalışan bilgilendirmesi |
| SupportSession metadata | Kontrollü destek | Platform DB + tenant audit | Onaylı destek tarafları | Yetki ve görünür özet |
| Telemetry | Güvenilirlik ve güvenlik | Gözlemlenebilirlik sistemi | Yetkili operasyon | Retention ve PII redaction |

## Privacy gate

Yeni alan, entegrasyon, rapor, AI kullanımı veya export için şu kayıt olmadan geliştirme tamamlanmaz:

1. Amaç ve veri sahibi.
2. Veri sınıfı, zorunluluk ve minimizasyon gerekçesi.
3. Kaynak, alıcı, saklama yeri ve tenant sınırı.
4. Hukuki sebep ve aydınlatma/rıza kararı.
5. Saklama, arşiv, anonimleştirme/silme ve itiraz yöntemi.
6. Yetki, maskeleme, audit, export ve ihlal etkisi.
7. Test verisi ve telemetry redaction senaryosu.

## Açık kararlar

- TilbeCore ile müşteri firma arasındaki veri sorumlusu/veri işleyen rol dağılımı.
- Veri kategorisi bazında kesin saklama süreleri ve legal hold.
- Vekâlet ses/görüntü kanıtının kapsamı ve hukuki dayanağı.
- Yurt dışı altyapı, alt işleyen ve veri aktarım mekanizması.
- Veri sahibi doğrulama yöntemi ve talep yanıt sürelerinin mevzuat/hizmet hedefi.

Bu kararlar tamamlanana kadar belgede tarih veya süre tahmini yazılmaz.
