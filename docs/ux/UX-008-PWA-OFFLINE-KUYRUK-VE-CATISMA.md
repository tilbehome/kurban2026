---
id: UX-008
title: PWA, Offline Kuyruk ve Çatışma UX Standardı
status: IMPLEMENTED_UNVERIFIED
owner: UX-and-Frontend
source_role: ux_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
related_requirements: [REQ-044, REQ-045, PRO-033, PRO-034, PRO-035]
---

# PWA, offline kuyruk ve çatışma

## PWA sınırı

Saha yüzeyi aynı tenant origin altında `/saha` olarak bağlıdır. Service worker scope ve gerçek HTTPS/update davranışı Faz 12'de doğrulanmadığı için yüzey `IMPLEMENTED_UNVERIFIED`, gerçek PWA kabulü `NOT_RUN` kabul edilir.

## Kullanıcıya gösterilen bağlantı durumları

- `Çevrimiçi`: server doğrulaması yapılabilir.
- `Zayıf bağlantı`: istek sürüyor; tekrar güvenliğini sistem yönetir.
- `Çevrimdışı`: yalnız izinli görevler kuyruğa alınabilir.
- `Kuyrukta`: cihazda saklandı, server’da tamamlanmadı.
- `Senkronize edildi`: server kimliği ve zamanı alındı.
- `Çatışma`: kullanıcı/yetkili kararı gerekir.
- `Başarısız/Süresi doldu`: tekrar veya iptal eylemi açıktır.

“Kaydedildi” ifadesi yalnız server commit sonrasında kullanılır.

## Cache politikası

| Veri | Politika |
|---|---|
| Shell ve locale assetleri | Sürümlü cache; güvenli update bildirimi |
| Atanmış görev/sıra/referans | `READ_CACHE`, tenant/user/device kapsamlı ve son güncelleme görünür |
| Düşük riskli tarama/not | `QUEUE_ALLOWED`, beyaz liste ve TTL ile |
| Satış, tahsilat, kesin kesim/tartım, teslim | `ONLINE_REQUIRED` |
| Secret, tam finans, hassas belge | `NEVER_CACHE_SENSITIVE` |

## Kuyruk kartı

Her öğe kullanıcıya görev adı, yerel zaman, hedef kayıt etiketi, durum, retry sayısı, son hata kodu ve izinli eylemleri gösterir. Raw payload, token veya teknik secret gösterilmez. Toplu “hepsini zorla gönder” finans/kritik komutlarda bulunmaz.

## Çatışma çözüm paneli

Panel yerel niyet ile güncel server durumunu yan yana, PII maskeli gösterir. Alan bazlı son-yazan-kazan varsayılan değildir. Domain’in izin verdiği `serverı koru`, `yeniden uygula`, `yeni görev oluştur`, `yetkili incelemeye gönder` seçenekleri sunulur. Karar auditlenir.

## Cihaz ve güvenlik

- Kuyruk tenant, sezon, kullanıcı ve enrolled cihazla bağlanır.
- Offline yetki süreli ve uzaktan iptal edilebilirdir.
- Local store minimum veri, güvenli serialization ve storage quota davranışı taşır.
- Logout, tenant değişimi veya cihaz iptalinde hassas cache erişilemez; bekleyen işler raporlanmadan sessiz silinmez.
- Client saatine güvenilmez; server sırası ve zamanı mutabakat kaynağıdır.

## Güncelleme

Aktif görev veya bekleyen kuyruk varken service worker zorla yenilenmez. Yeni sürüm hazır bildirimi; bekleyen iş sayısı, uyumluluk ve güvenli yeniden başlatma seçeneği gösterir. Şema uyumsuz kuyruğun migration/uzlaştırma planı olmadan update uygulanmaz.

## Gerçek uygulama durumu

- PWA manifest/service worker güncelleme ve push parçaları: `IMPLEMENTED_UNVERIFIED`; gerçek update kabulü `NOT_RUN`.
- Tenant `OfflineQueueItem`, unique idempotency, secret guard, session/device bağı ve görünür queue state: `IMPLEMENTED_UNVERIFIED`.
- IndexedDB local store, beyaz liste, sync engine, retry/backoff/poison/conflict sözleşmesi: `IMPLEMENTED_UNVERIFIED`; gerçek offline E2E `NOT_RUN`.

## Kabul ölçütleri

- Offline kritik komut tamamlanmış gibi görünmez.
- Tekrar gönderim ikinci yan etki üretmez.
- Conflict çözülmeden kuyruk sessizce kaybolmaz.
- Başka tenant/user/device kuyruğu açılamaz.
- Update bekleyen işleri bozmaz.
- Screen reader durum değişikliğini canlı bölgeyle duyurur; odak beklenmedik yere taşınmaz.

İşlem akışı [WFL-009](../workflows/WFL-009-OFFLINE-VE-YENIDEN-SENKRONIZASYON.md) içindedir.
