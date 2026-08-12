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

## Rezervasyon akışı

1. Yetkili kullanıcı müşteri veya telefonu arar; kartı seçer ya da mükerrer uyarısını görerek ayrı kişi oluşturur.
2. Satılabilir hayvan ve boş hisse seçilir.
3. Liste fiyatı, indirim, net anlaşma bedeli, vaat kilo sınıfı ve teslim tercihi snapshot olarak önizlenir.
4. Kapora henüz alınmayacaksa süreli rezervasyon oluşturulur.
5. Server tenant/sezon/yetki, hisse version/müsaitlik, süre ve idempotency anahtarını doğrular.
6. Rezervasyon yalnız hisse tutma ve audit etkisi üretir; satış, gelir, alacak, tahsilat, makbuz veya vekâlet üretmez.

## Kesin satış akışı

1. Boş veya müşteriye ait geçerli rezervasyon yeniden doğrulanır ve kilitlenir.
2. Herhangi bir pozitif kapora tutarı ile ödeme yöntem parçaları girilir; sıfır tutar kesinleştirmeyi geçemez.
3. Kullanıcı satış etkisini önizleyip tek kesinleştirme komutu verir.
4. Satış, gerçek müşteri sahipliği, alacak, kapora tahsilatı/dağıtımı, audit ve outbox aynı transaction’da commit edilir.
5. Sözleşme/makbuz üretimi transaction sonrası idempotent olayla yürür.

## İptal akışı

- Kaporasız rezervasyon: süre sonu/iptal olayıyla işletme envanterine açılır; ortada satış/alacak olmadığı için finansal reversal üretmez.
- Ödemeli satış: iade veya mahsup hedefi ve gerekli onay belirlenmeden hisse açılmaz.
- Kapora son tarihi: worker rezervasyonu doğrudan silmez; süre sonu olayı/audit üretir ve hisseyi işletme envanterine açar.
- Her iptal önce/sonra durum, gerekçe, actor ve finansal bağlantı üretir.

## İşletmeye kalan satılmamış hisse

- Tam yedi hisseden satılmayanlar işletme envanteri/sahipliği olarak görünür.
- Bu kayıt için sahte müşteri, satış, gelir, alacak veya vekâlet oluşturulmaz.
- Daha sonra gerçek kişiye satış yapılırsa müşteri, pozitif kapora, kesin satış/alacak ve vekâlet normal akıştan oluşturulur.
- Satılmamış hissenin kesim öncesi dinî uygunluk çözümü kaynaklarda çelişkilidir; açık karar verilene kadar sistem hazırlık engeli gösterir, kendiliğinden kişi/vekâlet uydurmaz.

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

## Kaynak ve uygulama durumu

Bağlayıcı ana mimari §6.3 tam yedi hisseyi ve pozitif tutarın kapora sayılmasını; yeni nesil yol haritası YN-13/YN-14 rezervasyon–satış ayrımını ve işletmeye kalan açık sahipliği tanımlar. 2026-08-12 tarihli kullanıcı düzeltmesi kaporasız işlemin kesin satış/alacak olmamasını bağlayıcı kılar. Ana mimarideki ödemesiz satış/alacak ve kesim öncesi gerçek kişi atama ifadeleriyle oluşan fark açık mimari karar gerektirir.

Yeni tenant core `confirmSale` komutu kapora almadan satış/ledger üretir; legacy saha satış da sıfır kaporayla müşteri atayıp borç açabilir. Bu davranışlar hedef kuralla uyumlu tamamlanmış sayılmaz ve `IMPLEMENTING` karar/kod farkıdır. Kalıcı rezervasyon süresi, işletme envanteri sahipliği, transfer aggregate’i, otomatik süre sonu ve tam iptal–iade orkestrasyonu `PLANNED` durumundadır.

## Kabul kanıtı

- PostgreSQL concurrency testi.
- İdempotency replay testi.
- Rezervasyonun satış/alacak/gelir/vekâlet üretmediği test.
- Pozitif kapora + satış + alacak rollback testi; sıfır kaporada kesin satış reddi.
- Ödemeli satış iptali ve kaporasız rezervasyon süre sonu mutabakat testi.
- İşletme envanterinin sahte müşteri/finans/vekâlet üretmediği test.
- Transfer önce/sonra audit ve fiyat geçmişi testi.
- Masaüstü ve telefon görev E2E’si.

Domain kaynağı [DOM-007](../domains/DOM-007-HISSE-SATIS-TRANSFER-VE-IPTAL.md) olarak hazırlanmıştır.
