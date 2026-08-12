---
id: I18N-001
title: TR, EN, AR Yerelleştirme ve RTL Rehberi
status: PLANNED
owner: Localization-and-UX
source_role: localization_rtl_standard
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-052, REQ-053, REQ-054, REQ-055, PRO-023, PRO-025]
---

# TR, EN, AR ve RTL

## Dil politikası

- İlk ve temel dil Türkçedir (`tr`).
- İngilizce (`en`) ve Arapça (`ar`) ürün paketleri hedeflenir.
- Eksik mesaj güvenli biçimde Türkçe fallback’e düşebilir; production’da ham mesaj anahtarı gösterilmez.
- Kullanıcı adı, adresi, notu ve işletme verisi otomatik çevrilmez.
- Veritabanı durum kodu locale metni olarak saklanmaz; UI mesaj anahtarıyla çevrilir.

## Mesaj sözleşmesi

API iş mantığı kullanıcı cümlesine bağlı olmaz.

```json
{
  "kod": "SHARE_NOT_AVAILABLE",
  "mesajAnahtari": "sales.shareNotAvailable",
  "parametreler": { "shareNo": 3 },
  "requestId": "opaque-id"
}
```

- `kod` kararlı teknik davranış; `mesajAnahtari` kullanıcı metni; `parametreler` güvenli değerlerdir.
- Namespace’ler: `common`, `auth`, `customer`, `animal`, `share`, `sales`, `finance`, `proxy`, `slaughter`, `packaging`, `delivery`, `platform`, `document`.
- Çeviri anahtarı cümle parçası birleştirmez; çoğul ve cinsiyet dili locale kurallarına bırakılır.
- Secret, connection string, fiziksel yol veya PII çeviri parametresi yapılmaz.

## Locale formatları

- Tarih/saat UTC kaynaktan firma saat diliminde, locale’a göre gösterilir.
- Para hesaplama locale stringiyle yapılmaz; kesin para tipi kullanılır, yalnız sunum locale’a göre biçimlenir.
- Kilo sabit hassasiyetli değerdir; ondalık işareti görüntülemede locale’a uyar.
- Telefon, küpe, kurban no, QR ve teknik kimlikler çevrilmez; uygun LTR/bidi izolasyonu kullanılır.
- CSV/Excel/PDF Türkçe ve Arapça karakterleri kaybetmez; font glyph/fallback ve encoding test edilir.

## RTL yerleşim

Arapça çeviri tek başına RTL kabulü değildir.

- Kök belge/yüzey `lang="ar" dir="rtl"` kullanır.
- Mantıksal CSS özellikleri (`inline-start/end`) tercih edilir.
- Sidebar, breadcrumb, çekmece, form etiketi, tablo ve mobil navigasyon RTL düzenine geçer.
- Geri/ileri, yönlü ok ve ilerleme ikonları anlamına göre aynalanır; telefon, oynat, onay gibi yönsüz ikonlar körlemesine aynalanmaz.
- Sayı, para, telefon, küpe, URL, kod ve QR çevresi bidi izolasyonuyla okunur.
- Form alanının içerik yönü veri türüne göre olabilir; genel layout RTL kalır.
- A4 belge, etiket ve karma TR/AR metinde font fallback, satır kırma ve QR boşluğu korunur.

## Çeviri yönetişimi

1. Türkçe ana mesaj ve iş terimi domain sahibi tarafından tanımlanır.
2. EN/AR çeviri, glossary ve bağlamla yapılır; ham makine çevirisi bağlayıcı kabul edilmez.
3. Placeholder, aria-label, validation, toast, PDF, e-posta/SMS ve bildirim aynı envantere dahildir.
4. Çeviri değişikliği screenshot/uzunluk/RTL ve kritik görev regresyonundan geçer.
5. Firma markası ve serbest işletme içeriği locale paketiyle karıştırılmaz.

## Terim çekirdeği

| Türkçe kaynak terim | İngilizce kavram | Arapça yaklaşım notu |
|---|---|---|
| Hayvan | Animal | Sektörel bağlam çeviri incelemesi ister. |
| Hisse | Share | Finansal “stock/share” ile karıştırılmamalı. |
| Hissedar | Shareholder / share owner | Kurban bağlamı glossary’de açıklanmalı. |
| Vekâlet | Proxy authorization | Dinî/hukuki bağlam uzman incelemesi ister. |
| Kesim sırası | Slaughter queue | Kurban numarasından ayrıdır. |
| Tahsilat | Collection / receipt | Ödeme yöntemiyle aynı terim değildir. |
| Cari | Season account / receivable balance | Genel muhasebe anlamı bağlamla açıklanır. |
| Ters kayıt | Reversal entry | Silme/iptal ile eş anlamlı değildir. |

Tablodaki EN/AR ifadeleri kullanıcıya yayınlanmış onaylı çeviri paketi değildir; terminoloji niyetini açıklar. Nihai sözlük profesyonel dil incelemesi ister.

## Kabul ölçütleri

- TR ekranlarında mojibake yoktur; UTF-8/NFC kalite kapısı geçer.
- EN/AR’de hiçbir kritik buton, hata, aria-label, belge veya bildirim ham anahtar göstermez.
- 360–430 CSS px telefonda uzun EN/AR metin taşması birincil görevi kapatmaz.
- Arapça layout gerçek RTL, odak sırası ve yönlü ikon testlerini geçer.
- Sayı/para/tarih/kilo locale formatı hesaplanan değeri değiştirmez.
- Türkçe + Arapça karma PDF/etikette glyph kaybı, ters sayı veya QR çakışması yoktur.
- Kullanıcı tarafından girilen isim/adres/not çevrilmez veya bozulmaz.

## Gerçek uygulama durumu

`shared/lib/i18n.ts` içinde `tr/en/ar` iskeleti, Türkçe fallback, yön ve format yardımcıları; UTF-8 tarama/test altyapısı vardır (`IMPLEMENTING`). Tam UI sözlüğü, EN/AR çeviriler, gerçek RTL layout ve PDF/etiket kabulü `PLANNED` durumundadır.

Erişilebilir locale kabulü [A11Y-001](../accessibility/A11Y-001-WCAG-22-AA-KABUL-PLANI.md) ile birlikte çalıştırılır.
