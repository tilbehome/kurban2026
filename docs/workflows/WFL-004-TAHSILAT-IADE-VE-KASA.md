---
id: WFL-004
title: Tahsilat, İade ve Kasa Akışı
status: PLANNED
owner: Domain-and-Finance
source_role: business_workflow_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-039, REQ-040]
---

# Tahsilat, iade ve kasa

## Tahsilat

1. Kasa oturumu açık ve kullanıcı yetkilidir.
2. Müşteri, hisse, makbuz veya telefonla açık borç bulunur.
3. Ödeyen kişi ve yöntem parçaları girilir.
4. Kullanıcı dağıtım hedeflerini eşit, öncelikli veya manuel belirler.
5. Server yöntem ve dağıtım toplamlarını, sezonu, borçları ve idempotency anahtarını doğrular.
6. Receipt, method split, allocation, ledger, kasa/banka-POS etkisi ve audit tek transaction’da yazılır.
7. Makbuz numarası oluşur; yeniden baskı ayrı neden/audit ister.

## İade ve düzeltme

Yanlış tahsilat silinmez. Orijinal kayda bağlı reversal oluşturulur; nakit/banka/POS etkisi terslenir. Müşteriye para çıkışı varsa `Refund`, başka borca aktarım varsa `Adjustment/Allocation` kullanılır. Kapalı döneme geçmiş tarihli sessiz değişiklik yapılmaz.

## Kasa açılış ve kapanış

```text
Açılış bakiyesi → vardiya hareketleri → fiziksel sayım
→ beklenen/sayılan karşılaştırma → fark açıklaması/onayı → kapanış/devir
```

Fark sıfırlanmak için uydurma hareket yazılmaz. Kapanışın iptali veya geri açılması yeniden doğrulama/ikinci yetkili gerektirir.

## Banka/POS mutabakatı

İç ledger yöntem hareketleri sağlayıcı settlement kayıtlarıyla eşleştirilir. Eşleşmeyen, geciken, komisyon veya ters ibraz kayıtları açık istisna olarak kalır. Sağlayıcı entegrasyonu yoksa manuel belge/raporla aynı kontrol uygulanır.

## Uygulama durumu

- Decimal dağıtım/reversal sözleşmeleri ve PostgreSQL ledger modeli: `IMPLEMENTED_UNVERIFIED`.
- Legacy karma ödeme/idempotency/kasa hareketi: `IMPLEMENTING`; `Float` ve legacy SQLite kullanır.
- Kasa oturumu, banka/POS settlement, tam çift taraflı posting: `PLANNED`.

## Kabul kanıtı

- Yöntem parçaları, tahsilat ve allocation toplam eşitliği.
- Aynı idempotency anahtarında tek receipt.
- Reversal sonrası cari ve yöntem hesaplarının sıfır farkı.
- Kasa farkı ve ikinci onay E2E’si.
- POS vade farkının yalnız POS parçasına uygulanması.
- Sezon ve tenant izolasyonu.

Domain sözleşmesi [DOM-008](../domains/DOM-008-TAHSILAT-KASA-VE-MUTABAKAT.md) içindedir.
