---
id: DOM-011
title: Parçalama, Tartım ve Paketleme Domain Sözleşmesi
status: PLANNED
owner: Domain-and-Fulfillment
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-013, REQ-037, REQ-038, REQ-039, REQ-040, PRO-035]
---

# Parçalama, tartım ve paketleme

## İzlenebilirlik sınırı

Kaynak hayvan/karkastan hisse paketine kadar her tartım ve paket kimliği korunur. Parçalama, yedi hisseye miktar ve değer bakımından izlenebilir/adil dağıtım üretir; paket etiketi hisse kimliğini kaybetmez.

## Değişmez kurallar

- Tartım sabit hassasiyetli kilogram tipidir.
- Manuel giriş cihaz okumasından ayrılır; kullanıcı ve gerekçe kaydedilir.
- Tartım düzeltmesi eski değeri yok etmez.
- Her paket tek hisseye, her hisse paketleri tek dış teslim grubuna bağlanır.
- Etiket numarası benzersizdir; yeniden baskı neden ve sürüm üretir.
- Vaat üstü gerçek kilo ek borç doğurmaz.
- Vaat altı düzeltme bağlayıcı formülle hesaplanır: `net anlaşma bedeli ÷ vaat alt sınırı × eksik kg`.
- Finansal düzeltme yetkili ledger adjustment/reversal üzerinden oluşur.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| `WeighingRecord`, `PackageRecord`, kilo tipi ve unique etiket | `IMPLEMENTED_UNVERIFIED` | Tenant core `operation-flow.ts` ve PostgreSQL şeması. |
| Kilo farkı ledger adjustment sözleşmesi | `IMPLEMENTED_UNVERIFIED` | `createWeightDifferenceLedgerEntry`; tam formül/orchestrasyon yok. |
| Legacy tartım ve paket API’leri | `IMPLEMENTING` | `/api/kesim/tartim-kaydet`, `/api/hisseler/[id]/paket`; toplamı eşit bölüyor, legacy `Float` kullanıyor. |
| Parça türü/değer dengesi ve çoklu alt paket | `PLANNED` | Ayrı model/runtime yok; `/kesim/parcalama` ve `/kesim/paketleme` placeholder. |
| Terazi/etiket yazıcı gerçek adapteri | `PLANNED` | `DeviceAdapterContract` var; fiziksel cihaz kabulü yok. |

## İstasyon akışı

1. Hayvan/karkas QR veya küpeyle doğrulanır.
2. Kaynak tartım alınır; cihaz ve kalibrasyon kimliği kaydedilir.
3. Parça/sakatat grupları yedi hisseye dağıtılır.
4. Hisse/alt paket tartımları ve farklar hesaplanır.
5. Paket/etiket oluşturulur; yeniden baskı izlenir.
6. Kaynak toplamı ile paket toplamı mutabakatı geçerse soğuk oda/teslim aşamasına alınır.

## İstisnalar

- Yanlış hisse/etiket taraması bloke edilir.
- Tartım tekrarında optimistic concurrency ve düzeltme nedeni gerekir.
- Eksik/fazla/karışmış paket açık incident üretir.
- Cihaz çevrimdışıyken kritik kesin tartımın kabul edilip edilmeyeceği beyaz liste/politika ile belirlenir; varsayılan sessiz başarı yoktur.

## Kabul ölçütleri

- Yedi hisse paket toplamı kaynak tartımla tanımlı tolerans içinde mutabıktır; tolerans değeri tahmin edilmez, firma politikası olarak kararlaştırılır.
- Yanlış hisse etiketi basılamaz.
- Aynı label numarası ikinci pakete atanamaz.
- Üst kilo ek borç oluşturmaz; alt kilo düzeltmesi izlenebilir ledger kaydı üretir.
- Klavye, dokunma ve barkod okuyucu ile aynı görev tamamlanabilir.

Kurban Günü akışı [WFL-006](../workflows/WFL-006-KURBAN-GUNU-KESIMDEN-TESLIME.md) ile birlikte uygulanır.
