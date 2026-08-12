---
id: DOM-006
title: Hayvan, Sağlık ve Padok Domain Sözleşmesi
status: PLANNED
owner: Domain-and-Livestock
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-001, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014]
---

# Hayvan, sağlık ve padok

## Kimlik ve sınır

Hayvan yalnız büyükbaş kapsamındadır. Küpe kalıcı kimliktir; kurban numarası ve değişebilir operasyon sırası ayrı kavramlardır. Hayvan tedarik, maliyet, tartım, sağlık/uygunluk, yedi hisse, kesim, paket ve teslim ilişkilerinin kök izleme noktasıdır.

## Değişmez kurallar

1. Küpe sezon/firma kapsamında benzersiz olmalı; değişiklik ayrı düzeltme ve audit ister.
2. Her büyükbaş hayvan için `1..7` sıra numaralı tam yedi hisse kaydı bulunur; eksik veya sekiz ve üzeri hisse kartı geçersizdir.
3. Tartım geçmişe eklenir; mevcut değer sessizce ezilmez.
4. Uygun olmayan hayvan satılamaz.
5. Uygunsuzluk satılmış hisseleri otomatik başka hayvana taşımaz.
6. Kurban numarası kimliği, operasyon sırası planlamayı temsil eder; sıra değişikliği geçmiş üretir.
7. Hayvan ancak yedi hissenin teslim durumu tamamlandığında kapanabilir.
8. Satılmamış hisse işletme envanteridir; bu durum müşteri, satış, gelir, alacak veya vekâlet kaydı üretmez.

## Önerilen durumlar

```text
DRAFT → ACCEPTED → OBSERVATION | ELIGIBLE → ON_SALE → SOLD_OUT
→ SLAUGHTER_READY → SLAUGHTERED → PROCESSING → DELIVERED → ARCHIVED
```

`INELIGIBLE`, `QUARANTINED`, `CANCELLED` ve `EXCEPTION` normal çizginin açık istisna durumlarıdır. Nihai state machine henüz runtime’a bağlanmadığı için bu adlar `PLANNED` kabul edilir.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| `Animal`, küpe, sabit hassasiyetli kilo ve satın alma tutarı | `IMPLEMENTED_UNVERIFIED` | Tenant core tipi ve PostgreSQL tenant şeması. |
| Sezon+küpede unique kısıt | `IMPLEMENTED_UNVERIFIED` | `@@unique([seasonId, earTag])`. |
| Legacy hayvan detay ve yedi hisse görünümü | `IMPLEMENTING` | `app/hayvanlar/[id]/page.tsx`; legacy SQLite modeline bağlı. |
| Sağlık, uygunluk, padok ve tartım geçmişi | `PLANNED` | Ayrı aggregate/model ve bağlı UI yok. |
| Hayvan 360 tam çalışma alanı | `PLANNED` | Mevcut detay sayfası tedarik/sağlık/timeline/kârlılık sözleşmesini karşılamıyor. |

## Komut ve olaylar

- Komutlar: `RegisterAnimal`, `AcceptAnimal`, `RecordAnimalWeight`, `RecordHealthEvent`, `ChangeEligibility`, `MovePaddock`, `AssignQurbanNumber`, `ChangeOperationQueue`.
- Olaylar: `animal.registered`, `animal.accepted`, `animal.weight_recorded`, `animal.eligibility_changed`, `animal.location_changed`, `animal.queue_changed`.

## Kabul ölçütleri

- Aynı sezon ve küpede ikinci hayvan DB/domain düzeyinde reddedilir.
- Uygunsuz hayvanda yeni satış engellenir, mevcut satışlar istisna kuyruğuna düşer.
- Sıra değişince kurban kimliği sabit kalır ve önce/sonra değer auditlenir.
- Tartım düzeltmesi eski kaydı korur.
- Hayvan 360, başka menüye gitmeden yedi hissenin satış/ödeme/vekâlet/paket/teslim özetini gösterir.

Sayfa sözleşmesi [Hayvan 360](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) içindedir.
