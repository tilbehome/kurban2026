---
id: ARCH-C01065D32238
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# MASTER SPRINT — Ada Bereket Geçişi + Sistem İyileştirmeleri

> 10 Ağustos 2026 uyum notu: Bu belge Ada Bereket’e özel tarihsel sprint paketidir. Ürün geneli karar kaynağı değildir. Güncel ürün adı TilbeCore – Kurban Takip’tir; firma markası, müşteri verisi ve iletişim örnekleri yeni ana belgeye göre firma ayarı/snapshot olarak ele alınır ve ürün kimliğiyle karıştırılmaz.

**5 ayrı sprint, hepsi bağımsız commit. Her birinin başında PRE-WRITE GATE var — onay bekle, sonra yaz.**

| # | Sprint | Süre | Aciliyet |
|---|---|---|---|
| 🔴 0 | KRİTİK FIX — Bayram tarihi + Ada Bereket markası | 10-15 dk | **ACİL** |
| 🟢 1 | Para Format Düzeltmesi | 5-10 dk | Yüksek |
| 🟡 2 | Borçlular Sayfası Geliştirme | 1-2 sa | Orta |
| 🔴 3 | Kurumsal Tahsilat Makbuzu (gri tonlu, Ada Bereket) | 2-3 sa | Yüksek |
| 🟣 4 | PWA Ada Bereket Güncelleme (sadece PWA uygulanmışsa) | 15-30 dk | Düşük |

**Toplam: ~4-6 saat**, bayrama 2 gün var, hepsini bugün-yarın bitir.

---

## ⚠️ KRİTİK BİLGİ — BU SİSTEME YANLIŞ KURULMUŞ

**Sistem şu an "5 Haziran 2026" sanıyor — bu YANLIŞ.**

Diyanet onaylı doğru bilgiler:
- **Bayram Arifesi**: 26 Mayıs 2026 Salı
- **Kurban Bayramı 1. Gün**: **27 Mayıs 2026 Çarşamba**
- **2. Gün**: 28 Mayıs 2026 Perşembe
- **3. Gün**: 29 Mayıs 2026 Cuma
- **4. Gün**: 30 Mayıs 2026 Cumartesi

Bugün **25 Mayıs 2026 Pazartesi**, bayrama **2 gün** var (11 değil!).

---

## 🏢 FİRMA BİLGİLERİ (DOĞRU)

```
Marka Adı:    Ada Bereket Hayvancılık
Yazılım Adı:  TilbeCore Kurban Yönetim Sistemi (sadece footer'da görünür)
Slogan:       Güvenilir Hizmet, Bereketli Kazanç

Adres:        Harmantepe, Örgün Sokak No: 24
              54104 Adapazarı / Sakarya

Telefon:      <EXAMPLE_PHONE> (aynı zamanda WhatsApp)
E-posta:      <EXAMPLE_EMAIL>
Web:          adaberekethayvancilik.com.tr
Instagram:    @adaberekethayvancilik
TikTok:       @adaberekethayvancilik
YouTube:      @adaberekethayvancilik

Marka Rengi:  #DE0B1E (parlak kırmızı, logodan örneklendi)
Aksan:        #1a1a1a (siyah/koyu gri)
```

**Logo dosyaları** (`adabereket-icons.zip` içinde):
- `logo-tam.png` (1225×540 px) — header/dekont için yatay logo
- `icon-72.png` ... `icon-512.png` — PWA standart ikonlar
- `apple-icon-*.png` — iOS touch ikonlar
- `icon-maskable-*.png` — Android adaptive
- `favicon-*` + `favicon.ico` — browser favicon

---

# 🔴 SPRINT 0 — KRİTİK FIX (ÖNCE BU!)

## Amaç
Sistem doğru bilgilerle çalışsın: bayram 27 Mayıs, marka Ada Bereket, footer'da TilbeCore.

## Yapılacaklar

### 1. Bayram Tarihi Düzeltmesi

**Dosya**: `modules/dashboard/lib/tema-tokens.ts`

`BAYRAM_TARIHI` sabitini bul ve değiştir:

```ts
// ÖNCE
export const BAYRAM_TARIHI = new Date(2026, 5, 5); // 5 Haziran 2026 (YANLIŞ)

// SONRA
export const BAYRAM_TARIHI = new Date(2026, 4, 27); // 27 Mayıs 2026 Çarşamba
export const BAYRAM_ARIFE = new Date(2026, 4, 26);  // 26 Mayıs 2026 Salı
export const BAYRAM_SON_GUN = new Date(2026, 4, 30); // 30 Mayıs 2026 Cumartesi
```

**NOT**: JavaScript'te ay 0-indexli, yani Mayıs = 4.

`bayramTemasi()` fonksiyonunu kontrol et:
- Bugün ile bayram arası kalan gün sayısı doğru hesaplanıyor mu?
- "yakın" (4-14 gün), "çok-yakın" (1-3 gün), "bugün" (27-30 Mayıs) eşikleri doğru mu?
- Bayram süresi 4 gün (27-30 Mayıs) olarak güncellensin

### 2. Firma Bilgileri Update (DB seed)

**Dosya**: `prisma/seed.ts` veya doğrudan `ayarlar` tablosu

Mevcut firma_adi, firma_telefon, firma_adres ayarlarını **Ada Bereket** ile değiştir.

