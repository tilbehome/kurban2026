---
id: DOM-013
title: Faturalar 360, e-Belge ve Ölçü Birimleri Domain Sözleşmesi
status: IMPLEMENTED_UNVERIFIED
owner: Domain-and-Finance
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
related_requirements: [REQ-009, REQ-010, REQ-024, REQ-025, REQ-028, REQ-068, PRO-037, PRO-038]
---

# Faturalar 360, e-Belge ve ölçü birimleri

Bu belge alış, satış, iade ve resmî elektronik belge süreçlerinin tek fatura aggregate'i çevresindeki sınırlarını tanımlar. İç operasyon faturası ile GİB/özel entegratör belgesi aynı şey değildir. Gerçek sağlayıcı bağlantısı, resmî kod eşlemesi ve dış ortam kabulü yapılmadan e-Fatura veya e-Arşiv entegrasyonu tamamlanmış sayılmaz.

## Fatura sınıflandırması ve durumları

Fatura yönü (`PURCHASE` / `SALE`), ticaret türü, belge niteliği ve elektronik kanal birbirinden bağımsız eksenlerdir. Muhasebe, ödeme ve elektronik belge durumları ayrı tutulur:

- muhasebe: `DRAFT → SUBMITTED → APPROVED → POSTED`; red, iptal ve ters kayıt açık geçişlerle yapılır;
- ödeme: açık, kısmi, ödendi veya iade durumudur; tahsis toplamından türetilir;
- elektronik belge: hazırlanmadı, kuyrukta, gönderildi, teslim edildi, kabul/red/iptal/itiraz durumlarıdır.

Onaylanmış veya işlenmiş fatura fiziksel olarak silinmez. İade ve düzeltme, asıl belgeye bağlanan yeni belge veya dengeli ledger ters kaydıdır. Fatura posting'i borç ve alacak toplamı eşit olmayan journal üretmez. Ödeme/tahsilat tahsisi açık, kısmi, ödenmiş veya açıkça görünür fazla ödeme durumunu üretir; fazla tutarın mahsup/iade kararı ayrıca auditli süreç ister.

## Faturalar 360 görünümü

Kalıcı fatura; taraf snapshot'ları, satırlar, vergi bileşenleri, ekler, zaman çizelgesi, ödeme tahsisleri, ledger bağlantısı ve e-Belge teslimat geçmişiyle tek kimlik altında okunur. Satır, hayvan/hisse/satış/satın alma/gider bağlarını taşıyabilir. 20 satırlı hayvan alışında fatura, 20 hayvan, 140 hisse, tedarikçi borcu ve dengeli journal aynı transaction içinde üretilir.

## Ölçü ve işlem birimleri

`UnitOfMeasure`, sistem birimleri ile tenant'a ait firma birimlerini aynı modelde, tenant kapsamını açıkça koruyarak yönetir. Kategori listesi kontrollüdür; birim kod listesi kapalı enum değildir. Sistem birimleri korunur, firma kodu tenant içinde benzersizdir, kullanılan birim fiziksel olarak silinmez ve kullanılmış birimin kod/ad/sembol/kategori anlamı sessizce değiştirilemez.

Fatura satırı yalnız yabancı anahtar tutmaz; `unitId` yanında kod, ad ve sembol snapshot'larını taşır. Böylece sonraki tanım değişiklikleri onaylanmış fatura tarihini değiştirmez. `KG ↔ GR`, `LT ↔ ML` ve `METRE ↔ CM` genel dönüşümleri desteklenir. `1 koli = 24 adet` gibi ürüne/hayvana/hizmete özel oranlar genel birim tablosuna yazılmaz; tarih aralıklı `ItemSpecificUnitConversionContract` genişleme noktasıyla ayrı tutulur.

Firma Yönetim Merkezi temel ekranı listeleme, yeni firma birimi, aktif/pasif durum, sembol, hassasiyet, kesir izni, kullanım sayısı ve sistem/firma ayrımını sunar. Güncelleme use-case/API sözleşmesi vardır; ayrıntılı düzenleme deneyimi ve kullanım yerine drill-down `PLANNED` durumundadır.

Yetkiler:

- `definitions.units.read.organization`
- `definitions.units.create.organization`
- `definitions.units.update.organization`
- `definitions.units.activate.organization`
- `definitions.units.deactivate.organization`

## e-Belge sağlayıcı sınırı

`EInvoiceProvider` bağlantı testi, kabiliyet sorgusu, mükellef sorgusu, gönderim/alım, durum, yanıt, iptal, itiraz, XML/PDF indirme ve doğrulanmış webhook sözleşmesini kapsar. Sağlayıcıya özel hata ve durumlar kontrollü iç kodlara çevrilir. Gönderim outbox/worker üzerinden idempotent yapılır; üstel geri çekilme ve dead-letter vardır. Ham sağlayıcı hata metni, credential veya bağlantı bilgisi kalıcı hata alanına yazılmaz.

Bağlantı ayarı yalnız `secret://` referansı kabul eder; secret değerini tenant DB'ye yazmaz. Ayar değişikliği kritik yetki ve yakın zamanlı yeniden doğrulama ister. Webhook sağlayıcı adaptöründe doğrulanır, replay penceresi ve tekil olay kimliğiyle işlenir.

İç birim kodu GİB/UBL-TR veya özel entegratör kodu değildir. `internalUnit → providerUnitCode` eşlemesi sağlayıcı ve kılavuz sürümüyle ayrı tabloda tutulur. Doğrulanmış eşleme yoksa gönderim `E_DOCUMENT_UNIT_MAPPING_REQUIRED` ile fail-closed olur. Bu pakette resmî kod tahmini veya varsayılan provider mapping seed'i yoktur.

## Gerçek uygulama ve kabul sınırı

| Dilim | Durum | Kanıt / sınır |
|---|---|---|
| Fatura aggregate, status/invariant, ledger posting ve ödeme tahsisi | `IMPLEMENTED_UNVERIFIED` | Tenant migration `0008`, Faturalar modülü ve gerçek PostgreSQL integration testleri. |
| Tenant-aware birimler, snapshot ve güvenli genel dönüşümler | `IMPLEMENTED_UNVERIFIED` | `UnitOfMeasure`, repository/service/API/temel UI ve PostgreSQL constraint/trigger testleri. |
| Sağlayıcı sözleşmesi, mock/sandbox, outbox worker ve webhook | `IMPLEMENTED_UNVERIFIED` | Yalnız sentetik `mock-sandbox`; gerçek sağlayıcı değildir. |
| Gerçek GİB/özel entegratör bağlantısı ve güncel kod eşlemesi | `BLOCKED` | Sağlayıcı seçimi, credential, sözleşme, resmî kılavuz doğrulaması ve test ortamı yoktur. |
| Production e-Fatura/e-Arşiv gönderimi | `NOT_RUN` | Production endpoint/secret yoktur; production kabul iddiası yoktur. |

Güncel mevzuat ve teknik paketler uygulama sırasında kod içine kopyalanmaz; resmî [e-Fatura mevzuat ve teknik mimari](https://ebelge.gib.gov.tr/efaturamevzuat.html) ile [e-Arşiv mevzuat ve teknik kılavuz](https://ebelge.gib.gov.tr/earsivmevzuat.html) sayfaları seçilen sağlayıcı sürümü için yeniden doğrulanır.
