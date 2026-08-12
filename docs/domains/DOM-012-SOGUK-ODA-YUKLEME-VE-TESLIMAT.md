---
id: DOM-012
title: Soğuk Oda, Yükleme ve Teslimat Domain Sözleşmesi
status: PLANNED
owner: Domain-and-Fulfillment
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-041, REQ-042, REQ-043, REQ-034, PRO-032, PRO-033, PRO-035]
---

# Soğuk oda, yükleme ve teslimat

## Amaç

Paketin hayvan–hisse–müşteri bağını soğuk oda konumu, araç yükleme ve teslim kanıtı boyunca korumaktır. Yerinde teslim ve adrese teslim ayrı operasyon türleridir.

## Değişmez kurallar

- Paket yalnız doğrulanmış raf/konuma yerleştirilir; giriş/çıkış olayları geçmişe eklenir.
- Araç yükleme paket tarama checklist’iyle yürür; yanlış araç/rota/müşteri paketi bloke edilir.
- Bir hisse yalnız bir kez teslim kapanışı alır.
- Bütün zorunlu paketler taranmadan teslim tamamlanmaz.
- Teslim alan, hissedar ve ödeyen farklı olabilir; yetki/kanıt açıkça kaydedilir.
- Kalan borç uyarısı görünür; override gerekçe, yetki ve audit ister.
- Teslim geri alma doğrudan durum değiştirmez; bağlantılı reversal/istisna üretir.
- Hayvan, yedi hissenin tamamı teslim edilmeden kapanmaz.

## Durumlar

```text
PACKED → COLD_STORAGE → PICKED → LOADED → OUT_FOR_DELIVERY
→ READY_FOR_HANDOFF → DELIVERED
```

`MISSING`, `DAMAGED`, `WRONG_LOCATION`, `DELIVERY_EXCEPTION`, `REVERSED` açık istisna durumlarıdır. Soğuk oda ve yükleme modelleri henüz kodlanmadığı için bu durum makinesi `PLANNED` kabul edilir.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| `DeliveryRecord` ve teslim reversal saf fonksiyonu | `IMPLEMENTED_UNVERIFIED` | Tenant core ve PostgreSQL tenant şeması. |
| Legacy paket/teslim ekran ve API’leri | `IMPLEMENTING` | `/kesim/teslim`, `/api/hisseler/[id]/teslim`; tek kullanımlık QR ve paket checklist’i yok. |
| Soğuk oda konumu, sıcaklık ve raf hareketi | `PLANNED` | Model, API ve UI yok. |
| Araç, sürücü, rota ve taramalı yükleme | `PLANNED` | `app/lojistik/*` placeholder; operasyon modeli yok. |
| Tek kullanımlık teslim kodu/imza/fotoğraf kanıtı | `PLANNED` | QR sözleşmesi var; teslim orkestrasyonu/E2E yok. |

## Komut ve olaylar

Komutlar: `StorePackage`, `MovePackage`, `PickPackage`, `LoadVehicle`, `StartRoute`, `VerifyHandoff`, `CompleteDelivery`, `ReverseDelivery`, `ReportMissingPackage`.

Olaylar: `package.stored`, `package.picked`, `package.loaded`, `delivery.completed`, `delivery.reversed`, `package.missing_reported`.

## Kabul ölçütleri

- Bir paket aynı anda iki soğuk oda konumunda görünmez.
- Eksik/fazla paketle yükleme veya teslim kapanmaz.
- Başka müşterinin paketi tarandığında PII sızdırmadan güvenli hata verilir.
- Kullanılmış teslim tokenı ikinci kapanış üretemez.
- Teslim reversal nedeni, yetkilisi ve önceki kanıtı korur.
- Yedi teslim tamamlanmadan hayvan kapanışı reddedilir.

Offline sınırı [WFL-009](../workflows/WFL-009-OFFLINE-VE-YENIDEN-SENKRONIZASYON.md), cihaz yerleşimi [UX-004](../ux/UX-004-CIHAZ-VE-YERLESIM-STANDARDI.md) içindedir.
