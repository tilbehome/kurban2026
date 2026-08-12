# Ledger ve Veri Bütünlüğü Test Planı

```yaml
id: TST-006
title: Ledger ve Veri Bütünlüğü Test Planı
status: REVIEW
owner: QA
reviewers: [Finance, Domain, Data, Security]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_FINANS_VE_DURUM_MAKINESI_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-001, REQ-040, REQ-068, PRO-002, PRO-032]
related_adrs: []
related_modules: [tenant-core, finance-ledger, share-sales, slaughter-packaging-delivery]
related_tests: [TST-003, TST-006]
supersedes: []
superseded_by: null
```

## Durum

Hedef tenant şemasında Decimal/Numeric ve ledger sözleşmeleri vardır; legacy uygulamanın finans akışlarının yeni tenant DB/ledger’a tam taşındığı kanıtlanmamıştır. Bu plan gelecekteki kabul kapısıdır; bugün ledger mutabakatının geçtiği iddiasını taşımaz.

## Finans invariant’ları

- Her journal entry için toplam borç = toplam alacak; sıfır tutarlı veya dengesiz fiş kaydedilmez.
- Para binary `Float` ile kalıcılaştırılmaz; ölçek/yuvarlama politika testine bağlıdır.
- Satış liste fiyatı, indirim ve net anlaşma bedelini ayrı snapshot eder.
- Karma tahsilat parçalarının toplamı tahsilat toplamına eşittir.
- Allocation toplamı tahsilat/mahsup edilebilir tutarı aşmaz; payer ve beneficiary ayrıdır.
- İptal/iade/düzeltme fiziksel silme değil bağlantılı ters kayıt üretir.
- Kasa, banka/POS, müşteri carisi ve rapor aynı ledger kaynağından sıfır açıklanamayan fark verir.
- Kapalı sezona/döneme doğrudan posting yapılmaz.

## Operasyon invariant’ları

- Hayvan başına en fazla ve tamamlanma için tam yedi hisse.
- Bir hisse aynı anda yalnız bir aktif satışa bağlıdır.
- Küpe benzersiz kimliktir; kurban no ile operasyon sırası ayrı ve geçmişlidir.
- Geçerli yedi vekâlet olmadan kesim başlatılmaz.
- Paket, hisse ve kaynak hayvan bağı kaybolmaz.
- Bütün paketler doğrulanmadan hisse teslimi; yedi hisse teslim edilmeden hayvan kapanışı tamamlanmaz.
- İdempotency anahtarı aynı komutu ikinci kez uygulamaz; farklı payload aynı anahtarla reddedilir.

## Senaryo kümeleri

| Küme | Örnekler |
|---|---|
| Unit/property | Kuruş hassasiyeti, dağıtım, rounding, yedi hisse, geçiş tablosu |
| PostgreSQL constraint | Unique, FK, check, version ve kapalı dönem |
| Transaction | Satış + alacak + tahsilat + audit + outbox hata enjeksiyonu |
| Concurrency | Aynı hisse satışı, aynı idempotency, aynı delivery token, kasa kapanışı |
| Reverse | Tam/kısmi iade, iptal, transfer, kg eksiği, POS vade farkı |
| Reconciliation | Ledger ↔ cari ↔ kasa ↔ banka/POS ↔ rapor |
| Lifecycle | Sezon kilidi, paket/teslim kapanışı, pasif kayıt yeniden aktifleştirme |

## Hata enjeksiyonu

Her kritik transaction’da iş kaydı, ledger, audit ve outbox adımları arasında kontrollü hata oluşturulur. Beklenen sonuç: hiçbir yarım kayıt kalmaması veya retry için açık ve tekil bir durum bulunmasıdır. Ağ timeout sonrası aynı idempotency anahtarıyla retry ikinci finans/teslim olayı üretmez.

## Mutabakat çıktısı

Kanıt, sentetik veri profili ve sorgu/komut sürümünü belirtir; en az şu farkları verir:

- journal borç/alacak farkı,
- tahsilat/parça/allocation farkı,
- müşteri cari/ledger farkı,
- kasa beklenen/sayılan farkı,
- satış/hisse aktif sahiplik farkı,
- tartım/paket/teslim miktar ve durum farkı.

Fark `0` değilse otomatik başarı verilmez; iş kuralı gereği kabul edilen fark ayrı kod, sahip ve onayla açıklanır. Sonuç [EVD-004](../evidence/EVD-004-FINANS-MUTABAKAT-SABLONU.md) ile kaydedilir.