Şu kayıtlar `Ayar` tablosuna upsert edilsin:

```ts
const adabereketAyarlari = [
  { anahtar: "firma_adi", deger: "Ada Bereket Hayvancılık" },
  { anahtar: "firma_kisa_ad", deger: "Ada Bereket" },
  { anahtar: "firma_slogan", deger: "Güvenilir Hizmet, Bereketli Kazanç" },
  { anahtar: "firma_telefon", deger: "<EXAMPLE_PHONE>" },
  { anahtar: "firma_whatsapp", deger: "<EXAMPLE_PHONE>" },
  { anahtar: "firma_email", deger: "<EXAMPLE_EMAIL>" },
  { anahtar: "firma_web", deger: "adaberekethayvancilik.com.tr" },
  { anahtar: "firma_adres", deger: "Harmantepe, Örgün Sokak No: 24" },
  { anahtar: "firma_il", deger: "Sakarya" },
  { anahtar: "firma_ilce", deger: "Adapazarı" },
  { anahtar: "firma_posta_kodu", deger: "54104" },
  { anahtar: "firma_instagram", deger: "@adaberekethayvancilik" },
  { anahtar: "firma_tiktok", deger: "@adaberekethayvancilik" },
  { anahtar: "firma_youtube", deger: "@adaberekethayvancilik" },
  { anahtar: "marka_rengi", deger: "#DE0B1E" },
  { anahtar: "dekont_alt_yazi", deger: "Ada Bereket'e güvendiğiniz için teşekkür ederiz." },
  { anahtar: "yazilim_branding", deger: "Bu sistem TilbeCore Kurban Yönetim Sistemi tarafından sağlanmaktadır." },
];

// Her birini upsert et (mevcut anahtarı update, yoksa create)
for (const ayar of adabereketAyarlari) {
  await prisma.ayar.upsert({
    where: { anahtar: ayar.anahtar },
    update: { deger: ayar.deger },
    create: ayar,
  });
}
```

Migration veya seed scripti olarak çalıştır: `pnpm prisma db seed` veya doğrudan SQL.

### 3. Logo Dosyalarını Yerleştir

`adabereket-icons.zip` dosyasını aç, içeriği `public/icons/` altına kopyala (mevcut ikon varsa üzerine yaz):

```
public/icons/
├── icon-72.png ... icon-512.png          (8 standart)
├── apple-icon-120.png ... apple-icon-180.png (4 Apple)
├── icon-maskable-192.png + 512.png       (2 maskable)
├── favicon-16.png ... favicon-48.png     (3 favicon PNG)
├── favicon.ico                           (multi-size .ico)
└── logo-tam.png                          (1225×540 yatay logo)
```

`public/favicon.ico` (kök) da güncellensin.

### 4. Login Sayfası Branding

**Dosya**: `app/giris/page.tsx` veya AppShell üst kısmı

- Logo değiştir: `/icons/logo-tam.png` (yatay)
- Başlık: "Ada Bereket Hayvancılık" + slogan altta
- Footer: "TilbeCore Kurban Yönetim Sistemi ile güçlendirildi" (küçük, gri)

### 5. AppShell Header Branding

**Dosya**: `shared/components/AppShell.tsx` (veya benzeri)

Sidebar üstündeki "TilbeCore" logosunu değiştir:
- Logo: Ada Bereket boğa ikonu (`/icons/icon-192.png`) + "Ada Bereket" yazısı
- Açıklama: "Kurban 2026 · Yönetim"
- Sidebar kapalı (mini) mod'da: sadece ikon

### 6. Tüm "Tilbe" Referansları Tara

Repo genelinde grep at, **kullanıcıya görünen** her yerde değişiklik:

```bash
grep -r "Tilbe Kurban" --include="*.tsx" --include="*.ts" .
grep -r "Tilbe Yönetici" --include="*.tsx" --include="*.ts" .
grep -r "tilbehome.com" --include="*.tsx" --include="*.ts" .
```

Bulunanları **anlamına göre** güncelle:
- "Tilbe Kurban" → "Ada Bereket Hayvancılık" (marka olarak)
- "Tilbe Yönetici" → sadece DB'deki kullanıcının adı (varsayılan kullanıcı adı değişebilir)
- Site adı/title meta tag'ları → "Ada Bereket Kurban Bayramı 2026"

**ATLA**:
- Kod yorumları içinde "Tilbe" geçenler (yazılım adı)
- `TilbeOrange`, `TilbeRed` gibi token isimleri (kod sabiti)
- Footer'daki "TilbeCore" markası (oraya doğru şekilde yazılacak)

### 7. Meta Tags Güncelle

**Dosya**: `app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: {
    default: "Ada Bereket Hayvancılık · Kurban 2026",
    template: "%s · Ada Bereket",
  },
  description: "Ada Bereket Hayvancılık — Kurban Bayramı 2026 müşteri, kesim, tahsilat ve operasyon takibi. Güvenilir Hizmet, Bereketli Kazanç.",
  applicationName: "Ada Bereket Kurban",
  // ... mevcut diğer alanlar
};
```

## PRE-WRITE GATE (Sprint 0)

