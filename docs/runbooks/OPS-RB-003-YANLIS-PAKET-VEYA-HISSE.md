# Yanlış Paket veya Hisse Runbook’u

```yaml
id: OPS-RB-003
title: Yanlış Paket veya Hisse Runbook'u
status: REVIEW
owner: Tenant-Operations
reviewers: [Domain, Finance, Support, Security]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: ILK_PAKET_TESLIM_PROVASINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-035, REQ-043, REQ-068, PRO-002, PRO-032]
related_adrs: []
related_modules: [share-sales, packaging, delivery, finance-ledger]
related_tests: [TST-006, TST-014]
supersedes: []
superseded_by: null
```

## Tetikleyici

Etiket/QR/hisse/paket/hayvan/müşteri eşleşmiyor; paket kayıp/fazla; yanlış teslim şüphesi veya çift teslim denemesi var.

## Containment

1. İlgili paket, hisse ve kaynak hayvanı `BLOKE/INCELEME` durumuna al; yeni teslim/yükleme/yeniden etiketlemeyi durdur.
2. Aynı hayvana ait yedi hisse ve aynı parti/raf/araçtaki komşu paketleri karantinaya al.
3. Fiziksel paketleri ayır; eski etiketleri sökme/yok etme, okunur şekilde iptal/kanıt olarak koru.
4. Incident kaydına yalnız kimlikler, zaman, istasyon, aktör ve request/audit/scan ID ekle; müşteri PII’sini genel kanala koyma.

## İnceleme

- Hayvan → hisse → tartım → package item → dış paket → soğuk oda → araç → teslim scan zincirini çıkar.
- Etiket baskı/tekrar baskı nedeni ve iptal geçmişini kontrol et.
- Fiziksel ağırlık/adet ile sistem snapshot’ını çift kişi sayımıyla karşılaştır.
- Teslim kapandıysa teslim kanıtı ve müşteriye etkisini Privacy/Support ile değerlendir.
- Kasa/ledger etkisi varsa ayrı finans düzeltme kaydı aç.

## Düzeltme

Fiziksel silme veya geçmişi yeniden yazma yoktur. Yetkili istisna komutuyla yanlış bağı iptal et, doğru bağı yeni olay olarak kur, eski QR/etiketi geçersiz kıl, yeni sürümü gerekçeli üret ve audit/outbox oluştur. Teslim geri alma veya müşteri değişimi ikinci onay ister.

## Kapanış kapısı

- Yedi hisse ve tüm package item’lar tek doğru sahiple mutabık.
- Kayıp/fazla ağırlık/adet açıklanmış ve yetkili onaylı.
- Etkilenen teslim/finans/iletişim işlemleri düzeltilmiş.
- Eski token/etiket tekrar kullanılamıyor.
- Benzer paketler için örnekleme ve kök neden/önleyici aksiyon tamamlanmış.
