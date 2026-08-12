# Rol Bazlı Eğitim ve Prova Planı

```yaml
id: TRN-006
title: Rol Bazlı Eğitim ve Prova Planı
status: PLANNED
owner: Training
source_role: training_or_support_procedure
reviewers: [Product, Tenant-Owner, Operations, QA]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HER_SEZON_HAZIRLIGINDA
version: 0.1
source_of_truth: false
related_requirements: [PRO-010, PRO-031, PRO-034, PRO-035]
related_adrs: []
related_modules: [platform, finance-ledger, slaughter-packaging-delivery, tenant-mobile]
related_tests: [TST-014, TST-015]
supersedes: []
superseded_by: null
```

## İlke

Eğitim gerçek müşteri/finans verisiyle yapılmaz. Sentetik demo ortamı production tenantından, DB’den ve telemetry’den ayrıdır. Sunum izlemek yeterlilik kanıtı değildir; kullanıcı gerçek görev senaryosunu tamamlar.

## Rol paketleri

| Rol | Zorunlu görevler | Acil durum becerisi |
|---|---|---|
| Platform operatörü | Firma metadata, provisioning, release, health, SupportSession | Incident, read-only/full-stop, backup/restore koordinasyonu |
| Firma Admin | Sezon, kullanıcı/rol, ayar, rapor, onay ve kapanış | Savaş odası, vardiya devir, destek onayı |
| Satış/kasa | Müşteri, hisse, tahsilat, iade/ters kayıt, sayım | Çift tıklama, kasa farkı, offline yasağı |
| Kesim/tartım | Sıra, kimlik, vekâlet, aşama, tartım | Yanlış hayvan/hisse, cihaz fallback’i |
| Paket/teslim | Etiket/QR, konum, yükleme ve tek teslim | Yanlış paket, QR/yazıcı ve manuel kimlik |
| Destek | Ticket, güvenli tanı, log/request ID, SupportSession | Tenant/PII/secret olayı ve eskalasyon |

## Eğitim yöntemi

1. Kısa görev kartı ve rol/yetki sınırı.
2. Eğitmen demosu; hata ve geri dönüş görünür.
3. Kullanıcının sentetik senaryoyu yardımsız tamamlaması.
4. Bir normal, bir yanlış/istisna ve bir acil durum görevi.
5. Sonuç, hata, tekrar eğitim ve sign-off kaydı.

## Prova senaryosu

İki sentetik firma/ayrı DB → sezon hazırlığı → hayvan/yedi hisse → satış/karma tahsilat/vekalet → kesim → tartım/paket → internet veya cihaz kesintisi → kontrollü sync → teslim → kasa/operasyon mutabakatı → sezon kapanışı.

Eğitim “tamamlandı” demek için gerekli iş akışı kodlanmış ve test ortamına bağlı olmalıdır. Placeholder veya sözleşme düzeyindeki ekran eğitim başarısı sayılmaz.

## Kanıt

Rol, anonim kullanıcı/eğitim kimliği, ortam/release, senaryolar, sonuç, destek ihtiyacı, açık beceri ve onaylayan tutulur. Gerçek PII ve ekran görüntüsünde secret bulunmaz. Tam prova sonucu [EVD-010](../evidence/EVD-010-KURBAN-GUNU-PROVA-SABLONU.md) ile bağlanır.