```
DOSYALAR
- Güncellenecek: modules/dashboard/lib/tema-tokens.ts (BAYRAM_TARIHI + yardımcılar)
- Güncellenecek: prisma/seed.ts veya yeni scripts/ada-bereket-seed.ts (ayarlar upsert)
- Eklenecek: public/icons/ altına 19 dosya (zip'ten kopya)
- Güncellenecek: public/favicon.ico
- Güncellenecek: app/giris/page.tsx (logo + branding)
- Güncellenecek: shared/components/AppShell.tsx (sidebar header logo + isim)
- Güncellenecek: app/layout.tsx (metadata)
- Taranacak: grep ile bulduklar "Tilbe Kurban" referansları

KUTSAL TESTİ
1. pnpm tsc --noEmit + build temiz
2. Login sayfası → Ada Bereket logosu görünüyor
3. Dashboard top bar → "2 gün kaldı" (5 Haziran değil!)
4. Sidebar bayram sayacı → 2 gün
5. /api/tahsilat/odeme akışı çalışıyor (TKR-2026-NNN)
6. Browser tab title → "Ada Bereket"
7. Favicon → boğa kafası

RAPOR
- Hangi dosyalar güncellendi
- Kaç "Tilbe" referansı tarandı, hangileri değişti hangileri kaldı
- DB'de kaç ayar upsert edildi
```

## Commit Mesajı (Sprint 0)

```
fix(branding): Ada Bereket markasi + dogru bayram tarihi (27 Mayis)

KRITIK HATA: Sistem bayram tarihini 5 Haziran 2026 olarak hesapliyordu.
Diyanet onayli dogru tarih 27 Mayis 2026 Carsamba. Bugun 25 Mayis,
bayrama 2 gun kala sistemin 11 gun gostermesi planlamayi alt-ust
ediyordu.

Ayrica yazilim Ada Bereket Hayvancilik adina kullanilacak, marka
"Tilbe Kurban" yerine "Ada Bereket Hayvancilik" olarak guncellendi.
Yazilim markasi "TilbeCore" sadece footer'da kalir (white-label
yaklasimi: musteri Ada Bereket gorur, alt bilgi olarak TilbeCore).

DEGISIKLIKLER:

Bayram tarihi (modules/dashboard/lib/tema-tokens.ts):
- BAYRAM_TARIHI: 2026-06-05 -> 2026-05-27
- Yeni: BAYRAM_ARIFE 2026-05-26
- Yeni: BAYRAM_SON_GUN 2026-05-30 (4 gun bayram)
- bayramTemasi() esikleri korundu, sadece sabit degisti

Firma bilgileri (ayarlar tablosu seed):
- firma_adi: "Ada Bereket Hayvancilik"
- firma_telefon: "<EXAMPLE_PHONE>" (WhatsApp ayni)
- firma_adres: "Harmantepe, Orgun Sokak No: 24, 54104 Adapazari/Sakarya"
- firma_email: "<EXAMPLE_EMAIL>"
- firma_web: "adaberekethayvancilik.com.tr"
- firma_slogan: "Guvenilir Hizmet, Bereketli Kazanc"
- marka_rengi: "#DE0B1E" (parlak kirmizi, logodan)
- yazilim_branding: "Bu sistem TilbeCore tarafindan saglanmaktadir"
- + 5 sosyal medya hesabi

Logo & branding:
- public/icons/ alti 19 yeni dosya (boga kafasi PWA ikonlari +
  logo-tam.png 1225x540 yatay logo)
- Login sayfasi: Ada Bereket logosu + slogan
- AppShell sidebar header: boga ikonu + "Ada Bereket" + "Kurban 2026"
- app/layout.tsx metadata: title + description Ada Bereket
- Browser favicon: boga kafasi

Marka taramasi:
- grep ile "Tilbe Kurban" / "Tilbe Yonetici" referanslari tarandi
- Kullaniciya gorunenler Ada Bereket'e cevrildi
- Kod sabitleri (TILBE_ORANGE token) korundu (referans degeri)
- Footer "TilbeCore" markasi korundu (tek satir, dogru yerde)

KUTSAL korundu:
- Tahsilat akisi TKR-2026-NNN dekont olusumu bozulmadi
- Mevcut musteri/kurban/hisse/odeme kayitlari etkilenmedi
- Auth + iron-session degismedi
- Tum sayfalar 200

Test:
- pnpm tsc --noEmit + build temiz
- Dashboard sayaci: "2 gun kaldi" gosteriyor
- Login: Ada Bereket logosu
- Browser tab: "Ada Bereket"
- TKR test: 2026-000101 olustu+silindi
```

---

# 🟢 SPRINT 1 — Para Format Düzeltmesi

## Sorun
`₺139.000` görünüyor, olması gereken `₺139.000,00` (muhasebe standardı, kuruşlu).

Sebep: `shared/lib/para.ts` → `minimumFractionDigits: 0`.

## Çözüm

### 1. `shared/lib/para.ts` Güncelle

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

### 2. Yeni Helper Ekle (`shared/lib/para.ts` sonuna)

```ts
/**
 * Büyük sayılar için kompakt format: dashboard KPI kartlarında kullanılır.
 * 25000000 → "₺25,0M"
 * 1500000 → "₺1,5M"
 * 500000 → "₺500K"
 * 50000 → "₺50.000,00" (formatPara'ya devreder)
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

### 3. KPI Kartlarını Güncelle

**Dosya**: `modules/dashboard/components/KpiKartlari.tsx`

```tsx
import { formatPara, formatParaKisa } from "@/shared/lib/para";

