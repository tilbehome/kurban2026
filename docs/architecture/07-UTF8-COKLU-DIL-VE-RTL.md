# 07 — UTF-8, Çoklu Dil ve RTL

## Mevcut UTF-8 gözlemi

Repo taramasında aktif kaynaklarda mojibake örneği yakalandı:

- `shared/lib/audit.ts`: yorum içinde bozuk kodlanmış Türkçe ifade.

PowerShell çıktılarında bazı dosyalar mojibake gibi görünebildi; bu terminal encoding kaynaklı da olabilir. Bu nedenle UTF-8 fazında dosya byte doğrulaması, NFC normalizasyonu ve otomatik test gerekir.

## Faz 1 uygulama checkpoint'i

- `shared/lib/audit.ts` içindeki bozuk Türkçe yorum düzeltildi.
- `scripts/check-utf8.mjs` eklendi; kaynak, test, belge ve yapılandırma dosyalarında bilinen mojibake desenlerini tarar. `node_modules`, `.next`, yedekler, veri klasörleri ve kullanıcı yüklemeleri kapsam dışıdır.
- `package.json` içine `pnpm check:utf8` kalite kapısı eklendi.
- `tests/utf8-check.test.ts` ile UTF-8 taramasının test süitinde çalışması sağlandı.

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

Faz 1'de bu öneri çalışan altyapıya dönüştürüldü:

- `shared/lib/hata-katalogu.ts`: kararlı hata kodu, mesaj anahtarı, HTTP status ve kullanıcıya gösterilebilirlik bilgisini tutar.
- `shared/lib/api-hata.ts`: API'ler için standart hata gövdesi üretir. Eski istemciler için `hata` alanı korunur; yeni istemciler `kod`, `mesajAnahtari`, `parametreler`, `requestId` alanlarını kullanabilir.
- `shared/lib/api-mesaj.ts`: istemci tarafında API hata mesajını `mesajAnahtari` öncelikli çözer, eski `hata` alanına geriye uyumlu düşer.
- Pilot dönüşüm yapılan route'lar: `/api/saha-satis`, `/api/hisseler/ata`, `/api/hisseler/toplu-ata`, `/api/hisseler/[id]/iptal`, `/api/vekaletler/[id]`.

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

Faz 1'de `shared/lib/i18n.ts` ile `tr`, `en`, `ar` locale iskeleti, Türkçe fallback, parametreli mesaj çözümü, `ar` için `rtl` yön bilgisi ve tarih/sayı/TRY para biçimlendirme yardımcıları eklendi. Tam çeviri seti ve ekran layout dönüşümü Faz 12 kapsamındadır.
