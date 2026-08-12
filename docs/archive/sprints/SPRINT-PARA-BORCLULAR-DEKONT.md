---
id: ARCH-187F7CACAAC9
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT — Para Format + Borçlular + Kurumsal Dekont

**Sırayla 3 ayrı commit yapacaksın. Her commit bağımsız — biri çökerse diğerleri etkilenmez.**

İşaretleme:
- 🟢 SPRINT 1 — `fix(para)` — 5-10 dakika
- 🟡 SPRINT 2 — `feat(borclular)` — 1-2 saat
- 🔴 SPRINT 3 — `feat(dekont)` — 2-3 saat

Her sprint'in başlangıcında "PRE-WRITE GATE" var: değişeceklerin listesini bana raporlayıp onay bekleyeceksin.

---

## 🟢 SPRINT 1 — Para Format Düzeltmesi

### Sorun
Borçlular tablosunda `₺139.000` görünüyor, olması gereken `₺139.000,00`. Sorun `formatPara()` helper'ında:
- `shared/lib/para.ts` → `minimumFractionDigits: 0` → 2 olmalı

### Side Effect Analizi
- Tablo/dekont/borç sayfaları: ✅ `,00` ekler → doğru
- Dashboard KPI ana sayıları: ⚠️ `₺25.000.000` → `₺25.000.000,00` → karta sığmaz
  - Çözüm: KPI kartlarında `≥ 100.000` ise `formatKisa()` kullan (₺25M format)

### Değişiklikler

**1. `shared/lib/para.ts`** — iki formatter güncellemesi:

```ts
const TL_FORMATTER = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,   // 0 → 2
  maximumFractionDigits: 2,
});

const SAYI_FORMATTER = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,   // 0 → 2
  maximumFractionDigits: 2,
});
```

**Yeni helper ekle** (`shared/lib/para.ts` sonuna):

```ts
/**
 * Büyük sayılarda kompakt format: 25000000 → "25,0M", 1500 → "1,5K"
 * Türkçe virgüllü, küçük sayılarda kuruşlu döner.
 */
export function formatParaKisa(deger: number | null | undefined): string {
  if (deger == null || Number.isNaN(deger)) return "₺0,00";
  const n = yuvarla(deger);
  if (n >= 1_000_000) {
    return "₺" + (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  }
  if (n >= 100_000) {
    return "₺" + Math.round(n / 1_000).toLocaleString("tr-TR") + "K";
  }
  return formatPara(n);
}
```

**2. `modules/dashboard/components/KpiKartlari.tsx`** — `formatDeger()` güncellemesi:

```tsx
import { formatPara, formatParaKisa } from "@/shared/lib/para";

function formatDeger(kart: DashboardKpiKart): string {
  if (kart.birim === "₺") return formatParaKisa(kart.sayi);  // formatPara → formatParaKisa
  if (kart.birim === "%") return `%${kart.sayi}`;
  return kart.sayi.toLocaleString("tr-TR");
}
```

### PRE-WRITE GATE (raporla, onay bekle)

```
DOSYALAR
- Güncellenecek: shared/lib/para.ts (3 satır + 15 satır yeni helper)
- Güncellenecek: modules/dashboard/components/KpiKartlari.tsx (1 satır import + 1 satır fonksiyon)
- Eklenecek: yok
- Silinecek: yok

TEST (commit'ten ÖNCE)
1. pnpm tsc --noEmit → temiz
2. pnpm build → temiz
3. /musteriler/borclular → ₺139.000,00 (kuruşlu) görünmeli
4. /api/tahsilat/dekont/{id} HTML'inde ₺27.000,00 görünmeli
5. Dashboard KPI kartları → ₺25,0M, ₺2,1M (kompakt) görünmeli, kartlar bozulmamalı
6. KUTSAL: tahsilat akışı TKR-2026-NNN oluştur+sil
```

### Commit Mesajı

