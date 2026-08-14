---
id: WFL-010
title: Fatura, Ledger, Tahsilat ve e-Belge Akışı
status: IMPLEMENTED_UNVERIFIED
owner: Domain-and-Finance
source_role: business_workflow_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
related_requirements: [REQ-009, REQ-010, REQ-024, REQ-025, REQ-028, REQ-068, PRO-037, PRO-038]
---

# Fatura, ledger, tahsilat ve e-Belge akışı

## İç fatura ve finans akışı

```text
Taslak + taraf/satır/birim snapshot'ı
→ onaya gönder
→ yetkili onay veya red
→ dengeli journal ile işle
→ ödeme/tahsilat tahsis et
→ gerekirse asıl belgeye bağlı iade/ters kayıt
```

- Aynı idempotency anahtarı ve aynı payload ikinci fatura üretmez; farklı payload reddedilir.
- Posting yalnız `APPROVED` durumundan ve yakın zamanlı yeniden doğrulamayla yapılır.
- Toplamlar satır, indirim ve vergi bileşenlerinden kesin Decimal aritmetiğiyle hesaplanır.
- Alışta matrah + indirilecek vergi tedarikçi borcuna; satışta müşteri alacağı matrah + hesaplanan vergiye dengeli yazılır. İade aynı hesapları ve gerçek tutarları ters çevirir.
- Tahsis transaction'ı hedef faturayı ve kaynak Receipt/SupplierPayment satırını kilitler; bütün faturalardaki kaynak tahsis toplamı kaynak tutarı aşamaz.
- İade taraf/sezon/organization/ticaret türü/para birimi kapsamını ve asıl faturanın ters yönünü korur; işlenmiş iadelerin kümülatif toplamı kalan iade edilebilir tutarı aşamaz.
- Çoklu para birimi `PLANNED` durumundadır; bu akış yalnız TRY için açıktır.
- İşlenmiş belge, ödeme ve ledger hareketi fiziksel olarak silinmez.
- Alış faturasından hayvan üretimi fatura, hayvan, hisse, tedarikçi borcu, audit/outbox ve journal ile atomiktir.

## Elektronik belge akışı

```text
İşlenmiş iç fatura
→ aktif tenant bağlantısı ve provider capability kontrolü
→ bütün birimlerin sürümlü provider mapping kontrolü
→ korumalı XML storage anahtarı
→ idempotent outbox/delivery işi
→ worker gönderimi
→ normalize durum veya güvenli retry/dead-letter
→ imzası doğrulanmış, replay korumalı webhook
→ fatura zaman çizelgesi ve audit
```

Eşlenemeyen birim, yapılandırılmamış sağlayıcı, uygun olmayan kanal veya doğrulanmamış webhook fail-closed sonuç verir. Ham provider cevabı, secret, vergi kimliği veya kişisel veri hata loguna kopyalanmaz.

## Durum ve yetki ayrımı

Fatura okuma/oluşturma/onay/posting/ters kayıt/ödeme yetkileri ile e-Belge gönderim/yanıt/iptal/retry/ayar/audit yetkileri ayrıdır. Kritik posting, ters kayıt, iptal ve entegrasyon ayarı yakın zamanlı yeniden doğrulama ister. Tenant kimliği her repository sorgusuna taşınır; başka tenant kaydı ID bilinse dahi okunamaz veya değiştirilemez.

## Kabul kanıtları

- Gerçek PostgreSQL'de migration `0001..0009` boş veritabanına uygulanır.
- İki tenant aynı birim/fatura kimliği veya koduyla birbirini görmez.
- 20 satırlı alış faturası 20 hayvan, 140 hisse, doğru tedarikçi borcu ve dengeli journal üretir.
- Kullanılmış birim anlamı değiştirilemez; silme reddedilir, pasifleştirme mümkündür.
- Fatura birim snapshot'ı sonradan tanım değişse de aynı kalır.
- Aynı ödeme kaynağının birden fazla faturaya fazla veya eşzamanlı tahsisi reddedilir; aynı idempotent replay mevcut sonucu döndürür.
- Farklı taraf kapsamındaki, ters yön taşımayan, fazla veya eşzamanlı kümülatif iade reddedilir.
- Vergili alış/satış/iade journal hesap kodu, hesap sınıfı, vergi tutarı ve borç/alacak dengesi doğrulanır.
- Başka faturanın satırına vergi bileşeni bağlanması DB trigger'ı tarafından reddedilir.
- Mock sağlayıcı sözleşme/retry/webhook/idempotency testleri geçer.

Gerçek sağlayıcı sandbox'ı, güncel resmî birim kodları, production credential, gerçek gönderim/alım, mali mühür/e-imza ve dış mutabakat testleri bu paketin kanıtı değildir; `BLOCKED` veya `NOT_RUN` kalır.
