---
id: DOM-004
title: Müşteri ve Sezon Carisi Domain Sözleşmesi
status: PLANNED
owner: Domain-and-Finance
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-025, PRO-004, PRO-005, PRO-009]
---

# Müşteri ve sezon carisi

## Amaç ve sınır

Müşteri kalıcı kişi/kurum kimliğidir; sezon carisi belirli sezonun borç, alacak ve hareket görünümüdür. Müşteri, hissedar, ödeyen ve teslim alan aynı kişi olmak zorunda değildir. Bu ayrım satış, tahsilat ve teslimat sözleşmelerinde kimliklerle korunur.

## Değişmez kurallar

1. Her gerçek hissedar ayrı müşteri kartıdır.
2. Aynı telefon farklı aile üyelerinde kullanılabilir; sistem birleştirmez, uyarır.
3. Müşteri birden fazla hisse ve sezonla ilişkilendirilebilir.
4. Telefon normalize arama sinyalidir; tek başına benzersizlik anahtarı değildir.
5. Sezon bakiyesi yalnız aynı `tenantInstanceId`, `seasonId` ve `customerId` kapsamındaki ledger hareketlerinden hesaplanır.
6. Cari kayıt fiziksel silinmez; düzeltme ters kayıt/mahsup ile yürür.
7. KVKK ve iletişim izni ayrı amaçlar ve ayrı zaman damgalarıdır.

## Veri ve sorgu sözleşmesi

Müşteri 360 görünümü kimlik, iletişim, hisseler, satışlar, sezon ekstreleri, tahsilatlar, vekâletler, teslimatlar, notlar ve audit zaman çizelgesini bir araya getirir; finansal toplamı ekran sorgularından yeniden uydurmaz.

`CustomerSeasonAccount` en az `debitTotal`, `creditTotal` ve `balance` alanlarını taşır. Mükerrer adayları ayrı bir veri kalitesi süreci çözer; otomatik birleştirme yapılmaz.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| Telefon normalizasyonu ve sezon hesaplama sözleşmesi | `IMPLEMENTED_UNVERIFIED` | `packages/tenant-core/src/customer-account.ts`. |
| PostgreSQL `Customer` ve sezon ilişkisi | `IMPLEMENTED_UNVERIFIED` | `packages/database-tenant/prisma/schema.prisma`. |
| `CustomerPhone`, `CustomerAddress`, normalize arama ve mükerrer uyarısı | `IMPLEMENTED_UNVERIFIED` | Tenant migration `0004`, master-data use-case/repository ve müşteri API adapter'ı; ortak telefon unique değildir ve otomatik merge yoktur. |
| Legacy müşteri detayında hisse, tahsilat, vekâlet ve not görünümü | `IMPLEMENTING` | `app/musteriler/[id]/page.tsx`; feature flag kapalıyken SQLite uyumluluğu sürer. |
| Sezonlar arası müşteri 360/cari | `IMPLEMENTED_UNVERIFIED` | `CustomerSeasonAccount`, tenant müşteri liste/detay ekranı ve sezon geçmişi. Finans posting entegrasyonunun genişletilmesi sonraki finans paketindedir. |
| Mükerrer kayıt merkezi, KVKK talebi ve müşteri portalı | `PLANNED` | Sözleşme/gereksinim var; bağlı tam runtime yok. |

## Komut, sorgu ve olaylar

- Komutlar: `CreateCustomer`, `UpdateCustomerIdentity`, `RecordConsent`, `FlagDuplicateCandidate`, `ResolveDuplicateCandidate`.
- Sorgular: `GetCustomer360`, `GetCustomerSeasonStatement`, `SearchCustomers`, `GetCustomerHistory`.
- Olaylar: `customer.created`, `customer.updated`, `customer.duplicate_flagged`, `customer.consent_changed`.

## İstisnalar

- Aynı telefon: engel değil; kullanıcıya eşleşen kartlar ve “farklı kişi oluştur” seçeneği gösterilir.
- Yanlış birleştirme: geçmişi sessizce taşımak yasaktır; yetkili, auditli ayrıştırma/düzeltme akışı gerekir.
- Sezon dışı ödeme: hedef sezon ve borç seçilmeden posting yapılamaz.
- Arşiv sezon: yalnız görüntüleme/export; düzeltme, açık politika ve yeni dönem ters kaydı gerektirir.

## Kabul ölçütleri

- Aynı telefonla iki ayrı müşteri oluşturulabilir ve uyarı görülür.
- Bir müşteri iki sezonda iki ayrı ekstreye sahiptir.
- Hissedar ile ödeyen farklı olduğunda makbuz ve dağıtım doğru kimlikleri taşır.
- Yetkisiz rol finans veya iletişim ayrıntılarını göremez.
- Müşteri silme talebi finans/audit saklama kurallarını ihlal etmez.

Sayfa sözleşmesi [Müşteri 360](../ux/UX-003-360-SAYFA-SOZLESMELERI.md), finans akışı [WFL-004](../workflows/WFL-004-TAHSILAT-IADE-VE-KASA.md) içindedir.
