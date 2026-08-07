# 07 — UTF-8, Çoklu Dil ve RTL

## Mevcut UTF-8 gözlemi

Repo taramasında aktif kaynaklarda mojibake örneği yakalandı:

- `shared/lib/audit.ts`: yorum içinde bozuk kodlanmış Türkçe ifade.

PowerShell çıktılarında bazı dosyalar mojibake gibi görünebildi; bu terminal encoding kaynaklı da olabilir. Bu nedenle UTF-8 fazında dosya byte doğrulaması, NFC normalizasyonu ve otomatik test gerekir.

## Hedef encoding standardı

- Kaynak dosyalar UTF-8.
- `.editorconfig`: `charset = utf-8`, `end_of_line = lf` veya ekip kararıyla tutarlı CRLF.
- `.gitattributes`: metin dosyaları için UTF-8/line ending stratejisi.
- PostgreSQL `UTF8`.
- Client encoding doğrulaması.
- Windows terminal için `chcp 65001` veya PowerShell UTF-8 çıktısı dokümante edilir.
- CSV/Excel export UTF-8 BOM veya Excel uyumlu seçenek sunar.
- PDF fontları Türkçe ve Arapça glyph içerir.

## Hata mesajı mimarisi

Program mantığı Türkçe cümle eşleştirerek çalışmamalıdır.

Öneri:

```ts
{
  code: "SAHA_SATIS_HISSE_DOLU",
  messageKey: "sales.shareAlreadySold",
  params: { shareNo: 3 }
}
```

## Dil planı

Varsayılan dil: `tr`.

İlk diller:

- `tr`
- `ar`
- `en` altyapısı

Dosya yapısı önerisi:

```text
shared/i18n/
  locales/tr/common.json
  locales/tr/sales.json
  locales/tr/finance.json
  locales/ar/common.json
  locales/en/common.json
  message-registry.ts
```

Namespace önerileri:

- `common`
- `auth`
- `customer`
- `animal`
- `share`
- `sales`
- `finance`
- `proxy`
- `slaughter`
- `delivery`
- `document`
- `platform`

## RTL gereksinimleri

Arapça gerçek RTL olarak tasarlanmalıdır:

- `dir="rtl"`
- Sidebar yönü.
- Form hizaları.
- Tablo kolon davranışı.
- Geri/ileri ikonları.
- Mobil navigasyon.
- A4 belge ve paket etiketi.
- QR çevresi.
- Arapça font.
- Türkçe + Arapça aynı belgede font fallback.
- RTL görsel regresyon testi.

Kullanıcı tarafından yazılan ad, adres, not otomatik çevrilmez.
