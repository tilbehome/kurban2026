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

`ShareCard` hayvanın tam yedi hisselik envanterini, `Share` tek hissenin rezervasyon veya sahiplik durumunu, `Sale` ise kaporayla kesinleşmiş fiyat snapshot’ı ve satış kararını temsil eder. Satışın finans etkisi [DOM-008](DOM-008-TAHSILAT-KASA-VE-MUTABAKAT.md) üzerinden ledger’a yazılır.

## Değişmez kurallar

- Her büyükbaş hayvanda `1..7` sıra numaralı tam yedi hisse bulunur; eksik kart da sekizinci hisse de kabul edilmez.
- Bir hisse aynı anda yalnız bir aktif rezervasyona veya bir kesin satışa bağlıdır.
- Satılan hissenin liste fiyatı, indirim ve anlaşma fiyatı snapshot’tır; toplu fiyat değişikliği etkilemez.
- Rezervasyon hisseyi süreli tutar; satış, gelir, müşteri alacağı veya vekâlet üretmez.
- Herhangi bir pozitif tutar kapora sayılabilir. Kapora alınmadan işlem kesin satışa dönmez ve alacak doğurmaz.
- Kesin satış, hisse sahipliği, alacak ve kapora/tahsilat aynı transaction içinde atomik ve idempotent oluşur.
- Ödemeli/hareketli satış fiziksel silinmez; iptal ters finans kaydı ve hisse durum geçişi üretir.
- Transfer eski/yeni sahiplik, fiyat farkı, ödeme, vekâlet ve teslim etkisini tarihçede korur.
- Satılmamış hisse işletme envanteri/sahipliği olarak kalır; sahte müşteri, satış, gelir, alacak veya vekâlet üretmez.
- İşletme envanterindeki hisse daha sonra gerçek kişiye satılırsa müşteri, kesin satış, pozitif kapora ve vekâlet normal akıştan oluşturulur.

## Durumlar

```text
AVAILABLE/BUSINESS_INVENTORY → RESERVED → SOLD → DELIVERED
RESERVED → AVAILABLE/BUSINESS_INVENTORY  (süre sonu veya rezervasyon iptali)
SOLD → CANCELLED                          (yalnız ters kayıt/iadeyle)
```

Transfer bir `customerId` alanını sessizce değiştirmek değildir; ayrı `ShareTransfer` olayı/aggregate’i `PLANNED` durumundadır.

`BUSINESS_INVENTORY` burada bağlayıcı iş anlamıdır; mevcut tenant durum modelinde ayrı bir enum olarak kodlanmamıştır ve uygulaması `PLANNED` durumundadır.

## Kaynak önceliği ve açık karar farkı

