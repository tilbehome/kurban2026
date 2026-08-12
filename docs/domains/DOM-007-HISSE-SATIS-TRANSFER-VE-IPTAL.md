---
id: DOM-007
title: Hisse, Satış, Transfer ve İptal Domain Sözleşmesi
status: REVIEW
owner: Domain-and-Sales
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-001, REQ-002, REQ-003, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023]
---

# Hisse, satış, transfer ve iptal

## Aggregate sınırı

`ShareCard` hayvanın yedi hisse envanterini, `Share` tek hissenin aktif sahipliğini, `Sale` fiyat snapshot’ı ve satış kararını temsil eder. Satışın finans etkisi [DOM-008](DOM-008-TAHSILAT-KASA-VE-MUTABAKAT.md) üzerinden ledger’a yazılır.

## Değişmez kurallar

- Her hayvanda en fazla ve hedef olarak tam yedi sıra (`1..7`) vardır.
- Bir hisse aynı anda yalnız bir aktif müşteriye/satışa bağlıdır.
- Satılan hissenin liste fiyatı, indirim ve anlaşma fiyatı snapshot’tır; toplu fiyat değişikliği etkilemez.
- Müşteri kabul ettiğinde ödeme olmasa da satış ve alacak oluşur.
- Satış + opsiyonel kapora atomik ve idempotenttir.
- Ödemeli/hareketli satış fiziksel silinmez; iptal ters finans kaydı ve hisse durum geçişi üretir.
- Transfer eski/yeni sahiplik, fiyat farkı, ödeme, vekâlet ve teslim etkisini tarihçede korur.
- İşletmeye kalan yedinci hisse sahte gelir yaratmaz; gerçek kişi ve vekâletle kaydedilir.

## Durumlar

```text
AVAILABLE → RESERVED → SOLD → DELIVERED
AVAILABLE | RESERVED → CANCELLED
SOLD → CANCELLED  (yalnız ters kayıt/iadeyle)
```

Transfer bir `customerId` alanını sessizce değiştirmek değildir; ayrı `ShareTransfer` olayı/aggregate’i `PLANNED` durumundadır.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| Yedi kapasite ve satılabilir hisse saf kuralları | `IMPLEMENTED_PENDING_VERIFICATION` | `packages/tenant-core/src/tenant-domain.ts`. |
| Fiyat snapshot’lı `confirmSale` ve satış ledger kaydı | `IMPLEMENTED_PENDING_VERIFICATION` | `packages/tenant-core/src/tenant-commands.ts`. |
| PostgreSQL share/sale modeli ve unique sıra/idempotency | `IMPLEMENTED_PENDING_VERIFICATION` | Tenant şeması `ShareCard`, `Share`, `Sale`, `SaleShare`. |
| Legacy saha satış ve toplu atama atomik koruması | `IMPLEMENTING` | `/api/saha-satis`, `/api/hisseler/ata`, `/api/hisseler/toplu-ata`; yeni tenant DB’ye taşınmadı. |
| Legacy transfer | `IMPLEMENTING` | `/api/hisseler/[id]/transfer` müşteri alanını güncelliyor; kalıcı transfer aggregate’i/fiyat etkisi yok. |
| Tam iptal/iade/mahsup ve otomatik süre sonu | `PLANNED` | Tenant core reversal sözleşmesi var; bağlı uçtan uca runtime/worker yok. |

## Normal satış komutu

Tenant, sezon, permission ve nesne version doğrulanır; hisse kilitlenir; fiyat snapshot’ı, satış, alacak/ledger, varsa tahsilat, audit ve outbox aynı transaction’da yazılır. Aynı idempotency anahtarı ikinci satış üretmez.

## İstisnalar

- Eşzamanlı satış: yalnız biri commit eder; diğeri `SHARE_NOT_AVAILABLE` alır.
- Kapora süresi: otomatik fiziksel silme yok; iptal adayı ve yetkili/kurallı ters kayıt.
- Ödemeli iptal: iade veya mahsup hedefi belirlenmeden hisse açılmaz.
- Sağlık kaynaklı taşıma: eski hayvan/hisse ve yeni atama birlikte izlenir.
- Transfer: yeni müşteri aynı kişi olamaz; borç/ödeme/vekâlet etkisi açık karara bağlanır.

## Kabul ölçütleri

- Sekizinci veya mükerrer sıra oluşturulamaz.
- Aynı hisse iki eşzamanlı satışta iki müşteriye geçmez.
- Sonradan fiyat güncellemesi eski satış snapshot’ını değiştirmez.
- İptal sonrası satış, ledger, ödeme ve hisse durumu mutabıktır.
- Transfer geçmişi ve önce/sonra tarafları kaybolmaz.

Ayrıntılı akış [WFL-003](../workflows/WFL-003-SATIS-KAPORA-IPTAL-VE-TRANSFER.md), sayfa sözleşmesi [Hisse 360](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) içindedir.
