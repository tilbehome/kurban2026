---
id: A11Y-001
title: WCAG 2.2 AA Kabul Planı
status: PLANNED
owner: Accessibility-and-QA
source_role: accessibility_acceptance_plan
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-044, REQ-045, REQ-054, REQ-055, PRO-011, PRO-023, PRO-024, PRO-025]
---

# WCAG 2.2 AA kabul planı

## Kapsam ve iddia sınırı

WCAG 2.2 AA ürün kabul hedefidir; mevcut ürün için uyumluluk veya sertifika iddiası değildir. Kritik firma/platform paneli, telefon/tablet saha görevleri, TV/kiosk, müşteri takip, belge/PDF ve hata/offline durumları kapsam içindedir. Otomatik araç tek başına kabul kanıtı değildir.

## Algılanabilirlik

| Başlık | Kabul ölçütü |
|---|---|
| Metin alternatifi — 1.1.1 | İşlevsel ikon, QR/tarama sonucu ve anlamlı görsel erişilebilir ada/açıklamaya sahiptir; dekoratif görsel gizlenir. |
| Yapı — 1.3.1/1.3.2 | Başlık, alan, tablo, liste ve durum ilişkileri semantiktir; görsel konum okuma sırasını bozmaz. |
| Girdi amacı — 1.3.5 | Ad, telefon, adres gibi uygun alanlar makinece anlaşılabilir amaç taşır; hassas değer otomatik doldurma politikasıyla sınırlanır. |
| Renk — 1.4.1 | Satış, blokaj, offline ve teslim durumu yalnız renkle anlatılmaz. |
| Kontrast — 1.4.3 | Normal metin en az 4.5:1; büyük metin en az 3:1 kontrast sağlar. |
| Reflow — 1.4.10 | 320 CSS px eşdeğer genişlikte iki yönlü sayfa kaydırma gerekmeden kritik görev tamamlanır; gerçek tablo gibi zorunlu istisnalar ayrıca yönetilir. |
| UI kontrastı — 1.4.11 | Odak, sınır, ikon ve durum bileşenleri komşu renge karşı en az 3:1 sağlar. |
| Metin aralığı — 1.4.12 | Kullanıcı metin aralığını artırdığında içerik/işlev kaybı olmaz. |
| Hover/focus içeriği — 1.4.13 | Tooltip/popup kapatılabilir, üzerine gidilebilir ve kullanıcı kapatana/odak çıkana kadar kalıcıdır. |

## Çalıştırılabilirlik

| Başlık | Kabul ölçütü |
|---|---|
| Klavye — 2.1.1/2.1.2 | Bütün işlemler klavyeyle yapılır; focus trap yoktur. Tarama için manuel giriş alternatifi vardır. |
| Odak sırası — 2.4.3 | Görsel ve anlamlı görev sırası uyumludur; modal/çekmece kapanınca odak tetikleyiciye döner. |
| Odak görünümü — 2.4.7/2.4.11 | Odak açıkça görünür ve sticky bar/modal tarafından tamamen örtülmez. |
| Başlık/etiket — 2.4.6 | Sayfa, bölüm, buton ve alan adları amacı açıklar; “Devam” gibi bağlamsız etiket kritik işlemde kullanılmaz. |
| Sürükleme — 2.5.7 | Sıra/kanban/yerleşim sürüklemesi için tek işaretçi veya klavye alternatifi vardır. |
| Hedef boyutu — 2.5.8 | WCAG tabanı olan 24×24 CSS px veya yeterli aralık korunur; TilbeCore ürün hedefi genel kontrollerde en az 44×44, kritik saha kontrollerinde 48–56 px yüksekliktir. |
| Etiket adı — 2.5.3 | Görsel etiket, erişilebilir adın içinde aynı sırayla bulunur. |

## Anlaşılabilirlik

