---
id: DOM-005
title: Tedarikçi ve Satın Alma Domain Sözleşmesi
status: PLANNED
owner: Domain-and-Procurement
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-009, REQ-010, REQ-014, PRO-003, PRO-004]
---

# Tedarikçi ve satın alma

## Sınır

Bu domain tedarikçi kimliği, alış faturası, hayvan lotu/satırı, tedarikçi borcu ve hayvana dağıtılmış gerçek maliyetin sahibidir. Kasa/gider yalnız finansal posting’i tutar; aynı nakliye veya veteriner gideri ikinci kez yazılamaz.

## Değişmez kurallar

- Fatura tedarikçi borcu doğurur.
- Her hayvan benzersiz küpeyle ayrı kayıt ve ayrı gerçek alış bedeli taşır.
- Alış bedeli kilogramdan otomatik türetilmez.
- Toplu faturada satır sayısı, oluşan hayvan sayısı ve tedarikçi borcu atomik mutabık olmalıdır.
- İptal fiziksel silme değildir; fatura/ledger ters kaydı ve hayvan uygunluk etkisi birlikte ele alınır.
- Import önce dry-run, satır hata raporu ve geri dönüş noktası üretir.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| `Supplier` ve `registerSupplier` sözleşmesi | `IMPLEMENTED_UNVERIFIED` | `packages/tenant-core/src/tenant-domain.ts`, `tenant-commands.ts`. |
| PostgreSQL `Supplier`–`Animal` ilişkisi | `IMPLEMENTED_UNVERIFIED` | Tenant şeması ve `0001_tenant_core_baseline`. |
| Tedarikçi/alış faturası aggregate’i ve tedarikçi ledger’ı | `PLANNED` | Tenant şemasında `PurchaseInvoice` ve tedarikçi borç modelleri yok. |
| Legacy tedarik ekranı | `PLANNED` | `app/hayvanlar/tedarik/page.tsx` placeholder. |
| PDF/Excel import ve maliyet dağıtımı | `PLANNED` | Runtime, dry-run ve mutabakat kanıtı yok. |

## Planlanan aggregate’ler

`Supplier`, `PurchaseInvoice`, `PurchaseInvoiceLine`, `AnimalLot`, `SupplierAccount`, `SupplierPayment`, `ExpenseAllocation`.

## Normal akış

1. Tedarikçi bulunur veya oluşturulur.
2. Fatura taslak kaydedilir; belge ve para birimi doğrulanır.
3. Satırlar küpe, hayvan ve gerçek bedelle eşleştirilir.
4. Dry-run mükerrer küpe, eksik bedel ve toplam farkını raporlar.
5. Yetkili onayda fatura, hayvanlar, tedarikçi borcu, audit ve outbox tek transaction’da oluşur.
6. Hayvan kabul/uygunluk sürecine geçer.

## İstisna ve ters işlem

- Mükerrer küpe: bütün işlem bloke edilir; kısmi import yapılmaz.
- Toplam farkı: fatura kesinleşmez.
- İade/iptal: ters fatura ve ledger bağlantısı kurulur; satılmış hayvan/hisseler sessizce silinmez.
- Uygun olmayan hayvan: boş hisseler pasifleşir; satılmış hisseler yetkili çözüm akışına gider.

## Kabul ölçütleri

- 20 geçerli satırdan 20 hayvan ve eşit finans toplamı oluşur.
- Tek hatalı satır dry-run’da görünür; apply canlı veriye yazmaz.
- Aynı gider iki farklı modülde iki kez post edilemez.
- Fatura iptali geçmiş ve tedarikçi bakiyesini izlenebilir biçimde düzeltir.

Hayvan tarafı [DOM-006](DOM-006-HAYVAN-SAGLIK-VE-PADOK.md), uçtan uca zincir [WFL-001](../workflows/WFL-001-UCDAN-UCA-KURBAN-OPERASYONU.md) ile birlikte okunur.
