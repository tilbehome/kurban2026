---
id: WFL-008
title: İstisna ve Düzeltme Akışları
status: IMPLEMENTED_UNVERIFIED
owner: Domain-and-Operations
source_role: business_workflow_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
related_requirements: [REQ-021, REQ-022, REQ-028, REQ-033, REQ-034, REQ-035, REQ-039, REQ-042, PRO-001, PRO-002, PRO-032]
---

# İstisna ve düzeltme

## İlke

İstisna, temel kuralın sessizce atlanması değildir. Her istisna tür, önem, etkilenen kayıt, talep eden, karar veren, gerekçe, kanıt, süre ve audit bağı taşır. Düzeltme, geçmişi silmeden ters kayıt veya açık yeni olayla yapılır.

## Ortak akış

```text
Bulgu/engel → istisna kaydı → sorumlu atama → etki önizleme
→ gerekiyorsa yeniden doğrulama/ikinci onay
→ uygula veya reddet → mutabakat → kapat/yeniden aç
```

## Kritik katalog

| İstisna | Düzeltme biçimi |
|---|---|
| Ödemeli satış iptali | Satış + ledger reversal, iade/mahsup, hisse açma |
| Yanlış tahsilat | Receipt reversal; yöntem ve cari ters etkisi |
| Hisse transferi | Kalıcı transfer kaydı, fiyat/borç/vekâlet etkisi |
| Eksik vekâlet | Kesim blokajı; belge tamamla veya açık yetkili karar |
| Acil sıra değişimi | Kurban no sabit, operasyon sıra geçmişi |
| Tartım/paket hatası | Yeni düzeltme kaydı, eski ölçüm/etiket iptali |
| Borçlu teslim | Politika, gerekçe ve yetkili override |
| Teslim geri alma | `DeliveryRecord` reversal ve paket konum kontrolü |
| Kasa farkı | Sayım/fark kaydı, açıklama ve ikinci onay |

## Yetki

İşlemi yapan kişi mümkün olduğunda kendi kritik istisnasını tek başına onaylayamaz. Permission yanında tenant, sezon, kayıt durumu, cihaz ve son yeniden doğrulama zamanı kontrol edilir.

## Uygulama durumu

Satış/ledger/teslim reversal, kalıcı `OperationException`, paket istisna geçmişi, kilo düzeltme approval kaydı ve yönetim istisna kutusu `IMPLEMENTED_UNVERIFIED` durumundadır. Bütün legacy route'ların dönüşümü ve Faz 12 negatif/E2E kabulü tamamlanmamıştır.

## Kabul kanıtı

- Önce/sonra değer ve audit zinciri.
- İkinci onay separation-of-duties testi.
- Düzeltme sonrası finans/operasyon mutabakatı.
- Yetkisiz ve süresi geçmiş onay reddi.
- Aynı düzeltme komutunun idempotent tekrarı.
