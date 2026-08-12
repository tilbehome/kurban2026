---
id: DOM-009
title: Vekâlet ve Belgeler Domain Sözleşmesi
status: REVIEW
owner: Domain-and-Religious-Operations
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-061]
---

# Vekâlet ve belgeler

## Sınır

Vekâlet hisse bazlı dinî operasyon kaydıdır. Belge; onay metni/politika sürümü, veren, temsilci, kanal, zaman ve kanıt bağını korur. Kesim ve teslim QR’ları farklı amaçlı tokenlardır.

## Değişmez kurallar

- Her hisse kesimden önce geçerli vekâlet durumuna sahip olmalıdır.
- Vekâlet veren ile hissedar farklı olabilir.
- Tek kanıt birden çok hisseye bağlanabilir; her bağ ayrı izlenir.
- Yüz yüze sözlü, telefon ve WhatsApp ses kaydı yöntemleri belgelenmiştir; ses/görüntü saklama, hukuk ve açık rıza kararı olmadan genişletilmez.
- Belge fiziksel yolu istemciye çıkmaz; hassas dosya `public` altında tutulmaz.
- Kayıp/yenilenen belgede eski token iptal edilir, yeni sürüm çıkar.
- Kesim kontrolü ile teslim kapanışı aynı QR amacıyla yapılamaz.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| `ProxyDocument`, çoklu hisse bağı, sürüm ve korumalı storage guard | `IMPLEMENTED_PENDING_VERIFICATION` | `packages/tenant-core/src/operation-flow.ts`, PostgreSQL tenant şeması. |
| Amaç bağlı, süreli/iptal edilebilir `QrToken` sözleşmesi | `IMPLEMENTED_PENDING_VERIFICATION` | Tenant core ve tenant şeması. |
| Legacy korumalı dosya okuma ve yetki/audit | `IMPLEMENTING` | `/api/vekaletler/[id]`, `shared/lib/vekalet-dosya.ts`, ilgili testler. |
| Legacy yükleme/yenileme | `IMPLEMENTING` | `/api/vekaletler`; mevcut kayıt fiziksel silinebildiği için hedef versiyonlama kuralını tam karşılamıyor. |
| Çoklu veren, kanal/politika sürümü, A4 iki aşamalı QR runtime | `PLANNED` | Bağlı tam model/UI/E2E kanıtı yok. |

## Durumlar

```text
DRAFT → SIGNED → REVOKED
              \→ LOST → REISSUED (yeni sürüm)
```

Kayıp belge yeni versiyona yönlendirir; eski kayıt korunur. `SIGNED` dışında belge kesim önkoşulunu karşılamaz.

## Kabul ölçütleri

- Yedi geçerli vekâleti olmayan hayvan normal kesim geçişine başlayamaz.
- Yetkisiz kullanıcı belgeyi ID değiştirerek okuyamaz.
- Fiziksel storage anahtarı API, log veya audit export’unda görünmez.
- İptal edilmiş veya süresi geçmiş QR tekrar kullanılamaz.
- Kayıp belge yenilenince eski token reddedilir ve sürüm zinciri görünürdür.
- TR/EN/AR belge metni ve Arapça glyph/RTL baskısı ayrı kabulden geçer.

Akış [WFL-005](../workflows/WFL-005-VEKALET-VE-BELGE.md), i18n/baskı ölçütleri [I18N-001](../i18n/I18N-001-TR-EN-AR-VE-RTL.md) içindedir.