```
fix(para): formatPara her zaman 2 ondalik basamak + KPI kompakt format

SORUN: Borclular tablosunda \u20ba139.000 goruluyordu, olmasi gereken
\u20ba139.000,00. Sebep formatPara() helper'inda minimumFractionDigits=0
olmasiydi - tam sayilarda virgul ve kurus gizleniyordu. Muhasebe
standartlarina ters, tutarsiz gosterim.

COZUM:
- shared/lib/para.ts: TL_FORMATTER + SAYI_FORMATTER minimumFractionDigits
  0 -> 2 (her zaman ,XX gosterir)
- Yeni helper: formatParaKisa() - dashboard KPI kartlari icin
  * >= 1M ise "M" suffix (\u20ba25,0M)
  * >= 100K ise "K" suffix (\u20ba500K)
  * Kucukse formatPara'ya devreder (\u20ba50.000,00)
- modules/dashboard/components/KpiKartlari.tsx: formatDeger \u20ba birimi
  i\u00e7in formatParaKisa kullaniyor (kartlar kompakt kalir)

ETKI:
- /musteriler/borclular: \u20ba139.000 -> \u20ba139.000,00 \u2705
- /api/tahsilat/dekont/{id}: \u20ba27.000 -> \u20ba27.000,00 \u2705
- /tahsilat, /kasa, /raporlar: tum tutarlar 2 basamakli \u2705
- Dashboard KPI: \u20ba25M, \u20ba2,1M (kart icinde sigar) \u2705

KUTSAL korundu:
- formatPara'nin matematik (yuvarla) kismi degismedi
- Tahsilat akisi TKR-2026-NNN test edildi
- Tum sayfalar 200
```

---

## 🟡 SPRINT 2 — Borçlular Sayfası Geliştirme

### Hedef
Mevcut borçlular sayfası fonksiyonel ama bayram öncesi 286 borçlu için yetersiz. Ekleyecekler:

**Yeni özellikler:**
1. **WhatsApp toplu hatırlatma butonu** — sayfa üstünde, filtrelenmiş sonuçtaki telefonlu borçlulara FAZ 8'deki WhatsApp toplu gönderim wizard'ını aç (sablon ön-seçili: "Borç Hatırlatma Yumuşak")
2. **Telefon filtresi** — Hepsi / Telefonlu / Telefonsuz radio
3. **Etiket filtresi** — multi-select dropdown (VIP, Düzenli vs.)
4. **Toplu seçim** — checkbox sütunu + sayfa üstünde "5 seçili" + toplu eylem barı (WhatsApp / Excel'e aktar)
5. **Sticky özet bar** — sayfa sonunda toplam alacak, ortalama borç, en yüksek borç
6. **Hover hızlı menü** — satır üzerinde mouse'la hover'da 4 ikon: Tahsilat / WhatsApp / Detay / Hisse
7. **Telefon yanında Ara butonu** — `tel:` link (mobilde dial açar)
8. **Satıra tıklama** — müşteri detayına git

### Mimari

```
modules/musteriler/components/borclular/
├── BorclularClient.tsx          (orkestra: state, filtre, secim)
├── BorclularUst.tsx             (mevcut + telefon filtresi + etiket filtresi + WhatsApp toplu butonu)
├── BorclularTablo.tsx           (mevcut tabloyu modulerlestir + checkbox + hover menu)
├── BorclularOzetBar.tsx         (sticky bottom: toplam/ortalama/en yuksek)
├── ToplupEylemBar.tsx           (X secili gosterimi + WhatsApp/Excel butonu)
└── BorcluSatir.tsx              (tek satir bilesen + hover state)

modules/musteriler/lib/
└── borclu.service.ts            (mevcut + telefon filtresi + etiket filtresi)
```

### API Güncellemeleri

**`/api/musteriler/borclular?telefon=hepsi|var|yok&etiket=VIP,Duzenli`** — yeni query parametreleri

### UI Detayları

**Üst panel (ust):**
```
[Sıralama: Borc | İsim]  [Min borç: Hepsi 10K 50K 100K]
[Telefon: Hepsi | Var | Yok]  [Etiket: VIP × Düzenli × +]
                                                    [📨 WhatsApp Toplu Hatırlatma]
```

**Tablo başlığı:**
```
[☐] Müşteri | Telefon | Hisse | Bedel | Ödenen | Kalan | İşlemler
```

**Satır:**
```
[☐] AHMET ÇUSUN          [📞 ara][💬 WA]  3   ₺17.142.858,00  ₺141.900,00  ₺17.000.958,00  [Hızlı menü ikonları]
    (etiketleri varsa rozet)
```

**Hover hızlı menü (sağ kenar):**
```
[💰 Tahsilat]  [💬 WA]  [👤 Detay]  [🐂 Hisse]
```

**Sticky özet bar (alt, fixed):**
```
14 borçlu (filtrelenmiş)  ·  Toplam: ₺18.010.291,34  ·  Ortalama: ₺1.286.449,38  ·  En yüksek: ₺17.000.958,00
```

**Toplu eylem bar (5+ seçili):**
```
[5 müşteri seçili]  [📨 WhatsApp Gönder]  [📊 Excel'e Aktar]  [İptal]
```

### PRE-WRITE GATE

```
DOSYALAR
- Eklenecek (7): borclular/ klasoru altinda 6 component + 1 service guncelle
- Güncellenecek: app/musteriler/borclular/page.tsx (Server -> Client wrap)
- API: app/api/musteriler/borclular/route.ts (telefon + etiket query param)
- API: app/api/musteriler/borclular/excel/route.ts (secili musteri Excel)

TEST
1. pnpm tsc --noEmit + build temiz
2. Filtreler tek tek calisiyor (min borc + telefon + etiket)
3. Toplu secim 5 musteri sec -> ToplupEylemBar gorunur
4. WhatsApp toplu -> /whatsapp/toplu sayfasina musteriIds parametresi ile yonlendir
5. Hover'da hizli menu gorunuyor
6. Sticky ozet bar dogru hesapliyor
7. KUTSAL tahsilat akisi
```

### Commit Mesajı

```
feat(borclular): WhatsApp toplu + filtreler + toplu se\u00e7im + sticky \u00f6zet

Mevcut bor\u00e7lular sayfasi temel listeleme yapiyor, ancak bayram \u00f6ncesi
210 bor\u00e7lu i\u00e7in toplu eylem ve gelismis filtreleme eksikti. Bu commit
ile kasiyerin saatler s\u00fcrebilecek hatirlatma t i\u015flerini dakikalara
indiren ara\u00e7 seti eklendi.

YEN\u0130 \u00d6ZELL\u0130KLER:
- WhatsApp Toplu Hat\u0131rlatma: tek tikla FAZ 8 wizard'ina y\u00f6nlendirir,
  filtrelenmis bor\u00e7lular hedef olarak ge\u00e7er, sablon \"Bor\u00e7 Hatirlatma
  Yumusak\" \u00f6n-se\u00e7ili
- Telefon filtresi: Hepsi / Telefonlu / Telefonsuz (178 telefonsuz var)
- Etiket filtresi: VIP, D\u00fczenli vb. \u00e7oklu se\u00e7im
- Toplu se\u00e7im: checkbox + 5 sec\u00edli g\u00f6stergesi + toplu eylem bar
- Sticky alt bar: toplam + ortalama + en y\u00fcksek bor\u00e7
- Hover hizli men\u00fc: Tahsilat / WA / Detay / Hisse (4 ikon)
- Tel: link (mobilde dial)
- Satira tikla -> detay sayfasi

KOMPONENTLER (modules/musteriler/components/borclular/):
- BorclularClient: state + filter + secim orkestrasi
- BorclularUst: filtreler + WhatsApp toplu butonu
- BorclularTablo: checkbox + hover menu
- BorclularOzetBar: sticky alt ozet
- ToplupEylemBar: secim aktif iken gorunen bar
- BorcluSatir: tek satir + hover state

API:
- GET /api/musteriler/borclular?telefon&etiket: yeni query parametreleri
- GET /api/musteriler/borclular/excel?ids: secili musteri excel

KUTSAL:
- /api/tahsilat akisi bozulmadi
- WhatsApp FAZ 8 entegrasyonu yeni paket eklenmedi
```

---

## 🔴 SPRINT 3 — Profesyonel Kurumsal Dekont + QR

### Hedef
Mevcut dekont basit/sade. **Kurumsal fatura standartlarında**, QR kodlu, bayram temalı, müşteri güvenini artıran profesyonel makbuz.

### Yeni Tasarım Anatomisi

```
┌─────────────────────────────────────────────────────────────────┐
│  [Tilbe Logo]                                  [Ana QR Kod]      │
│  Tilbe Kurban                                  ┌──────────┐      │
│  Sakarya / Serdivan                            │ ▣▣▣▣▣▣▣  │      │
│  Tel: <EXAMPLE_PHONE>                           │ ▣▣▣▣▣▣▣  │      │
│  Tilbe Adabereket Vakfi                        └──────────┘      │
│                                                Kurbanını canlı    │
│                                                takip et →         │
├─────────────────────────────────────────────────────────────────┤
│              ◆ TAHSİLAT MAKBUZU ◆                                │
│       No: TKR-2026-000100        25.05.2026 12:00                │
├─────────────────────────────────────────────────────────────────┤
│  Müşteri:    AHMET ÇUSUN  [VIP]                                  │
│  Telefon:    0532 XXX XX XX                                       │
│  Kurban:     #46 — 6. Hisse                                       │
│  Kurban Türü: Büyükbaş Dana                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  HİSSE BİLGİSİ                                                   │
│  Hisse Bedeli                                  ₺30.000,00         │
│  Önceki Ödemeler                             - ₺3.000,00          │
│                                                                   │
│  BU ÖDEME                                                         │
│    Nakit                                       ₺27.000,00         │
│  ─────────────────────────────────────────────────────────       │
│  TOPLAM                                        ₺27.000,00         │
│                                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│  KALAN BAKİYE                  ✓ TAMAMI ÖDENDİ                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  📋 ÖDEME GEÇMİŞİ                                                │
│  ┌──────────────┬─────────┬──────────────┐                      │
│  │  20.05.2026  │ Nakit   │  ₺3.000,00   │                      │
│  │  25.05.2026  │ Nakit   │  ₺27.000,00  │  ← BU ÖDEME           │
│  └──────────────┴─────────┴──────────────┘                      │
│  Toplam: 2 ödeme · ₺30.000,00                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🌙 KURBAN BAYRAMINIZA 11 GÜN KALDI                              │
│  5 Haziran 2026 · Bayramınız mübarek olsun                       │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Mini QR]  Belge No: TKR-2026-000100                            │
│  Doğrula    Hash: 7f3a2b1c... (otantisite kontrolü)              │
│             İşlemi Yapan: Tilbe Yönetici                          │
│             Yazdırılma: 25.05.2026 12:01                          │
│                                                                   │
│  KVKK: Bu belgedeki kişisel veriler 6698 sayılı kanun            │
│  kapsamında korunmaktadır. İade ve değişiklik koşulları           │
│  için www.tilbehome.com adresine başvurun.                       │
│                                                                   │
│  Tilbe Kurban'a güvendiğiniz için teşekkür ederiz. 🐂            │
└─────────────────────────────────────────────────────────────────┘
```

### Teknik Detaylar

**QR Kod Üretimi:**
- Server-side: `qrcode` npm paketi (zaten kullanılıyor mu kontrol et, yoksa `pnpm add qrcode @types/qrcode`)
- Ana QR data: `https://[domain]/tv/m/k/{kesimSirasi}` (kesim takip)
- Mini QR data: `https://[domain]/dekont-dogrula/{dekontNo}?h={hash}` (henüz route yok, future-proof)
- QR'lar SVG olarak HTML'e gömülür (yazdırma kalitesi)

**Hash Üretimi (basit otantisite):**
```ts
import crypto from "crypto";
const hash = crypto
  .createHash("sha256")
  .update(`${dekontNo}-${toplamTutar}-${tarih.toISOString()}-${SECRET}`)
  .digest("hex")
  .slice(0, 16);
```
`SECRET` = `.env`'de `DEKONT_HASH_SECRET` (yoksa `vapid_subject` veya random)

**Bayram Geri Sayım:**
- `modules/dashboard/lib/tema-tokens.ts`'deki `BAYRAM_TARIHI` sabitini kullan
- "X gün kaldı" / "Bugün Bayram Arifesi" / "Bayramınız Mübarek Olsun" durumlarına göre değişir

**Kurban Türü:**
- `Kurban` modelinde `tur` veya `cins` alanı var mı? Yoksa "Büyükbaş Kurban" varsayılan, koşullu render

**Etiket Rozeti (VIP vs.):**
- Müşteri `etiketler` alanını parse et, "VIP" varsa kırmızı/altın rozet göster

**Renkler:**
- Marka kırmızı: `#BD2C31` (vurgu)
- Aksan turuncu: `#FF6B2C` (mevcut, sadece toolbar)
- Metin: `#111`
- İkincil: `#666`
- Yeşil (tamamı ödendi): `#16a34a`
- Bayram emerald: `#10b981`

### CSS Yenilikleri

- A4'e uygun layout (mevcut A5'ten genişlet — daha çok bilgi var)
- Print'te tek sayfa (zorlama page-break-inside: avoid)
- Mobil görünüm: 580px max-width, responsive grid
- Tipografi: `Inter` veya system fonts (mevcut zaten iyi)
- Tabular nums her yerde
- QR kod için `aspect-ratio: 1` + min-size

