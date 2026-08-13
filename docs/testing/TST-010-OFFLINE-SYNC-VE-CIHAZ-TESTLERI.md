# Offline, Sync ve Cihaz Test Planı

```yaml
id: TST-010
title: Offline, Sync ve Cihaz Test Planı
status: IMPLEMENTED_UNVERIFIED
owner: QA
source_role: test_plan
reviewers: [Domain, UX, Security, Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-13
verified_against_commit: not_applicable
next_review: ILK_CIHAZ_OFFLINE_KABULUNDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-044, REQ-045, REQ-067, PRO-033, PRO-034, PRO-035]
related_adrs: []
related_modules: [offline, sync-engine, device-sdk, tenant-mobile]
related_tests: [TST-010]
supersedes: []
superseded_by: null
```

## Durum ve sınıflar

`packages/offline` saf runtime’ı sınıflandırma, tenant/season/user/device/session bağlama, client işlem ID, idempotency, expected version, TTL, izin yeniden doğrulama, exponential retry, poison, conflict ve görünür durum sözleşmesini uygular. IndexedDB adaptörü vardır; satış/ödeme/kesim/teslim/ownership yalnız `ONLINE_REQUIRED` kalır. Gerçek API composition, conflict inbox ekranı ve fiziksel cihaz kabulü tamamlanmadığı için genel durum `IMPLEMENTED_UNVERIFIED` ve cihaz sonuçları `NOT_RUN/BLOCKED` kalır.

| Sınıf | Örnek | Beklenen |
|---|---|---|
| `ONLINE_REQUIRED` | Kesin satış, finansal posting, kesim onayı, teslim kapanışı | Sunucu onayı yoksa başarı yok |
| `QUEUE_ALLOWED` | Önceden onaylı düşük riskli tarama/not | Yerel kuyruk, görünür pending, idempotent sync |
| `READ_CACHE` | Görev/sıra/referans görünümü | Yaş ve kaynak görünür; hassas veri minimizasyonu |
| `NEVER_CACHE_SENSITIVE` | Secret, tam finans, hassas belge | Yerel kalıcı cache yok |

## Ağ senaryoları

- İstek öncesi, gönderim sırasında ve server commit sonrası response kaybında bağlantı kesilmesi.
- Yavaş, yüksek gecikmeli, paket kayıplı ve sık gidip gelen ağ.
- Uygulamanın kapanması, cihaz yeniden başlaması, storage kotası ve bozuk local kayıt.
- Aynı kullanıcı/cihazdan tekrar; iki cihazdan eşzamanlı aynı varlık komutu.
- Offline yetki süresi dolması, kullanıcı/cihaz iptali ve tenant askıya alma.
- Sıra dışı sync, partial batch, retry, poison message ve conflict.

## Beklenen invariant’lar

- Her queued komut client işlem ID, idempotency, tenant, kullanıcı, cihaz, sürüm, zaman ve TTL taşır.
- UI `kuyrukta`, `senkronize`, `başarısız`, `çakışmalı` durumunu ayırır.
- Finans ve sahiplik için last-write-wins kullanılmaz.
- İptal edilen cihazın kuyruğu otomatik güvenilir sayılmaz; yetki tekrar doğrulanır.
- Sync sonrası server kayıtları ve local queue için uzlaştırma raporu oluşur.
- Başarısız item bütün kuyruğu sessizce atlatmaz; yetkili sorun masasına gider.

## Cihaz kabulü

| Cihaz | Kontrol |
|---|---|
| Telefon/tablet | Kamera izni, PWA install/update, storage, orientation, pil tasarrufu |
| QR/barkod | Doğru/yanlış/hasarlı/tekrar kod; elle giriş fallback’i |
| Yazıcı | Bağlantı, şablon, UTF-8, tekrar baskı nedeni, spooler kesintisi |
| Terazi | Birim, stabil okuma, timeout, kalibrasyon metadata’sı, manuel giriş nedeni |
| TV/kiosk | Otomatik yenileme/sıfırlama, PII yokluğu, bağlantı kaybı görünümü |

## Kabul kanıtı

Testte ağ hata enjeksiyonu yöntemi, cihaz/OS/browser, queue öncesi/sonrası sayıları, server kayıt sayısı, mükerrerlik ve conflict kararları kaydedilir. Gerçek finans/teslim verisi kullanılmaz. Açık conflict veya kayıp kayıt varsa Kurban Günü canlı kapısı kapanır.
