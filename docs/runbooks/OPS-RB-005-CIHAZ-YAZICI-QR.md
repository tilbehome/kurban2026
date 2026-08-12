# Cihaz, Yazıcı ve QR Sorunu Runbook’u

```yaml
id: OPS-RB-005
title: Cihaz, Yazıcı ve QR Sorunu Runbook'u
status: PLANNED
owner: Tenant-Operations
source_role: incident_runbook
reviewers: [Operations, UX, Security]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HER_CIHAZ_PROVASI_ONCESI
version: 0.1
source_of_truth: false
related_requirements: [REQ-044, REQ-045, PRO-035]
related_adrs: []
related_modules: [device-sdk, qr-barcode, printing, tenant-mobile]
related_tests: [TST-008, TST-010]
supersedes: []
superseded_by: null
```

## İlk ayrım

Sorunu cihaz, kullanıcı izni, LAN, tarayıcı/PWA, adapter, yazıcı spooler, şablon/encoding, QR token veya backend olarak sınıflandır. Cihaz arızası nedeniyle kimlik kontrolünü atlama.

## Ortak adımlar

1. Incident/istasyon kaydı aç; cihaz ID, tür/model, OS/browser/app sürümü, zaman ve hata kodunu yaz.
2. Aktif işi bloke et; aynı paketi/teslimi farklı cihazlarda eşzamanlı tamamlatma.
3. Ağ ve doğru tenant hostunu, kullanıcı/cihaz yetkisini, saat ve oturum durumunu doğrula.
4. Onaylı yedek cihaz/adapter profiline geç; kişisel veya kayıtsız cihaz kullanma.
5. Manuel fallback varsa kullanıcı, neden, fiziksel kimlik ve ikinci kontrol ile kayıt üret.

## Yazıcı

- Doğru tenant, belge/etiket sürümü, boyut ve yazıcı kuyruğunu doğrula.
- Aynı job’u körlemesine yeniden gönderme; job sonucu ve fiziksel çıktı sayısını eşleştir.
- Tekrar baskı nedenini kaydet; eski QR/etiket iptal edilmeden yeni kimlik üretme.
- Türkçe/Arapça font, QR okunabilirliği ve etiket-hisse bağı kontrol edilmeden kullanma.

## QR/barkod

- Kodun amaç, tenant, süre, durum ve tek kullanım kuralını server-side doğrula.
- Hasarlı kodda yetkili arama/elle kimlik girişi kullanılabilir; kullanıcıdan gelen payload’a güvenme.
- Başka hisse/paket/müşteri veya tüketilmiş token ise işlemi kapatma; sorun masasına gönder.
- QR fotoğrafını genel ticket/chat kanalına ekleme.

## Kapanış

Bekleyen işler tekilleştirilmiş, mükerrer job/token yok, fiziksel çıktı ile sistem kaydı mutabık ve yedek cihazdan ana cihaza dönüş güvenli olmalıdır. Arızalı cihaz uzaktan/yerel iptal edilmeden tekrar havuza alınmaz.