### Side Endpoint

**Yeni route (gelecek için, şimdi 404 dönsün):**
- `app/dekont-dogrula/[dekontNo]/page.tsx` — `?h=hash` ile doğrulama sayfası
- Şimdilik basit "Belge geçerli ✓ TKR-2026-000100" sayfası, future ile genişlerse audit log'a düşür

### Mimari Yenilik

`app/api/tahsilat/dekont/[id]/route.ts` çok uzun olacak (~500+ satır HTML). Modülerleştir:

```
modules/tahsilat/dekont/
├── dekont-html.ts            (ana HTML üretici, modüler)
├── dekont-bolumler.ts        (Header / Bilgi / Odeme / Gecmis / Footer fonksiyonlari)
├── dekont-qr.ts              (QR SVG üretici wrapper)
├── dekont-hash.ts            (hash üretimi)
└── dekont-tema.ts            (renk + tipografi sabitleri)
```

API route bunları kullanır:
```ts
import { dekontHTMLOlustur } from "@/modules/tahsilat/dekont/dekont-html";

const html = await dekontHTMLOlustur({ odeme, ayarlar });
```

### PRE-WRITE GATE

```
DOSYALAR
- Eklenecek (5): modules/tahsilat/dekont/{html,bolumler,qr,hash,tema}.ts
- Eklenecek (1): app/dekont-dogrula/[dekontNo]/page.tsx (basit, future-proof)
- Güncellenecek: app/api/tahsilat/dekont/[id]/route.ts (~200 satır azalır, import eder)
- Paket: qrcode + @types/qrcode (yeni)
- .env.example: DEKONT_HASH_SECRET şablonu

TEST
1. pnpm tsc --noEmit + build temiz
2. Mevcut dekont URL'lerini aç -> yeni tasarım render olmalı
3. QR kod'u telefonla okut -> /tv/m/k/{kesimSirasi}'e gitmeli
4. Mini doğrulama QR -> /dekont-dogrula/TKR-... sayfasına gitmeli (200 dönmeli)
5. Yazdır -> A4'e tek sayfa sığmalı, print preview temiz
6. Mobilde dekont açılışı sorunsuz (responsive)
7. Bayram geri sayım doğru gün gösteriyor mu
8. VIP müşteri etiketi varsa rozet görünüyor mu
9. Birden fazla ödemesi olan müşteride geçmiş tablosu dolu mu
10. KUTSAL: TKR-2026-NNN oluştur -> yeni dekontla aç -> tutarlar doğru
```

