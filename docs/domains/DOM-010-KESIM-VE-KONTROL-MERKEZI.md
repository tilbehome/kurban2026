---
id: DOM-010
title: Kesim ve Kontrol Merkezi Domain Sözleşmesi
status: REVIEW
owner: Domain-and-Slaughter-Operations
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-012, REQ-014, REQ-029, REQ-035, REQ-036, PRO-001, PRO-006, PRO-032, PRO-034]
---

# Kesim ve kontrol merkezi

## Amaç

Kurban Günü Kontrol Merkezi kesim, parçalama, tartım, paketleme, soğuk oda ve teslim kuyruklarını; blokaj, cihaz sağlığı ve istisnalarla birlikte yönetir. Dashboard yalnız gösterge değil, yetkili komut ve sorun masası yüzeyidir.

## Kesim işi durumları

Kod sözleşmesindeki durumlar:

```text
WAITING → READY → SLAUGHTERING → WEIGHING → PACKING
→ READY_FOR_DELIVERY → DELIVERED
```

Her aktif durumdan `EXCEPTION` açılabilir; `EXCEPTION` yalnız kontrollü olarak `WAITING` veya `READY` durumuna döner. Doğrudan atlama yasaktır.

## Önkoşullar

- Hayvan uygun ve doğru tenant/sezondadır.
- Yedi hisse ve gerekli vekâletler tamamdır.
- Kesim sırası ve hayvan kimliği taramayla doğrulanır.
- Yetkili kullanıcı/cihaz/istasyon atanmıştır.
- Açık finans veya belge blokajı firma politikasına göre görünür; override gerekçe ve yetki ister.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| Saf kesim geçiş koruması ve PostgreSQL `SlaughterJob` | `IMPLEMENTED_PENDING_VERIFICATION` | `operation-flow.ts`, tenant şeması ve `0002_tenant_operation_flow`. |
| Legacy TV kontrol, sıra ve aşama API’leri | `IMPLEMENTING` | `/tv/kontrol`, `/api/tv/*`; string durumlar ve legacy SQLite kullanıyor. |
| Operasyon istisna kuyruğu sözleşmesi | `IMPLEMENTED_PENDING_VERIFICATION` | `packages/operations/src/dashboard-contracts.ts`; gerçek bağlı kontrol merkezi UI/read model yok. |
| Kesim Günü gerçek komuta merkezi, cihaz sağlığı ve vardiya devri | `PLANNED` | Bazı kesim sayfaları placeholder; uçtan uca runtime/E2E yok. |
| Kısıtlı/offline/read-only modların istasyon uygulaması | `PLANNED` | Tenant runtime read-only politikası platform düzeyinde var; saha UX/sync tamam değil. |

## Kontrol merkezi read model’i

En az şu sinyalleri taşır: toplam/tamamlanan hayvan, aşama kuyrukları, bekleme süresi, aktif istasyon, sorumlu, vekâlet/ödeme/etiket blokajı, terazi-yazıcı-tarayıcı-ağ/sync durumu, açık incident ve teslimat darboğazı. TV görünümü PII ve finans içermez.

## Komutlar

`StartSlaughter`, `CompleteSlaughter`, `HoldJob`, `ReportException`, `ResolveException`, `ChangeQueue`, `AssignStation`, `AssignOperator`, `SetOperationMode`.

Sıra değişikliği kurban numarasını değiştirmez. Kritik override yeniden doğrulama/ikinci onay ve gerekçe ister.

## Kabul ölçütleri

- Eksik vekâletle normal kesim başlatılamaz.
- Aynı hayvan iki istasyonda aktif olamaz.
- Geçersiz aşama atlaması reddedilir.
- Sıra değişikliği TV, görev ekranı ve audit’te aynı sonucu gösterir.
- Açık istisna vardiya değişiminde kaybolmaz.
- TV’de ad, telefon veya finans bilgisi çıkmaz.

Uçtan uca istasyon akışı [WFL-006](../workflows/WFL-006-KURBAN-GUNU-KESIMDEN-TESLIME.md), cihaz standardı [UX-004](../ux/UX-004-CIHAZ-VE-YERLESIM-STANDARDI.md) içindedir.
