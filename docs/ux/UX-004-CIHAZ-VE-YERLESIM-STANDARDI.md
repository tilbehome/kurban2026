---
id: UX-004
title: Masaüstü, Tablet, Telefon, TV ve Kiosk Yerleşim Standardı
status: PLANNED
owner: UX-and-Frontend
source_role: ux_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
related_requirements: [REQ-036, REQ-044, REQ-045, PRO-005, PRO-011, PRO-035]
---

# Cihaz ve yerleşim standardı

## Canlı menü ve placeholder hedefi

`PLANNED`: Placeholder, “yakında” veya executor/runtime bağlantısı bulunmayan yüzey canlı menüde görev seçeneği olarak gösterilmez. Doğrudan URL korunuyorsa güvenli planlı durum, yetki ve geri dönüş yolu sunulur; ekran tamamlanmış modül gibi KPI veya navigasyon sahipliği kazanmaz.

Yerleşim cihaz adına göre yalnız küçülmez; göreve, giriş yöntemine, izleme mesafesine, PII sınırına ve bağlantı durumuna göre değişir. Breakpoint tek başına ürün kararı değildir.

## Masaüstü

**Kullanım:** Firma Admin, finans, yoğun satış, raporlama ve platform yönetimi.

- Çok kolonlu shell; liste + detay paneli.
- Yoğun tabloda sticky başlık, filtre, sıralama, sayfalama/sanallaştırma ve sütun görünürlüğü.
- Klavye sırası, görünür odak, kısayol yardım katmanı ve komut paleti.
- Toplu işlem önce seçim özeti ve etki önizlemesi verir.
- Kritik durum bandı içerikten kopmadan görünür kalır.

## Tablet

**Kullanım:** hayvan kabulü, kesim/tartım/paket istasyonu ve kontrol lideri.

- Landscape durumda iki panel: kuyruk + aktif iş; portrait durumda aktif görev öne alınır.
- Barkod/QR sonrası odak doğru alana taşınır.
- Eldiven kullanımı için birincil kontroller 48–56 CSS px yükseklik hedefler.
- Aynı anda tek aktif istasyon işi; ikincil ayrıntılar çekmece/sekmededir.
- Cihaz, terazi/yazıcı ve sync sağlığı üst durum bandında görünürdür.

## Telefon

**Kullanım:** saha satış, hızlı tahsilat, tarama, sorun bildirimi ve teslim.

- Tek kolon ve tek görev; masaüstü tablosunun yatay kaydırılan kopyası değildir.
- Birincil eylem başparmak erişimli sabit alt görev çubuğundadır; sistem tarayıcı/erişilebilirlik alanını örtmez.
- 360–430 CSS px genişliklerde yatay sayfa kaydırması olmadan kritik görev tamamlanır.
- Formlar kısa adımlara bölünür; mevcut bilgi tekrar istenmez.
- Kamera/QR alternatifi olarak manuel kod girişi bulunur.
- Offline/kuyruk/çatışma durumu renk dışında metin ve ikonla verilir.

## TV

**Kullanım:** anonim sıra, durum ve duyuru.

- Uzaktan okunur büyük tipografi ve yüksek kontrast.
- Ad, telefon, finans, açık müşteri kimliği ve hassas belge gösterilmez.
- Kurban no, sıra/durum, genel ilerleme ve PII’siz duyuru gösterilebilir.
- Etkileşimli kontrol TV yayın yüzeyinde bulunmaz; kontrol ekranı kimlik doğrulamalı ayrı route’tur.
- Yeniden bağlantı, veri yaşı ve acil duyuru görünürdür.

## Kiosk

**Kullanım:** sınırlı self-service veya istasyon görevi.

- Kiosk/oturum kilidi, izinli route listesi ve sınırlı navigasyon.
- İşlem sonrası PII temizliği ve otomatik başlangıç ekranına dönüş.
- Token/QR amacı, süre ve tekrar kullanımı server’da doğrulanır.
- Tarayıcı geri, adres çubuğu veya açık yeni pencere üzerinden yetki sınırı aşılamaz.
- Erişilebilir fiziksel yükseklik ve ekran klavyesi davranışı saha kabulünde doğrulanır; ölçü tahmin edilmez.

## Ortak standartlar

- Genel ürün hedefi en az 44×44 CSS px etkileşim alanı; kritik saha kontrolleri 48–56 px yükseklik.
- Metin/ikon/renk birlikte durum iletir; yalnız renk yok.
- Dokunma, mouse, klavye ve barkod/QR girişleri aynı iş kuralını çağırır.
- Locale değişiminde taşma; Arapça RTL’de sıra, odak ve ikon yönü test edilir.
- Safe-area, zoom ve 200% metin büyütmede birincil kontrol kaybolmaz.
- Kamera/terazi/yazıcı izni reddinde güvenli fallback veya açık blokaj bulunur.

## Gerçek uygulama durumu

Responsive operasyon/komuta çalışma alanı, `/saha`, PII'siz TV/takip projection ve provider-bağımsız cihaz portları `IMPLEMENTED_UNVERIFIED` durumundadır. Kiosk kilidi, gerçek RTL ve fiziksel terazi/yazıcı/tarayıcı/TV/telefon/tablet kabulü `NOT_RUN` durumundadır; route varlığı cihaz kabulü değildir.

## Kabul matrisi

| Cihaz | Zorunlu senaryo | Kanıt |
|---|---|---|
| Masaüstü | Müşteri bul → satış → karma tahsilat | Klavye + Playwright + görsel kontrol |
| Tablet | Kesim/tartım/paket tek aktif iş | Dokunma + tarama + cihaz smoke |
| Telefon | QR ile teslim ve ağ kesintisi | Mobil E2E + offline/conflict testi |
| TV | PII’siz sıra/durum | Uzak okuma + privacy kontrolü |
| Kiosk | Tokenlı görev ve otomatik sıfırlama | Kiosk/session/security E2E |

WCAG ölçütleri [A11Y-001](../accessibility/A11Y-001-WCAG-22-AA-KABUL-PLANI.md) ile birlikte uygulanır.
