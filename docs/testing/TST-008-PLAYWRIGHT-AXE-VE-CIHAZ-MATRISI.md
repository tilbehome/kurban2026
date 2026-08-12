# Playwright, axe ve Cihaz Kabul Planı

```yaml
id: TST-008
title: Playwright, axe ve Cihaz Kabul Planı
status: REVIEW
owner: QA
reviewers: [UX, Accessibility, Security, Product]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: PLAYWRIGHT_ALTYAPISI_EKLENDIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-044, REQ-045, PRO-011, PRO-023, PRO-024, PRO-025]
related_adrs: [ADR-0001]
related_modules: [platform-admin, tenant-web, tenant-mobile, public-display]
related_tests: [TST-008, TST-009]
supersedes: []
superseded_by: null
```

## Mevcut durum

Playwright ve axe hedefleri mimaride tanımlıdır; repo scripti/paket kurulumu ve çalıştırılmış E2E/axe kanıtı mevcut sayılmaz. Bu plan komut uydurmaz. Altyapı eklendiğinde güncel package scripti tek kaynak olur.

## Tarayıcı ve yüzey matrisi

| Profil | Yüzey | Kritik davranış |
|---|---|---|
| Masaüstü Chromium | Platform/Firma Admin | Klavye, yoğun tablo, filtre, dialog ve oturum |
| Masaüstü Firefox/WebKit | Kritik web akışları | Tarayıcı uyumu ve güvenli hata |
| Telefon viewport + gerçek Android | Saha PWA | Tek el, tarama, bağlantı, büyük dokunma alanı |
| Tablet portrait/landscape | İstasyon | İki panel, yön değişimi, kamera/yazdırma |
| TV/büyük ekran | Anonim durum | PII yok, uzaktan okuma, otomatik yenileme |
| Kiosk | Sınırlı görev | Otomatik sıfırlama, oturum/veri kalıntısı yok |
| A4/print | Belge/QR | UTF-8, font, ölçü, QR okunabilirliği |

Simüle viewport fiziksel cihaz kabulünün yerine geçmez. Gerçek cihaz modeli/OS/tarayıcı sürümü kanıtta yazılır; destek matrisi ölçümden sonra dondurulur.

## Locale ve erişilebilirlik

- `tr`, `en`, `ar`; Arapçada gerçek `dir=rtl`, yönsel ikon ve focus sırası.
- Firma saat dilimi, tarih, sayı, para ve ağırlık formatı.
- %200 zoom/reflow, klavye-only, görünür focus ve mantıklı heading/landmark.
- Form label, açıklama ve hata ilişkisi; renk dışı durum göstergesi.
- Dialog/çekmece focus trap ve geri dönüşü; toast tek hata kanalı değildir.
- axe otomasyonu + manuel klavye + seçilmiş ekran okuyucu smoke.

## Kritik E2E akışları

1. Platform login + MFA/passkey/recovery + session revoke.
2. Firma çözümleme ve başka tenant host/session negatifleri.
3. Müşteri/hisse satışı ve tahsilat; retry/idempotency.
4. Vekâlet → kesim → tartım → paket → QR teslim.
5. Kasa sayımı/farkı ve yetkili düzeltme.
6. Offline görünümü, queue durumu ve yeniden sync.
7. Read-only/full-stop/modül durdurma kullanıcı davranışı.
8. TV ve public tracking yüzeyinde PII/finans yokluğu.

## Artefakt ve gizlilik

Başarısızlıkta trace, screenshot ve video yalnız sentetik veri kullanır. Cookie, token, secret veya gerçek PII artefakta girmemelidir. Artefakt erişimi ve saklama süresi Operations/Privacy tarafından onaylanır.

## Kabul

- Bloklayıcı kullanıcı yolu ve kritik axe bulgusu açık kalmaz; istisna sahipli/süreli/risk kabul kayıtlıdır.
- Flake yeniden çalıştırmayla gizlenmez; oran ve kök neden kaydedilir.
- Her proje gerçekten koşmuş olmalı; `skipped` matris hücresi gerekçesiz kabul edilmez.
- Sonuç [EVD-006](../evidence/EVD-006-E2E-ERISILEBILIRLIK-CIHAZ-SABLONU.md) ile kaydedilir.
