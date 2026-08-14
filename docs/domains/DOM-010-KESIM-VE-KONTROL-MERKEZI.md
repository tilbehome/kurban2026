---
id: DOM-010
title: Kesim ve Kontrol Merkezi Domain Sözleşmesi
status: IMPLEMENTED_UNVERIFIED
owner: Domain-and-Slaughter-Operations
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
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
- Tam yedi hisse kaydı vardır; kesin satılan gerçek kişi hisselerinin gerekli vekâletleri tamamdır. Satılmamış işletme hissesi varsa açık karar/blokaj görünürdür; sahte müşteri veya vekâletle kapatılamaz.
- Kesim sırası ve hayvan kimliği taramayla doğrulanır.
- Yetkili kullanıcı/cihaz/istasyon atanmıştır.
- Açık finans veya belge blokajı firma politikasına göre görünür; override gerekçe ve yetki ister.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| Kilitli kesim geçiş koruması ve PostgreSQL `SlaughterJob` | `IMPLEMENTED_UNVERIFIED` | `operation-flow.ts`, `0012_faz_8_slaughter_command_center`, transaction ve idempotency hattı. |
| Legacy TV kontrol, sıra ve aşama API’leri | `IMPLEMENTING` | `/tv/kontrol`, `/api/tv/*`; string durumlar ve legacy SQLite kullanıyor. |
| Sıra/ekip/istasyon geçmişi, kalıcı istisna kuyruğu ve komuta read-model'i | `IMPLEMENTED_UNVERIFIED` | Tenant repository/API ve `QurbanOperationsWorkspace`; manuel doğrulama çalıştırılmadı. |
| Normal/kısıtlı/salt-okunur/acil durdurma modu | `IMPLEMENTED_UNVERIFIED` | `OperationModeState`; riskli yazılar fail-closed bloke edilir. |
| Gerçek Kurban Günü, vardiya, yük ve fiziksel cihaz kabulü | `NOT_RUN` | Faz 12 saha/dış kabul borcudur. |

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
