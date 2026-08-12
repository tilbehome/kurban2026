---
id: WFL-003
title: Satış, Kapora, İptal ve Transfer Akışı
status: REVIEW
owner: Domain-and-Sales
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023]
---

# Satış, kapora, iptal ve transfer

## Normal akış

1. Yetkili kullanıcı müşteri veya telefonu arar; kartı seçer ya da mükerrer uyarısını görerek ayrı kişi oluşturur.
2. Satılabilir hayvan ve boş hisse seçilir.
3. Liste fiyatı, indirim, net anlaşma bedeli, vaat kilo sınıfı ve teslim tercihi snapshot olarak önizlenir.
4. Varsa kapora ve ödeme yöntem parçaları girilir.
5. Kullanıcı tek kesinleştirme komutu verir.
6. Server tenant/sezon/yetki, hisse version/müsaitlik ve idempotency anahtarını doğrular.
7. Satış, hisse sahipliği, alacak, varsa tahsilat/dağıtım, audit ve outbox aynı transaction’da commit edilir.
8. Sözleşme/makbuz üretimi transaction sonrası idempotent olayla yürür.

## İptal akışı

- Ödemesiz satış: yetkili iptal komutu, satış reversal ve hisse açma birlikte yürür.
- Ödemeli satış: iade veya mahsup hedefi ve gerekli onay belirlenmeden hisse açılmaz.
- Kapora son tarihi: worker doğrudan silmez; iptal adayı üretir ve firma politikasını uygular.
- Her iptal önce/sonra durum, gerekçe, actor ve finansal bağlantı üretir.

## Transfer akışı

1. Kaynak satış/hisse, eski ve yeni müşteri doğrulanır.
2. Borç, tahsilat, vekâlet, belge ve teslim durumu önizlenir.
3. Fiyat farkı/mahsup kararı kullanıcıya açıkça gösterilir.
4. Yetkili onayla `ShareTransfer` ve gerekli ledger/vekalet etkileri atomik yazılır.
5. Eski sahiplik ve fiyat snapshot’ı değişmeden korunur.

## Çatışmalar

| Durum | Sonuç |
|---|---|
| İki kullanıcı aynı hisseyi satıyor | İlk geçerli commit kazanır; diğeri güvenli müsaitlik hatası alır. |
| Aynı istek tekrar geliyor | Önceki sonuç replay edilir; yeni satış/tahsilat yok. |
| İptal sırasında yeni ödeme geliyor | Version/transaction çatışması; iki işlemden biri yeniden değerlendirilir. |
| Transfer hedefi mevcut sahip | Reddedilir. |
| Teslim edilmiş hisse transferi | Normal akışta reddedilir; açık istisna/geri alma gerekir. |

## Uygulama durumu

Yeni tenant core’da satış/snapshot/reversal sözleşmeleri `IMPLEMENTED_PENDING_VERIFICATION`; legacy saha satış/atama `IMPLEMENTING`; kalıcı transfer aggregate’i, otomatik süre sonu ve tam iptal–iade orkestrasyonu `PLANNED` durumundadır.

## Kabul kanıtı

- PostgreSQL concurrency testi.
- İdempotency replay testi.
- Satış + kapora rollback testi.
- Ödemeli/ödemesiz iptal mutabakat testi.
- Transfer önce/sonra audit ve fiyat geçmişi testi.
- Masaüstü ve telefon görev E2E’si.

Domain kaynağı [DOM-007](../domains/DOM-007-HISSE-SATIS-TRANSFER-VE-IPTAL.md) olarak hazırlanmıştır.