| Başlık | Kabul ölçütü |
|---|---|
| Dil — 3.1.1/3.1.2 | Sayfa `lang`; farklı dildeki belirgin pasajlar uygun dil bilgisi taşır. Arapça yüzey `dir=rtl` kullanır. |
| Tutarlılık — 3.2.3/3.2.4/3.2.6 | Navigasyon, bileşen adı ve yardım konumu rol/yüzey içinde tutarlıdır. |
| Hata — 3.3.1/3.3.2/3.3.3 | Hatalı alan metinle belirlenir, etiket/talimat vardır ve güvenli düzeltme önerisi sunulur. |
| Kritik hata önleme — 3.3.4 | Finansal, satış, iptal, teslim ve veri etkili işlemde önizleme, düzeltme veya geri alınabilir/teyitli akış bulunur. |
| Tekrar giriş — 3.3.7 | Aynı süreçte bilinen veri tekrar istenmez veya seçilebilir sunulur. |
| Erişilebilir kimlik doğrulama — 3.3.8 | Bilişsel işlev testi zorunlu tutulmaz; parola yöneticisi, yapıştırma ve uygun alternatifler engellenmez. |

## Sağlamlık

| Başlık | Kabul ölçütü |
|---|---|
| Ad/rol/değer — 4.1.2 | Özel bileşen, dialog, tab, combobox, toast ve switch doğru semantik/ad/değer taşır. |
| Durum mesajları — 4.1.3 | Kaydedildi, kuyrukta, hata, conflict ve yükleniyor değişiklikleri odağı zorla taşımadan erişilebilir canlı bölgeyle bildirilir. |

## TilbeCore özel kritik senaryoları

- Hisse dolu, eksik vekâlet, borçlu teslim ve offline durumları renk dışında metin/ikonla algılanır.
- Kasa ve satış tabloları başlık/hücre ilişkilerini korur; mobilde kartlaşınca alan adları kaybolmaz.
- QR/kamera kullanamayan kullanıcı manuel kodla aynı görevi tamamlar.
- Arapça RTL’de odak sırası DOM anlam sırasını izler; kimlik, telefon, para ve küpe değerleri bidi izolasyonla okunur.
- TV yazıları hedef izleme mesafesinde saha kabulüyle doğrulanır; sayı tahmini yapılmaz.
- PDF/etiket ekran okuyucu alternatifi ve erişilebilir HTML önizleme sunar; baskı tek erişim yolu değildir.

## Test yöntemi

1. Semantik ve unit/component incelemesi.
2. Playwright + axe otomasyonu; kritik ihlal release engelidir veya süreli/gerekçeli istisna ister.
3. Yalnız klavye testi.
4. En az bir masaüstü ve bir mobil ekran okuyucu smoke testi; ürün cihaz matrisiyle genişletilir.
5. 200% metin büyütme, 320 CSS px reflow, high-contrast/forced-colors kontrolü.
6. TR/EN/AR ve RTL görsel/işlevsel regresyon.
7. Gerçek saha cihazında dokunma, parlama, eldiven ve izleme mesafesi kabulü.

## Kanıt kaydı

Her ekran için route/yüzey, rol, cihaz/viewport, locale/yön, otomatik sonuç, manuel sonuç, bulgu, severity, sorumlu, istisna süresi ve düzeltme commit’i kaydedilir. `axe geçti` tek başına WCAG kabulü değildir.

## Gerçek uygulama durumu

WCAG/axe/Playwright hedef sözleşmeleri belgelenmiş olsa da genel erişilebilirlik otomasyonu ve manuel kabul kanıtı yoktur. Bu nedenle ürün genel durumu `PLANNED`; mevcut UI bileşenleri için uyumluluk iddiası yapılmaz.

İlgili cihaz standardı [UX-004](../ux/UX-004-CIHAZ-VE-YERLESIM-STANDARDI.md), locale/RTL rehberi [I18N-001](../i18n/I18N-001-TR-EN-AR-VE-RTL.md) içindedir.