// ...

function formatDeger(kart: DashboardKpiKart): string {
  if (kart.birim === "₺") return formatParaKisa(kart.sayi);  // formatPara → formatParaKisa
  if (kart.birim === "%") return `%${kart.sayi}`;
  return kart.sayi.toLocaleString("tr-TR");
}
```

## PRE-WRITE GATE (Sprint 1)

```
DOSYALAR
- Güncellenecek: shared/lib/para.ts (2 satır mevcut + 15 satır yeni helper)
- Güncellenecek: modules/dashboard/components/KpiKartlari.tsx (import + 1 satır)

TEST
1. pnpm tsc --noEmit + build temiz
2. /musteriler/borclular → "₺139.000,00" görmeli
3. /api/tahsilat/dekont/{id} → "₺27.000,00" görmeli
4. Dashboard KPI kartları → "₺25,0M" "₺2,1M" (kartlara sığar)
5. TKR test
```

## Commit Mesajı (Sprint 1)

```
fix(para): formatPara her zaman 2 ondalik basamak + KPI kompakt format

SORUN: Borclular tablosunda \u20ba139.000 goruluyordu, dogru gosterim
\u20ba139.000,00. formatPara helper'inda minimumFractionDigits=0 yuzunden
tam sayilarda virgul ve kurus gizleniyordu. Muhasebe standardlarina
ters, tutarsiz: 62333.34 -> 62.333,34 ama 50000 -> 50.000.

COZUM:
- shared/lib/para.ts: TL/SAYI formatter minFraction 0->2
- Yeni formatParaKisa(): KPI kartlari icin
  * >=1M -> "M" suffix (\u20ba25,0M)
  * >=100K -> "K" suffix (\u20ba500K)
  * Kucukse formatPara'ya devreder
- KpiKartlari.tsx formatDeger: formatPara -> formatParaKisa (\u20ba birimi)

ETKI:
- Borclular tablosu: \u20ba139.000 -> \u20ba139.000,00 \u2705
- Dekont: \u20ba27.000 -> \u20ba27.000,00 \u2705
- Tahsilat/kasa/raporlar: tum tutarlar 2 basamakli \u2705
- Dashboard KPI: kompakt (\u20ba25M sigar) \u2705

KUTSAL korundu: yuvarla() matematik degismedi, tahsilat akisi temiz.
```

---

# 🟡 SPRINT 2 — Borçlular Sayfası Geliştirme

## Hedef
Mevcut borçlular sayfası 210 borçlu için yetersiz. Bayrama 2 gün kala kasiyer tek tek hatırlatma yapamaz — toplu eylemler + akıllı filtreler şart.

## Yeni Özellikler

1. **WhatsApp Toplu Hatırlatma** — filtrelenmiş telefonlu borçlulara FAZ 8 wizard'ını aç (sablon "Borç Hatırlatma Yumuşak" ön-seçili)
2. **Telefon filtresi** — Hepsi / Telefonlu / Telefonsuz
3. **Etiket filtresi** — VIP, Düzenli vs. multi-select dropdown
4. **Toplu seçim** — checkbox sütunu + "X seçili" göstergesi + toplu eylem barı
5. **Sticky özet bar** — toplam alacak / ortalama / en yüksek borç (sayfa altında sabit)
6. **Hover hızlı menü** — satır üzerinde 4 ikon: Tahsilat / WhatsApp / Detay / Hisse
7. **Tel: link** — telefon yanında ara butonu (mobilde dial)
8. **Satır tıklama** — müşteri detayına yönlendirme

## Mimari

```
modules/musteriler/components/borclular/
├── BorclularClient.tsx          (state, filtre, seçim orkestrasi)
├── BorclularUst.tsx             (filtreler + WhatsApp toplu butonu)
├── BorclularTablo.tsx           (tablo container)
├── BorcluSatir.tsx              (tek satır + hover state)
├── BorclularOzetBar.tsx         (sticky bottom)
└── ToplupEylemBar.tsx           (seçim aktif bar)

modules/musteriler/lib/
└── borclu.service.ts            (telefon + etiket filtreleri eklensin)
```

## UI Detayları

**Üst panel:**
```
[Sıralama: Borç | İsim]  [Min borç: Hepsi 10K 50K 100K]
[Telefon: Hepsi | Var | Yok]  [Etiket: VIP × Düzenli × +]
                                                    [📨 WhatsApp Toplu Hatırlatma]
```

**Tablo:**
```
[☐] Müşteri | Telefon | Hisse | Bedel | Ödenen | Kalan | [hover menü]
```

**Hover hızlı menü (sağ kenar):**
```
[💰 Tahsilat]  [💬 WA]  [👤 Detay]  [🐂 Hisse]
```

**Sticky özet bar (alt, sabit):**
```
14 borçlu (filtreli)  ·  Toplam: ₺18.010.291,34  ·  Ortalama: ₺1.286.449,38  ·  En yüksek: ₺17.000.958,00
```

**Toplu eylem bar (5+ seçili):**
```
[5 müşteri seçili]  [📨 WhatsApp]  [📊 Excel]  [İptal]
```

## API Güncellemeleri

`/api/musteriler/borclular?telefon=hepsi|var|yok&etiket=VIP,Duzenli` — yeni query parametreleri

## PRE-WRITE GATE (Sprint 2)

```
DOSYALAR
- Eklenecek: 6 component (modules/musteriler/components/borclular/)
- Güncellenecek: app/musteriler/borclular/page.tsx (Server → Client)
- Güncellenecek: app/api/musteriler/borclular/route.ts (yeni query param)
- Eklenecek: app/api/musteriler/borclular/excel-secili/route.ts (toplu excel)

