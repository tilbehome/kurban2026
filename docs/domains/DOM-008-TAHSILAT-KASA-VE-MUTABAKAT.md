---
id: DOM-008
title: Tahsilat, Kasa ve Mutabakat Domain Sözleşmesi
status: REVIEW
owner: Domain-and-Finance
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-008, REQ-019, REQ-021, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-039, REQ-040]
---

# Tahsilat, kasa ve mutabakat

## Finansal kaynak

Hedef mimaride cari, kasa, banka/POS ve raporların tek doğru kaynağı çift taraflı ledger’dır. Para binary `Float` ile tutulmaz. Operasyonel iç defter ile resmî muhasebe/fatura entegrasyonu ayrı sınırlardır.

## Değişmez kurallar

1. Ledger fişinde borç ve alacak toplamı eşit değilse posting olmaz.
2. Tahsilat nakit, banka/havale ve POS parçalarına ayrılabilir; parçaların toplamı tahsilata eşittir.
3. Tahsilat bir veya daha fazla müşteri/hisse borcuna dağıtılır; artan/hedefsiz tutar açık politikaya tabidir.
4. Ödeyen ile borcun yararlanıcısı ayrı kimlikler olabilir.
5. POS vade farkı yalnız POS anaparasına uygulanır.
6. Finansal hareket silinmez; ters kayıt, iade veya mahsup kullanılır.
7. Kasa oturumu açılış, fiziksel sayım, beklenen/sayılan fark, devir ve kapanış taşır.
8. Kapalı sezona/döneme doğrudan posting yapılmaz.
9. Kaporasız rezervasyon ve işletme envanterindeki satılmamış hisse satış, gelir veya müşteri alacağı ledger kaydı üretmez.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| Decimal string, dağıtım toplamı ve reversal saf fonksiyonları | `IMPLEMENTED_PENDING_VERIFICATION` | `packages/tenant-core/src/finance-ledger.ts`. |
| PostgreSQL `LedgerEntry` ve reversal bağı | `IMPLEMENTED_PENDING_VERIFICATION` | Tenant PostgreSQL şeması. |
| Legacy karma tahsilat, idempotency ve kasa hareketleri | `IMPLEMENTING` | `/api/tahsilat/odeme`; SQLite `Float`, tam çift taraflı ledger değil. |
| Legacy ödeme iptali | `IMPLEMENTING` | `/api/tahsilat/iptal/[id]`; transaction/audit var, hedef ledger reversal’a taşınmadı. |
| Kasa 360, banka/POS settlement ve sıfır fark mutabakatı | `PLANNED` | `/kasa/banka-mutabakat` placeholder; ayrı kasa oturumu/settlement modeli yok. |
| Alt kg iadesi posting’i | `PLANNED` | Saf adjustment sözleşmesi var; gerçek satış/paket/ledger orkestrasyonu yok. |

## Kasa oturumu durumu

```text
DRAFT → OPEN → HANDOVER_PENDING → OPEN | CLOSING → CLOSED
                          \→ DIFFERENCE_REVIEW
```

Bu durum makinesi ve ikinci onay akışı `PLANNED` durumundadır.

## Komutlar

`OpenCashSession`, `CollectPayment`, `AllocatePayment`, `ReverseReceipt`, `CreateRefund`, `PostAdjustment`, `CountCash`, `CloseCashSession`, `ReconcileBankPos`.

Her kritik komut tenant/sezon/kasa/cihaz bağlamı, permission, idempotency, transaction, audit ve requestId taşır. Kasa kapanışı ve yüksek riskli ters kayıt yeniden doğrulama veya ikinci onay ister.

## Mutabakatlar

- Tahsilat toplamı = yöntem parçaları toplamı.
- Dağıtım toplamı = tahsilat toplamı.
- Kasa beklenen = açılış + nakit giriş − nakit çıkış.
- Sayılan − beklenen = açıklanmış kasa farkı.
- Banka/POS internal hareketleri = sağlayıcı settlement kayıtları; fark açık istisnadır.
- Müşteri sezon bakiyesi = ledger borç − alacak.

## Kabul ölçütleri

- Aynı idempotency anahtarı ikinci tahsilat üretmez.
- Karma ödeme yalnız POS parçasına vade farkı uygular.
- Hatalı tahsilat silinmeden bağlı ters kayıtla sıfırlanır.
- Kasa kapanış farkı gizlenemez; gerekçe ve onay gerekir.
- Cari/kasa/banka-POS raporları aynı ledger’dan sıfır açıklanamayan fark verir.

Akış [WFL-004](../workflows/WFL-004-TAHSILAT-IADE-VE-KASA.md), sayfa sözleşmesi [Kasa 360](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) içindedir.
