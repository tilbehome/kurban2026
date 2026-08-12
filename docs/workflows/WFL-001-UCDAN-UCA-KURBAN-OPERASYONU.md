---
id: WFL-001
title: Uçtan Uca Kurban Operasyon Haritası
status: PLANNED
owner: Domain-and-Operations
source_role: business_workflow_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-001, REQ-068, PRO-001, PRO-032]
---

# Uçtan uca kurban operasyonu

## Ana zincir

```text
Firma/tenant aktif
→ sezon hazırlığı
→ tedarikçi ve alış faturası
→ hayvan kabulü, küpe, sağlık ve uygunluk
→ yedi hisse envanteri
→ müşteri ve süreli rezervasyon
→ pozitif kaporayla kesin satış ve alacak
→ tahsilat ve vekâlet
→ kesime hazırlık ve sıra
→ kesim
→ parçalama, tartım ve paketleme
→ soğuk oda ve yükleme
→ yerinde/adrese teslim
→ finansal ve operasyonel mutabakat
→ sezon arşivi
```

Zincir doğrusal bir “durum” alanından ibaret değildir. Satış, finans, vekâlet, kesim, paket ve teslim aggregate’leri kendi durum makinelerine sahiptir; aralarındaki önkoşullar açık komut ve olaylarla bağlanır.

## Kontrol noktaları

| Kapı | Zorunlu doğrulama | Başarısızlık davranışı |
|---|---|---|
| Sezonu satışa aç | Firma/tenant aktif, sezon hazırlığı, fiyat/hisse ayarları | Geçiş bloke, hazırlık bulgusu |
| Satışı kesinleştir | Uygun hayvan, boş/rezerve hisse, müşteri, fiyat snapshot ve pozitif kapora | Satış/alacak/tahsilat birlikte atomik rollback |
| Kesimi başlat | Uygun hayvan, tam yedi hisse, gerçek kişilere satılan hisselerde geçerli vekâlet, açık işletme hissesi kararı | İstisna kuyruğu; sahte müşteri/vekâlet veya sessiz override yok |
| Paketi tamamla | Kaynak tartım ve hisse/paket mutabakatı | Paket bloke, sorun kaydı |
| Teslimi kapat | Doğru hisse/paket, tek kullanımlık kanıt, borç politikası | Tekrar/yanlış teslim reddi |
| Sezonu arşivle | Açık borç/kasa/paket/teslim/istisna mutabakatı | Kapanış bloke |

## Sistem genel invariant’ları

- Her komut tenant, sezon, kullanıcı, cihaz ve request bağlamı taşır.
- Kritik yazılar transaction, idempotency, optimistic concurrency, audit ve outbox ile yürür.
- Finansal veya hareket görmüş kayıt fiziksel silinmez.
- Platform kullanıcısı firma operasyon yetkisi değildir.
- Public TV/takip PII ve finans göstermez.
- Offline işlem yalnız beyaz listede ve görünür kuyrukla yürür.

## Gerçek durum özeti

| Katman | Durum |
|---|---|
| Platform Admin ve tenant PostgreSQL/provisioning çekirdeği | `IMPLEMENTED_UNVERIFIED` |
| Tenant domain modelleri ve saf kurallar | `IMPLEMENTED_UNVERIFIED` |
| Legacy müşteri/satış/tahsilat/kesim/teslim ekranları | `IMPLEMENTING`; yeni tenant runtime/ledger’a tam taşınmadı |
| Tedarik faturası, sezon runtime, soğuk oda, yükleme, tam offline sync | `PLANNED` |

## Uçtan uca kabul senaryosu

İki ayrı tenantta iki sezon hazırlanır; her birinde tedarik, hayvan, yedi hisse, satış, karma tahsilat, vekâlet, kesim, tartım, paket, ağ kesintisi, yeniden senkronizasyon, soğuk oda, teslim, kasa ve kapanış yürütülür. Aynı kimlik değerleri bulunsa bile tenant verisi karışmaz; finans ve paket toplamlarında açıklanamayan fark kalmaz. Bu senaryo çalıştırılmadan canlıya hazır denmez.

Detay akışlar bu dizindeki `WFL-003..WFL-009`; domain kuralları [docs/domains](../domains/) altındadır.