TEST
1. pnpm tsc --noEmit + build temiz
2. Filtreler ayrı ayrı çalışıyor (min borç + telefon + etiket)
3. 5 müşteri seç → ToplupEylemBar görünüyor
4. WhatsApp toplu → /whatsapp/toplu?musteriIds=... yönlendirme
5. Hover'da hızlı menü ikonları görünüyor
6. Sticky özet bar filtreye göre dinamik
7. KUTSAL TKR test
```

## Commit Mesajı (Sprint 2)

```
feat(borclular): WhatsApp toplu + filtreler + toplu secim + sticky ozet

Mevcut borclular sayfasi 210 borclu icin yetersizdi. Bayrama 2 gun
kala kasiyer tek tek hatirlatma yapamaz. Bu commit ile saatlik isleri
dakikalara indiren arac seti eklendi.

YENI OZELLIKLER:
- WhatsApp Toplu Hatirlatma: filtrelenmis borclulara FAZ 8 wizard'ina
  yonlendirme, sablon "Borc Hatirlatma Yumusak" on-secili
- Telefon filtresi: Hepsi / Telefonlu / Telefonsuz
- Etiket filtresi: VIP/Duzenli vb. multi-select
- Toplu secim: checkbox + "X secili" + toplu eylem bar
- Sticky alt bar: toplam + ortalama + en yuksek borc
- Hover hizli menu: Tahsilat / WA / Detay / Hisse
- Tel: link (mobilde dial)
- Satira tikla -> detay

KOMPONENTLER (modules/musteriler/components/borclular/):
- BorclularClient, BorclularUst, BorclularTablo, BorcluSatir,
  BorclularOzetBar, ToplupEylemBar

API:
- GET /api/musteriler/borclular?telefon&etiket
- GET /api/musteriler/borclular/excel-secili?ids

