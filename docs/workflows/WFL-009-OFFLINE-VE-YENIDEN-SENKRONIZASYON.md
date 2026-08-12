---
id: WFL-009
title: Offline ve Yeniden Senkronizasyon Akışı
status: REVIEW
owner: UX-and-Operations
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-044, REQ-045, PRO-033, PRO-034, PRO-035]
---

# Offline ve yeniden senkronizasyon

## İşlem sınıfları

- `ONLINE_REQUIRED`: satış kesinleştirme, finansal posting, kesim/tartımın kesin kabulü, teslim kapanışı ve kritik override.
- `QUEUE_ALLOWED`: önceden yetkilendirilmiş düşük riskli tarama, saha notu, sorun bildirimi ve görev kanıtı; kesin liste kodlanmadan varsayılmaz.
- `READ_CACHE`: imzalı görev, sıra ve referans görünümü.
- `NEVER_CACHE_SENSITIVE`: secret, tam finans dökümü, hassas belge ve gereksiz PII.

## Kuyruğa alma

1. Cihaz enrollment, kullanıcı/tenant/sezon ve offline yetki süresi doğrulanır.
2. Komutun beyaz listede olduğu kontrol edilir.
3. Client işlem ID ve idempotency anahtarı üretilir.
4. Minimum, secret-safe payload; actor, cihaz, tenant, sezon, local zaman, TTL ve beklenen nesne version ile saklanır.
5. Kullanıcıya `Kuyrukta` durumu açıkça gösterilir; işlem tamamlandı denmez.

## Yeniden senkronizasyon

```text
QUEUED → SYNCING → SYNCED
                 → CONFLICT
                 → FAILED / EXPIRED
```

Foreground retry esastır; desteklenen Background Sync yardımcıdır. Sunucu tenant/session/device yetkisini, TTL’yi, idempotency’yi ve expected version’ı yeniden doğrular. Başarı kalıcı server kimliğiyle yerel kaydı uzlaştırır.

## Çatışma

- Finans, satış, vekâlet, sıra, tartım, paket ve teslim için sessiz last-write-wins yasaktır.
- Kullanıcıya yerel istek, sunucu durumu, etki ve izinli seçenekler gösterilir.
- `Yeniden uygula`, `iptal et`, `yeni kayda dönüştür` veya `yetkili inceleme` seçenekleri domain politikasına bağlıdır.
- Çatışma çözümü yeni audit olayıdır; ilk komut silinmez.

## Uygulama durumu

`OfflineQueueItem`, unique idempotency ve secret-safe payload guard `IMPLEMENTED_PENDING_VERIFICATION`; legacy PWA’da service worker/update/push parçaları vardır. Güvenli local store, beyaz liste, sync worker, conflict UI ve uzlaştırma raporu `PLANNED` durumundadır.

## Kabul kanıtı

- Ağın komut öncesi, sırası ve response sonrası kesilmesi.
- Aynı kuyruğun tekrar gönderiminde tek server yan etkisi.
- Yetkisi iptal edilmiş cihazın sync reddi.
- TTL ve nesne version çatışması.
- Secret/PII payload negatif testi.
- Tenant A kuyruğunun Tenant B hostunda uygulanamaması.
- Kullanıcıya görünür kuyruk/başarısız/çatışma durumları.

UX ayrıntısı [UX-008](../ux/UX-008-PWA-OFFLINE-KUYRUK-VE-CATISMA.md) içindedir.
