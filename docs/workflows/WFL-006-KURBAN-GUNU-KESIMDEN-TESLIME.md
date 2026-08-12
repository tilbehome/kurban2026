---
id: WFL-006
title: Kurban Günü Kesimden Teslime Akış
status: PLANNED
owner: Domain-and-Operations
source_role: business_workflow_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-035, REQ-036, REQ-037, REQ-038, REQ-041, REQ-042, REQ-043, PRO-001, PRO-006, PRO-034, PRO-035]
---

# Kurban Günü: kesimden teslime

## İstasyon zinciri

```text
Hazırlık/sıra
→ kesim
→ parçalama
→ tartım
→ paketleme/etiket
→ soğuk oda
→ toplama/yükleme
→ yerinde veya adrese teslim
→ kapanış/mutabakat
```

Her istasyonda tek aktif iş, büyük hayvan/hisse kimliği, `Tamamla`, `Beklet`, `Sorun Bildir`, önceki/sıradaki iş ve bağlantı/sync durumu bulunur.

## Aşama sorumlulukları

| İstasyon | Girdi | Başarı çıktısı | Kritik engel |
|---|---|---|---|
| Hazırlık | Sıra, hayvan, tam yedi hisse kaydı | `READY` | Uygunsuz hayvan, eksik vekâlet veya açık işletme hissesi kararı |
| Kesim | Doğrulanmış hayvan | Zaman/ekipli kesim olayı | Yanlış hayvan/çift başlatma |
| Parçalama | Karkas kimliği | Yedi hisseye izlenebilir dağıtım | Kaynak kimlik kaybı |
| Tartım | Parça/hisse | Sabit hassasiyetli kayıt | Tekrar/manuel giriş gerekçesi |
| Paket | Hisse ve ağırlık | Unique etiketli paket | Yanlış hisse/etiket |
| Soğuk oda | Paket | Raf/konum olayı | Çift/yanlış konum |
| Yükleme | Rota/araç | Taramalı checklist | Eksik/fazla/yanlış araç |
| Teslim | Paketler, kişi, token | Tek teslim kanıtı | İkinci teslim/eksik paket |

## Sorun masası

İstasyon sorunu işi sessizce atlatmaz. Kategori, önem, kanıt, sorumlu, açılma/kapanma, çözüm ve override gerekçesi istisna kuyruğunda tutulur. Vardiya devrinde açık sorunlar yeni sorumluya görünür geçer.

## Acil modlar

- Normal: tüm komutlar server doğrulamasında.
- Kısıtlı: riskli modüller kapalı; izinli görevler sürer.
- Offline kuyruk: yalnız beyaz listedeki düşük riskli komutlar.
- Salt okunur: görev/listeler/çıktı görünür; yeni riskli yazı yok.
- Kağıt/acil numara: incident altında kontrollü, sonradan mutabakatlı fallback.

## Uygulama durumu

Kesim/tartım/paket/teslim saf sözleşme ve modelleri `IMPLEMENTED_UNVERIFIED`; legacy TV, tartım ve teslim ekranları `IMPLEMENTING`; parçalama, soğuk oda, yükleme, cihaz adapterleri ve gerçek offline sync `PLANNED` durumundadır.

## Kabul kanıtı

- Yanlış hayvan/hisse taraması ve çift işlem negatif testleri.
- Yedi hisse kaynak/paket mutabakatı.
- Offline/online geçiş ve idempotency senaryosu.
- Firma ve tesis için onaylanan eşzamanlı kullanıcı/cihaz kapasitesinde ölçülmüş yük ve tam operasyon provası; kapasite girdisi onaylanmadan sayısal hedef verilmez.
- Telefon, tablet, masaüstü kontrol merkezi ve PII’siz TV kabulü.
- Teslim tekrar kullanımı ve hayvan kapanış engeli.

Domain ayrıntıları [DOM-010](../domains/DOM-010-KESIM-VE-KONTROL-MERKEZI.md), [DOM-011](../domains/DOM-011-PARCALAMA-TARTIM-VE-PAKETLEME.md) ve [DOM-012](../domains/DOM-012-SOGUK-ODA-YUKLEME-VE-TESLIMAT.md) içindedir.