KUTSAL korundu, WhatsApp FAZ 8 entegrasyonu, yeni paket yok.
```

---

# 🔴 SPRINT 3 — Kurumsal Tahsilat Makbuzu

## Hedef
Mevcut basit dekont → Image 2'de gösterilen **gri tonlu, profesyonel, A4 yazdırılabilir kurumsal makbuz**. Ada Bereket markası, gerçek müşteri verileri (DB'den), QR ile TV takip linki.

## Tasarım Anatomi (Image 2 Stili)

```
┌───────────────────────────────────────────────────────────────┐
│  [Ada Bereket Logo + Hayvancılık]    📍 Harmantepe, Örgün...   │
│  (yatay logo, sol blok)              📞 <EXAMPLE_PHONE>      │
│                                       ✉️  adabereket...@gmail   │
│                                       🌐 adaberekethayvancilik │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  TAHSİLAT MAKBUZU              [📄 MAKBUZ NO]                  │
│  Güvenilir Hizmet, Bereketli Kazanç    ABH-2026-00458         │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  📅 TAHSİLAT TARİHİ    🕐 SAAT    📍 ŞUBE/LOKASYON    👤 ALAN  │
│  27 Mayıs 2026         10:42      Merkez Kesim Alanı  Yönetici │
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐    │
│  │ 👤 MÜŞTERİ VE İŞLEM     │  │ 📊 ÖDEME ÖZETİ          │    │
│  │ BİLGİLERİ               │  │                          │    │
│  │                         │  │ Toplam Tutar  ₺35.000,00 │    │
│  │ Müşteri  : AHMET YILMAZ │  │ Tahsil Edilen ₺20.000,00 │    │
│  │ Telefon  : 0532 ... XX  │  │ Önceki Ödeme  ₺10.000,00 │    │
│  │ Kurban No: 58           │  │ ─────────────────────────│    │
│  │ Hisse    : 3. Hisse     │  │ Kalan Bakiye  ₺5.000,00  │    │
│  │ Türü     : Büyükbaş     │  │                          │    │
│  │ Ödeme    : Nakit        │  │ DURUM     [✓] ÖDEME ALINDI│    │
│  │ Açıklama : Kurban hisse │  │           KISMİ TAHSİLAT  │    │
│  └─────────────────────────┘  └─────────────────────────┘    │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────┐ ┌──────────────┐  │
│  │ 📷 MAKBUZ DOĞRULAMA  │  │ MÜŞTERİ İMZA │ │ YETKİLİ İMZA │  │
│  │ DİJİTAL GÖRÜNTÜLEME  │  │              │ │              │  │
│  │                       │  │   ✍️         │ │   ✍️         │  │
│  │  [QR KOD]             │  │              │ │              │  │
│  │                       │  │  ─────────── │ │  ─────────── │  │
│  │  Bu makbuzu QR ile    │  └──────────────┘ └──────────────┘  │
│  │  okutarak kurbanınızı │                                      │
│  │  canlı takip edin.    │  Bu makbuz taraflar arasında yapılan │
│  │                       │  tahsilatı gösterir, teminat veya    │
│  │  DOĞRULAMA KODU       │  sözleşme yerine geçmez.             │
│  │  ABH-58A4-2026        │                                      │
│  └──────────────────────┘                                      │
├───────────────────────────────────────────────────────────────┤
│  [🐂 mini logo orta]                                            │
│  🛡️ GÜVENİLİR     🐄 SAĞLIKLI     🏅 HELAL KESİM     🤝 MÜŞTERİ │
│     HİZMET           HAYVAN          GÜVENCESİ        MEMNUNİYETİ│
├───────────────────────────────────────────────────────────────┤
│  📍 Harmantepe...   📞 +90 536...   ✉️ adabereket...   🌐 .com.tr│
├───────────────────────────────────────────────────────────────┤
│         Bu makbuz TilbeCore Kurban Yönetim Sistemi              │
│              tarafından oluşturulmuştur.                        │
└───────────────────────────────────────────────────────────────┘
```

## Renk Paleti (Gri Tonlu — Image 2 Stili)

```
Primary:      #1a1a1a (siyah/koyu gri — başlıklar, satırlar)
Secondary:    #4a4a4a (gri — alt metin)
Tertiary:     #9a9a9a (açık gri — kenarlar, ipuçları)
Background:   #ffffff (beyaz)
Accent:       #e0e0e0 (çok açık gri — bölücüler)
Marka aksanı: #DE0B1E (sadece logo ve "ÖDEME ALINDI" check ikonu) — minimal kullan
Yeşil tick:   #16a34a (sadece onay ikonunda)
```

**Önemli**: Image 2'deki gibi gri tonlu, renkli vurgu **minimum**. Logo dışında renk neredeyse yok. Toner tasarrufu + kurumsal görünüm.

## Veriler DB'den (KRİTİK)

Mevcut tasarımlar **demo veri** kullanıyor. Gerçek implementasyonda:

| Tasarım Alanı | DB Kaynağı |
|---|---|
| Müşteri Adı | `Musteri.adSoyad` |
| Telefon | `Musteri.telefon` |
| Kurban No | `Kurban.kesimSirasi` (sistem otomatik) |
| Hisse | `Hisse.no` (1-7 arası) |
| Türü | `Kurban.tur` veya varsayılan "Büyükbaş" |
| Ödeme Türü | `Odeme.yontem` (nakit/havale/kart, ya da karma) |
| Açıklama | `Odeme.notlar` veya "Kurban hisse tahsilatı" |
| Toplam Tutar | `Hisse.hisseFiyati` |
| Tahsil Edilen (bu ödeme) | `Odeme.toplamTutar` |
| Önceki Ödeme | toplam tahsilat − bu ödeme |
| Kalan Bakiye | bedel − toplam tahsilat |
| Durum | `kalan === 0 ? "TAM" : "KISMİ TAHSİLAT"` |
| Tarih/Saat | `Odeme.tarih` (gerçek) |
| Şube | `Ayar.firma_sube_aktif` (varsayılan: "Merkez Kesim Alanı") |
| Tahsilatı Alan | `Kullanici.adSoyad` |
| Makbuz No | `Odeme.dekontNo` (yeni format: ABH-2026-XXXXX) |
| Doğrulama Kodu | dekontNo'dan türetilmiş hash (ilk 4 + son 4 karakter, vs.) |
| Firma bilgileri | `Ayar` tablosundan (Sprint 0'da güncellendi) |

## Makbuz No Formatı Değişikliği

`TKR-2026-NNN` → `ABH-2026-NNNNN` (Ada Bereket Hayvancılık)

**Dikkat**: Mevcut tahsilat dekontları (`TKR-2026-000099` vs.) korunmalı (kaydedilen makbuz no DB'de). Sadece yeni oluşturulanlar `ABH-` ile başlar.

**Strateji**:
- `Odeme.dekontNo` alanı zaten string — formatlı kaydediliyor
- Yeni oluşturma fonksiyonu (`dekontNoUret()`) prefix'i `Ayar`'dan okusun
- `Ayar.dekont_prefix = "ABH"` (sprint 0'da seed ile eklensin)
- Mevcut TKR-2026-... kayıtları olduğu gibi görünmeye devam etsin (data integrity)

## QR Kod

**Tek QR** kullanılacak (Image 2 ve 3'teki yapıya uygun):

```
QR İçeriği: https://adaberekethayvancilik.com.tr/tv/m/k/{kurban.kesimSirasi}

# Lokal geliştirmede:
QR İçeriği: http://192.168.1.89:3000/tv/m/k/{kurban.kesimSirasi}
```

Müşteri QR'ı okuttuğunda **direkt TV takip sayfasına** gider — kendi kurbanının kesim aşamasını görür. (FAZ 9.5'te bu sayfa zaten var.)

**Domain**: `Ayar.firma_web` veya `Ayar.public_url` (ortam değişkeni de olabilir).

## Doğrulama Kodu

Makbuz numarasından deterministik kod üret:
```
ABH-2026-00458 → ABH-58A4-2026
                    ^^^^
              hash(dekontNo + tarih)[:4]