- Bağlayıcı ana mimari §6.3, tam yedi hisseyi ve herhangi bir pozitif tutarın kapora olabileceğini tanımlar.
- Yeni nesil yol haritası YN-13/YN-14 rezervasyon ile satışı ayırır; taslak/rezervasyon süresi ve işletmeye kalan açık sahipliği ister.
- 2026-08-12 tarihli kullanıcı düzeltmesi, kaporasız işlemin kesin satış/alacak sayılmamasını ve satılmamış hissenin işletme envanteri olarak tutulmasını bağlayıcı kılar.
- Ana mimari §6.3 içindeki “ödeme olmasa da satış ve alacak oluşur” ve kesim öncesi gerçek kişi/vekâlet atama ifadeleri bu kararla çelişmektedir. Belgeler bu farkı gizlemez: kaporasız kayıt rezervasyondur; sahte kişi veya vekâlet üretilmez. Satılmamış işletme hissesinin kesim öncesi nasıl dinî uygunluğa getirileceği mimari belgede açık karar gerektirir; karar verilene kadar normal kesim hazırlığında blokaj/istisna olarak gösterilir.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| En fazla yedi kapasite ve satılabilir hisse saf kuralları | `IMPLEMENTING` | `packages/tenant-core/src/tenant-domain.ts` sıra aralığını/tekrarı ve sekiz üstünü engelliyor; tam yedi kaydın varlığını zorunlu kılmıyor. |
| Rezervasyon–kesin satış ayrımı ve kapora şartı | `IMPLEMENTING` | Tenant modelinde `reserved` vardır; ancak `confirmSale` kapora girdisi olmadan satış ve ledger üretir. Legacy saha satış da sıfır kaporayla müşteri atayıp borç açar. Bu, bağlayıcı doküman kararıyla kod farkıdır. |
| İşletme envanteri sahipliği | `PLANNED` | Ayrı sahiplik/durum modeli ve sahte kişi/finans/vekâlet üretmeme doğrulamaları kodda tamamlanmış değildir. |
| PostgreSQL share/sale modeli ve unique sıra/idempotency | `IMPLEMENTED_PENDING_VERIFICATION` | Tenant şeması `ShareCard`, `Share`, `Sale`, `SaleShare`. |
| Legacy saha satış ve toplu atama atomik koruması | `IMPLEMENTING` | `/api/saha-satis`, `/api/hisseler/ata`, `/api/hisseler/toplu-ata`; yeni tenant DB’ye taşınmadı. |
| Legacy transfer | `IMPLEMENTING` | `/api/hisseler/[id]/transfer` müşteri alanını güncelliyor; kalıcı transfer aggregate’i/fiyat etkisi yok. |
| Tam iptal/iade/mahsup ve otomatik süre sonu | `PLANNED` | Tenant core reversal sözleşmesi var; bağlı uçtan uca runtime/worker yok. |

## Rezervasyon ve kesin satış komutları

Rezervasyonda tenant, sezon, permission, hisse müsaitliği, süre ve nesne version doğrulanır; yalnız rezervasyon olayı/audit yazılır. Kesin satışta hisse yeniden kilitlenir; pozitif kapora, fiyat snapshot’ı, satış, alacak/ledger, kapora tahsilatı/dağıtımı, audit ve outbox aynı transaction’da yazılır. Aynı idempotency anahtarı ikinci rezervasyon, satış veya tahsilat üretmez.

## İstisnalar

- Eşzamanlı satış: yalnız biri commit eder; diğeri `SHARE_NOT_AVAILABLE` alır.
- Kapora süresi: kaporasız rezervasyon süre sonunda fiziksel silinmez; süre sonu olayıyla işletme envanterine açılır. Kesin satış reversal’ı üretilmez çünkü henüz satış/alacak yoktur.
- Ödemeli iptal: iade veya mahsup hedefi belirlenmeden hisse açılmaz.
- Sağlık kaynaklı taşıma: eski hayvan/hisse ve yeni atama birlikte izlenir.
- Transfer: yeni müşteri aynı kişi olamaz; borç/ödeme/vekâlet etkisi açık karara bağlanır.

## Kabul ölçütleri

- Sekizinci veya mükerrer sıra oluşturulamaz.
- Hayvan hisse kartı tam yedi sıra olmadan tamamlanmış sayılamaz.
- Kaporasız rezervasyon müşteri carisinde borç, gelir veya satış olarak görünmez.
- İşletme envanterindeki hisse müşteri ve vekâlet üretmez; gerçek kişiye satışta normal kapora/vekâlet akışı çalışır.
- Aynı hisse iki eşzamanlı satışta iki müşteriye geçmez.
- Sonradan fiyat güncellemesi eski satış snapshot’ını değiştirmez.
- İptal sonrası satış, ledger, ödeme ve hisse durumu mutabıktır.
- Transfer geçmişi ve önce/sonra tarafları kaybolmaz.

Ayrıntılı akış [WFL-003](../workflows/WFL-003-SATIS-KAPORA-IPTAL-VE-TRANSFER.md), sayfa sözleşmesi [Hisse 360](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) içindedir.
