---
id: DOM-012
title: Soğuk Oda, Yükleme ve Teslimat Domain Sözleşmesi
status: IMPLEMENTED_UNVERIFIED
owner: Domain-and-Fulfillment
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-14
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

`MISSING`, `DAMAGED`, `WRONG_LOCATION`, `DELIVERY_EXCEPTION`, `REVERSED` açık istisna durumlarıdır. Soğuk oda, konum geçmişi, yükleme listesi ve paket checklist'i kodlanmış fakat doğrulanmamıştır.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| Checklist bağlı `DeliveryRecord`, kısmi istisna ve reversal | `IMPLEMENTED_UNVERIFIED` | `0014_faz_10_delivery_offline_tracking`, tenant service/repository/API/UI. |
| Legacy paket/teslim ekran ve API’leri | `IMPLEMENTING` | `/kesim/teslim`, `/api/hisseler/[id]/teslim`; tek kullanımlık QR ve paket checklist’i yok. |
| Soğuk oda/raf konumu ve append-only hareket | `IMPLEMENTED_UNVERIFIED` | `PackageLocation` ve `movePackage`; sıcaklık cihazı kabulü yok. |
| Araç/rota ve taramalı yükleme sözleşmesi | `IMPLEMENTED_UNVERIFIED` | `LoadingList`, `LoadingListItem`, checklist kapsam kontrolü; gerçek araç operasyonu `NOT_RUN`. |
| Süreli QR ve imza/fotoğraf/not kanıt metadata'sı | `IMPLEMENTED_UNVERIFIED` | Korumalı storage metadata'sı ve minimal takip sayfası; gerçek HTTPS/kamera/imza E2E `NOT_RUN`. |

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