```

Müşteri/Yönetici bu kodu `adaberekethayvancilik.com.tr/dogrula` sayfasına girip doğrulayabilir (route: `app/dogrula/page.tsx` — basit form + sonuç).

## Mimari (Modüler)

```
modules/tahsilat/dekont/
├── dekont-html.ts            (ana HTML üretici)
├── dekont-header.ts          (logo + firma bilgileri)
├── dekont-musteri-kart.ts    (müşteri ve işlem bilgileri)
├── dekont-ozet-kart.ts       (ödeme özeti)
├── dekont-qr-kart.ts         (QR + doğrulama)
├── dekont-imza.ts            (imza kutuları + yasal not)
├── dekont-rozet.ts           (4 değer rozeti)
├── dekont-footer.ts          (iletişim + TilbeCore)
├── dekont-tema.ts            (renk + tipografi sabitleri)
├── dekont-qr-uret.ts         (qrcode paket wrapper)
└── dekont-dogrulama-kodu.ts  (hash üretimi)

app/dogrula/page.tsx          (basit doğrulama formu + sonuç)
app/api/tahsilat/dekont/[id]/route.ts  (refaktor: import eder)
```

## Paket

```bash
pnpm add qrcode @types/qrcode
```

## PRE-WRITE GATE (Sprint 3)

```
DOSYALAR
- Eklenecek (10): modules/tahsilat/dekont/* tüm modüler dosyalar
- Eklenecek (1): app/dogrula/page.tsx (basit doğrulama)
- Güncellenecek: app/api/tahsilat/dekont/[id]/route.ts (~200 satır azalır)
- Güncellenecek: modules/tahsilat dekontNoUret() (prefix Ayar'dan)
- Paket: qrcode + @types/qrcode

TEST
1. pnpm tsc --noEmit + build temiz
2. Mevcut TKR-2026-NNN dekontları açılıyor (geriye uyumlu)
3. Yeni tahsilat → ABH-2026-NNNNN format alıyor
4. Dekont HTML render → Image 2 stiline benziyor
5. QR okutma → /tv/m/k/{kesimSirasi} sayfası açılıyor
6. Doğrulama kodu → /dogrula sayfasında çalışıyor
7. Print preview → A4 tek sayfa temiz
8. Veriler DB'den geliyor (demo veri YOK)
9. Mobil responsive görüntü temiz
10. KUTSAL TKR test
```

## Commit Mesajı (Sprint 3)

```
feat(dekont): kurumsal gri tonlu makbuz + QR TV takip + Ada Bereket

Mevcut basit dekont profesyonel kurumsal makbuza yukseltildi. Image 2
referans alindi (gri tonlu, A4 yazdirilabilir, toner tasarrufu).
Musteri QR kodu okutarak kurbanin TV takibini gerceklestirebiliyor.

YENI OZELLIKLER:

\ud83d\udcc4 Yeni Kurumsal Tasarim:
- Image 2 stili gri tonlu (toner tasarrufu)
- Ada Bereket logo (sol ust) + firma bilgileri (sag ust)
- Slogan: "Guvenilir Hizmet, Bereketli Kazanc"
- 4 meta bilgi (Tarih/Saat/Sube/Alan) ust ikon serit
- Iki kart layout: Musteri/Islem + Odeme Ozeti
- QR + Imza + Yasal not bolumleri
- 4 deger rozeti (Guvenilir/Saglikli/Helal/Memnuniyet)
- Footer iletisim + TilbeCore tek satir

\ud83d\udcf1 QR Kod:
- /tv/m/k/{kesimSirasi} -> canli kesim takip
- Musteri direkt kendi kurbanini izleyebiliyor

\ud83d\udd10 Dogrulama Kodu:
- ABH-58A4-2026 format (deterministik hash)
- /dogrula sayfasi: kod girisi -> dekont gosterimi
- Sahtelik koruma

\ud83d\udcdd Makbuz No Format Degisikligi:
- Eski: TKR-2026-NNN (korundu, mevcut kayitlar gorunur)
- Yeni: ABH-2026-NNNNN (Ada Bereket Hayvancilik)
- Ayar.dekont_prefix uzerinden konfig (default "ABH")

\ud83d\udcca Gercek Veriler (DB'den):
- Demo veri YOK, tum alanlar DB'den geliyor
- Musteri adi, telefon, kurban no, hisse, tarih -> Prisma
- Firma bilgileri -> Ayar tablosu (Sprint 0'da guncellendi)

MIMARI:
- modules/tahsilat/dekont/* 10 modüler dosya
- app/api/tahsilat/dekont/[id]/route.ts 200+ satir azaldi
- app/dogrula/page.tsx (basit dogrulama)

PAKETLER:
- qrcode@1.5.4 + @types/qrcode

KUTSAL korundu:
- /api/tahsilat/odeme bozulmadi
- Mevcut TKR-2026-NNN dekontlari erisilebilir
- formatPara (Sprint 1) ile uyumlu (\u20ba139.000,00)
- Tum sayfalar 200

Test:
- pnpm tsc --noEmit + build temiz
- TKR-2026-000100 -> yeni tasarimla render (eski no korundu)
- Yeni odeme -> ABH-2026-00101 (yeni format)
- QR okutma: /tv/m/k/{no} dogru sayfa
- Print: A4 tek sayfa
- Mobil responsive
```

---

# 🟣 SPRINT 4 — PWA Ada Bereket Güncelleme

**⚠️ SADECE PWA UYGULANMIŞSA YAP. PWA henüz Claude Code tarafında yapılmadıysa, PWA prompt'unu Ada Bereket bilgileriyle YENİDEN VER, Sprint 4'ü atla.**

## Hedef
PWA Tilbe markasıyla kuruldu, Ada Bereket'e geçir.

## Değişiklikler

### 1. `public/manifest.json`

```json
{
  "name": "Ada Bereket Hayvancılık · Kurban 2026",
  "short_name": "Ada Bereket",
  "description": "Ada Bereket Hayvancılık — Kurban Bayramı 2026 müşteri, kesim, tahsilat ve operasyon takibi.",
  "start_url": "/?pwa=1",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#DE0B1E",
  "lang": "tr",
  "categories": ["business", "productivity"],
  "icons": [
    { "src": "/icons/icon-72.png",  "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",  "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Tahsilat", "short_name": "Tahsilat", "url": "/tahsilat?pwa=1", "icons": [{"src":"/icons/icon-192.png","sizes":"192x192"}] },
    { "name": "TV Ekranı", "short_name": "TV", "url": "/tv?pwa=1", "icons": [{"src":"/icons/icon-192.png","sizes":"192x192"}] },
    { "name": "Müşteri Takip", "short_name": "Takip", "url": "/tv/m?pwa=1", "icons": [{"src":"/icons/icon-192.png","sizes":"192x192"}] }
  ]
}
```

### 2. İkonları Yenile

`adabereket-icons.zip` içinden `public/icons/` altına kopyala (zaten Sprint 0'da yapıldı, kontrol et).

### 3. Tema Rengi Güncelle

**Dosya**: `app/layout.tsx`

```tsx
export const viewport: Viewport = {
  themeColor: "#DE0B1E",  // Tilbe'nin #BD2C31'inden Ada Bereket'in #DE0B1E'ye
  // ...
};

export const metadata: Metadata = {
  // ...
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ada Bereket",  // Tilbe Kurban → Ada Bereket
  },
};
```

### 4. Push Notification Payload

**Dosya**: `shared/lib/web-push.ts` veya hook

Default başlık varsa "Tilbe Kurban" → "Ada Bereket" değişsin.

### 5. PWA Install Prompt

**Dosya**: `shared/components/PWAYukleBildirimi.tsx`

```tsx
<div className="font-semibold text-sm">Ada Bereket Uygulaması</div>
<div className="text-xs text-slate-600 mt-0.5">
  Telefonunuza yükleyin, kurbanınızı kolayca takip edin
</div>
```

İkon: `/icons/icon-192.png` (zaten doğru).

## PRE-WRITE GATE (Sprint 4)

```
DOSYALAR
- Güncellenecek: public/manifest.json (Ada Bereket bilgileri)
- Güncellenecek: app/layout.tsx (themeColor, appleWebApp)
- Güncellenecek: shared/lib/web-push.ts (varsayılan başlık)
- Güncellenecek: shared/components/PWAYukleBildirimi.tsx (metin)
- Kopyalanacak: public/icons/* (Sprint 0'da yapıldı, kontrol)

TEST
1. Chrome DevTools > Manifest → Ada Bereket görünüyor, hatasız
2. Application > Service Workers → SW active
3. Lighthouse PWA score korundu (≥90)
4. Mobil "Ana ekrana ekle" → Ada Bereket adıyla yüklendi
5. Test push → "Ada Bereket" başlıkla geldi
6. PWA install prompt → "Ada Bereket Uygulaması" metni
```

## Commit Mesajı (Sprint 4)

```
fix(pwa): Ada Bereket markasi (Tilbe -> Ada Bereket)

PWA Tilbe markasiyla kurulmustu, Ada Bereket'e gecirildi. Manifest,
tema rengi, push notification baslik, install prompt metni
guncellendi. Ikonlar Sprint 0'da yenilenmisti.

DEGISIKLIKLER:
- manifest.json: name/short_name/description -> Ada Bereket
- theme_color: #BD2C31 -> #DE0B1E (Ada Bereket logo kirmizisi)
- app/layout.tsx viewport.themeColor + appleWebApp.title
- web-push varsayilan baslik: Ada Bereket
- PWA Install Prompt metin: Ada Bereket

KUTSAL korundu, SW logic'i bozulmadi.
```

---

# 📋 ÖZET — Yapılış Sırası

```
1. SPRINT 0 yap (KRİTİK) → onayla → commit
2. SPRINT 1 yap (Para)   → onayla → commit
3. SPRINT 2 yap (Borçlu) → onayla → commit
4. SPRINT 3 yap (Dekont) → onayla → commit
5. SPRINT 4 yap (PWA)    → onayla → commit (eğer PWA varsa)
```

Her sprint **bağımsız commit**. Çökerse rollback kolay, diğerleri etkilenmez.

**Beklenen toplam süre**: 4-6 saat. Bayrama 2 gün var, bugün yarın bitir.

## VS Code Claude Code'a Verme Tekniği

Her sprint'i tek tek kopyala-yapıştır. Claude Code:
1. Önce **PRE-WRITE GATE** raporu verecek
2. Sen "onaylıyorum, devam" dediğinde yazmaya başlayacak
3. Bitince commit önerecek
4. Commit mesajı şablonu yukarıda hazır

**Bir sprint bitmeden diğerine geçme.** Her commit sonrası siteyi test et, sorun varsa söyle.