### Commit Mesajı

```
feat(dekont): kurumsal profesyonel makbuz + QR + bayram + KVKK

Mevcut basit dekont profesyonel fatura standardina y\u00fckseltildi.
M\u00fc\u015fteri g\u00fcvenini artiran, dijital takip imkani sunan, yasal
gerekliliklere uyumlu kurumsal bir belge \u00fcretiliyor artik.

YEN\u0130 \u00d6ZELL\u0130KLER:

\ud83c\udf99 \u0130k\u0131 QR Kod:
- Ana QR (sa\u011f \u00fcst, b\u00fcy\u00fck): /tv/m/k/{kesimSirasi} canli takip
- Mini do\u011frulama QR (sol alt): /dekont-dogrula/{no}?h={hash}
  -> Otantisite kontrol\u00fc, sahtecilik koruma

\ud83d\udd10 Dijital M\u00fch\u00fcr:
- SHA-256 hash (dekontNo + tutar + tarih + secret)
- DEKONT_HASH_SECRET .env'e (yoksa fallback string)
- Belge sonunda hash g\u00f6r\u00fcn\u00fcr (otantisite)

\ud83d\uddd3\ufe0f Bayram Temasi:
- Geri sayim: \"11 g\u00fcn kaldi\" / \"Bayram Arifesi\" / \"Bayraminiz M\u00fcbarek\"
- BAYRAM_TARIHI sabitini kullaniyor (tema-tokens.ts)
- Emerald yesil aksan, ay/yildiz emoji vurgu

\ud83d\udcca \u00d6deme Ge\u00e7mi\u015fi Tablosu:
- T\u00fcm \u00f6demeler tarih s\u0131ral\u0131 listeli
- BU \u00d6DEME satiri vurgulu (turuncu border)
- Toplam ozeti altta

\u2696\ufe0f KVKK + Yasal:
- 6698 sayili kanun a\u00e7iklamasi (alt blok)
- \u0130ade ve de\u011fi\u015fiklik linkı (www.tilbehome.com)
- T\u00fcrk t\u00fcketici hukuku riskini kapatir

\ud83c\udf3f Etiket Rozetleri:
- VIP m\u00fc\u015fteri: altin/kirmizi rozet
- D\u00fczenli/Toplu/Akraba rozetleri (mevcut etiket sisteminden)

KOMPONENTLER (yeni dosya yapisi):
- modules/tahsilat/dekont/dekont-html.ts (ana HTML \u00fcretici)
- modules/tahsilat/dekont/dekont-bolumler.ts (5 b\u00f6l\u00fcm fonksiyonu)
- modules/tahsilat/dekont/dekont-qr.ts (QR SVG wrapper)
- modules/tahsilat/dekont/dekont-hash.ts (SHA-256 hash)
- modules/tahsilat/dekont/dekont-tema.ts (renk + tipografi sabitleri)
- app/api/tahsilat/dekont/[id]/route.ts (200+ satir azaldi, import ediyor)
- app/dekont-dogrula/[dekontNo]/page.tsx (basit dogrulama, future-proof)

PAKETLER:
- qrcode@1.5.4 + @types/qrcode (server-side SVG QR)

KUTSAL korundu:
- /api/tahsilat/odeme bozulmadi (dekont ayri route)
- TKR-2026-NNN format korundu, hash + ek alan
- formatPara() kullanimi (SPRINT 1 ile uyumlu)
- Print A4 tek sayfa sigiyor

Test:
- pnpm tsc --noEmit + build temiz
- TKR-2026-000100 dekontu yeni tasarimla render
- QR okutma: dogru sayfalara y\u00f6nlendirdi
- Mobile responsive: 580px max-width, taşma yok
- Print preview: A4 tek sayfa temiz
```

---

## 📋 Sırayla Yapılış

**Sen:**
1. Bu dosyayı kaydet
2. VS Code Claude Code sohbetinde, sırayla:
   - Önce SPRINT 1'i yapıştır → PRE-WRITE GATE raporu gelir → onay → commit
   - Sonra SPRINT 2'yi yapıştır → aynı şekilde
   - Sonra SPRINT 3'ü yapıştır → aynı şekilde
3. Her commit'ten sonra siteyi test et, sorun varsa söyle

**Tahmini süre:**
- SPRINT 1: 10 dakika
- SPRINT 2: 1.5-2 saat
- SPRINT 3: 2-3 saat
- Toplam: ~4-5 saat

**PWA ile çakışma var mı?**
- SPRINT 1 (para): hiç değil
- SPRINT 2 (borçlular): hiç değil
- SPRINT 3 (dekont): hiç değil

3'ü de PWA'dan tamamen bağımsız. PWA'yı paralel başlatabilirsin (başka VS Code penceresinde).
