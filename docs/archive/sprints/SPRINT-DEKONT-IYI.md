---
id: ARCH-EA9420BC170E
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 💳 SPRINT-DEKONT-İYİ — Dekont + Tahsilat Form İyileştirmesi

**Hedef:** 3 küçük ama operasyonel değeri yüksek iyileştirme:

1. **Dekonta ÖDEME YÖNTEMİ alanı** (Nakit/Havale/Kart/Karışık)
2. **Dekonta TUTAR YAZIYLA** (Yirmi yedi bin Türk Lirası)
3. **Tahsilat formu akışı:** Yeni sekmeyi otomatik açma — kaydet sonrası aynı sayfada kal, "Dekont Yazdır" butonu opsiyonel göster

**Bayram günü faydası:**
- Müşteri "ben dekont almıyorum" derse hızlı geçilir
- Almak isteyen için tek tık yazdır
- Yazıyla tutar: yasal/muhasebe görünümü daha profesyonel
- Ödeme yöntemi tek satırda net görünür

**Süre tahmini: ~45 dakika**

---

## ⛔ DOKUNMA

- KUTSAL `/api/tahsilat/odeme` endpoint mantığı
- Schema (hiçbir alan eklenmiyor — `Odeme.yontem` zaten var)
- Mevcut dekont layout, renkler, font yapısı
- Header, footer, QR kart yapısı
- SPRINT-P0 atomic counter
- Audit log akışı

**Sadece:**
- `dekont-ozet-kart.ts` içine 2 satır
- `OdemeFormu.tsx` akış değişikliği
- Yeni helper: `tutar-yaziyla.ts`

---

## 📋 İŞ 1 — TUTAR YAZIYLA HELPER

Yeni dosya: `shared/lib/tutar-yaziyla.ts`

```ts
/**
 * Sayıyı Türkçe okunuşa çevirir.
 * Örnekler:
 *   27000 → "Yirmi yedi bin Türk Lirası"
 *   1500.50 → "Bin beş yüz Türk Lirası elli kuruş"
 *   100 → "Yüz Türk Lirası"
 *   0 → "Sıfır Türk Lirası"
 */

const BIRLER = [
  "",
  "bir",
  "iki",
  "üç",
  "dört",
  "beş",
  "altı",
  "yedi",
  "sekiz",
  "dokuz",
];

const ONLAR = [
  "",
  "on",
  "yirmi",
  "otuz",
  "kırk",
  "elli",
  "altmış",
  "yetmiş",
  "seksen",
  "doksan",
];

const BASAMAK = ["", "bin", "milyon", "milyar", "trilyon"];

function ucBasamak(n: number): string {
  if (n === 0) return "";
  const yuz = Math.floor(n / 100);
  const onlu = Math.floor((n % 100) / 10);
  const birli = n % 10;

  const parcalar: string[] = [];

  if (yuz === 1) parcalar.push("yüz");
  else if (yuz > 1) parcalar.push(BIRLER[yuz] + " yüz");

  if (onlu > 0) parcalar.push(ONLAR[onlu]);
  if (birli > 0) parcalar.push(BIRLER[birli]);

  return parcalar.join(" ");
}

export function tutariYaziyaCevir(tutar: number): string {
  if (tutar === 0) return "Sıfır Türk Lirası";
  if (tutar < 0) return "Eksi " + tutariYaziyaCevir(-tutar);

  // Kuruş ayrımı
  const tamSayi = Math.floor(tutar);
  const kurus = Math.round((tutar - tamSayi) * 100);

  // Tam sayıyı 3'lü gruplara böl (sondan başa)
  const gruplar: number[] = [];
  let kalan = tamSayi;
  while (kalan > 0) {
    gruplar.push(kalan % 1000);
    kalan = Math.floor(kalan / 1000);
  }

  // Her grubu Türkçe'ye çevir + basamak ekle
  const parcalar: string[] = [];
  for (let i = gruplar.length - 1; i >= 0; i--) {
    const grup = gruplar[i]!;
    if (grup === 0) continue;

    // "Bir bin" yerine sadece "bin"
    if (i === 1 && grup === 1) {
      parcalar.push("bin");
    } else if (grup === 1 && i === 0) {
      parcalar.push("bir");
    } else {
      parcalar.push(ucBasamak(grup) + (i > 0 ? " " + BASAMAK[i] : ""));
    }
  }

  let sonuc = parcalar.join(" ").trim() + " Türk Lirası";

  // İlk harfi büyük
  sonuc = sonuc.charAt(0).toUpperCase() + sonuc.slice(1);

  // Kuruş varsa ekle
  if (kurus > 0) {
    const kurusYazi = ucBasamak(kurus);
    sonuc += " " + kurusYazi + " kuruş";
  }

  return sonuc;
}
```

### Test örnekleri:
```ts
tutariYaziyaCevir(27000)    // "Yirmi yedi bin Türk Lirası"
tutariYaziyaCevir(1500.50)  // "Bin beş yüz Türk Lirası elli kuruş"
tutariYaziyaCevir(100)      // "Yüz Türk Lirası"
tutariYaziyaCevir(50000)    // "Elli bin Türk Lirası"
tutariYaziyaCevir(125750)   // "Yüz yirmi beş bin yedi yüz elli Türk Lirası"
```

İsteğe bağlı: `scripts/tutar-yaziyla-test.ts` ile birkaç senaryo test et.

---

## 📋 İŞ 2 — DEKONT ÖZET KARTI: ÖDEME YÖNTEMİ + TUTAR YAZIYLA

`modules/tahsilat/dekont/dekont-ozet-kart.ts` dosyasını güncelle:

### A) Interface'e yeni alan ekle

```ts
export interface OzetKartVerisi {
  hisseBedeli: number;
  oncekiOdemeler: number;
  nakit: number;
  havale: number;
  kart: number;
  toplam: number;
  kalan: number;
  notlar: string;

  // 🆕 Ödeme yöntemi (DB'deki Odeme.yontem field'ı)
  // "nakit" | "havale" | "kart" | "karisik"
  yontem: string;
}
```

### B) Yöntem etiketi helper

Dosyanın üstüne (import'lardan sonra):

```ts
function yontemEtiket(y: string): string {
  switch (y.toLowerCase()) {
    case "nakit": return "NAKİT";
    case "havale": return "HAVALE / EFT";
    case "kart": return "KREDİ / BANKA KARTI";
    case "karisik": return "KARIŞIK ÖDEME";
    default: return y.toUpperCase();
  }
}
```

### C) `dekontOzetKartHtml()` fonksiyonunu güncelle

`tutariYaziyaCevir` import'unu ekle:

```ts
import { tutariYaziyaCevir } from "@/shared/lib/tutar-yaziyla";
```

Şu anki HTML'de `<div class="dk-ozet-toplam">` bloğundan SONRA, `<div class="dk-ozet-kalan ...">` bloğundan ÖNCE şu 2 yeni bloğu ekle:

```ts
    <div class="dk-ozet-toplam">
      <span>BU ÖDEME TOPLAM</span>
      <span>${formatPara(o.toplam)}</span>
    </div>

    <!-- 🆕 ÖDEME YÖNTEMİ -->
    <div class="dk-ozet-yontem">
      <span>ÖDEME YÖNTEMİ</span>
      <span>${e(yontemEtiket(o.yontem))}</span>
    </div>

    <!-- 🆕 TUTAR YAZIYLA -->
    <div class="dk-ozet-yaziyla">
      <span class="dk-ozet-yaziyla-baslik">YAZIYLA:</span>
      <span class="dk-ozet-yaziyla-deger">${e(tutariYaziyaCevir(o.toplam))}</span>
    </div>

    <div class="dk-ozet-kalan ${tamamiOdendi ? "dk-odendi" : "dk-borc"}">
      ...
```

### D) CSS ekle

`DEKONT_OZET_KART_CSS` constant'ının sonuna:

```css
.dk-ozet-yontem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${DEKONT_RENKLERI.tertiary};
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
}

.dk-ozet-yaziyla {
  padding: 8px 0;
  font-size: 9.5px;
  line-height: 1.4;
  color: ${DEKONT_RENKLERI.secondary};
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-ozet-yaziyla-baslik {
  display: inline;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${DEKONT_RENKLERI.tertiary};
  margin-right: 6px;
}
.dk-ozet-yaziyla-deger {
  font-style: italic;
}
```

### E) `dekont-html.ts` interface'i güncelle

`DekontHtmlGirdisi` interface'inde zaten `yontem` yok — ekle:

```ts
export interface DekontHtmlGirdisi {
  // ... mevcut alanlar

  // Tutarlar
  hisseBedeli: number;
  oncekiOdemeler: number;
  nakit: number;
  havale: number;
  kart: number;
  toplam: number;
  kalan: number;
  notlar: string;
  yontem: string; // 🆕 EKLE

  // QR
  qrDataUrl: string;
  qrHedefUrl: string;
}
```

Ve `dekontHtmlUret()` içinde `ozetKart` çağrısına `yontem` parametresini ekle:

```ts
const ozetKart = dekontOzetKartHtml({
  hisseBedeli: d.hisseBedeli,
  oncekiOdemeler: d.oncekiOdemeler,
  nakit: d.nakit,
  havale: d.havale,
  kart: d.kart,
  toplam: d.toplam,
  kalan: d.kalan,
  notlar: d.notlar,
  yontem: d.yontem, // 🆕 EKLE
});
```

### F) Dekont API endpoint'inde yontem aktar

`app/api/tahsilat/dekont/[id]/route.ts` (veya benzer endpoint) dekont verisini hazırlarken:

```ts
const odeme = await prisma.odeme.findUnique({
  where: { id },
  include: { hisse: { ... }, kullanici: ... },
});

// dekontHtmlUret() çağrısına yontem ekle:
const html = dekontHtmlUret({
  // ... mevcut alanlar
  yontem: odeme.yontem, // ✅ DB'den gelen değer
});
```

`odeme.yontem` DB'de zaten "nakit" / "havale" / "kart" / "karisik" değerlerinden birini içeriyor (SPRINT-P0'da kontrol edildi).

---

## 📋 İŞ 3 — TAHSİLAT FORMU AKIŞ DEĞİŞİKLİĞİ

`app/tahsilat/musteri/[id]/OdemeFormu.tsx` dosyasını güncelle:

### A) Yeni state'ler ekle

Component'in başına (mevcut state'lerin yanına):

```ts
// 🆕 Son ödeme bilgileri — başarılı kayıttan sonra "Dekont Yazdır" butonu için
const [sonOdeme, setSonOdeme] = useState<{
  odemeId: number;
  dekontNo: string;
  toplam: number;
} | null>(null);
```

### B) `handleSubmit` fonksiyonunu güncelle

`window.open()` çağrısını **KALDIR**, `router.push()` çağrısını **KALDIR**.

Yerine:

```ts
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (toplam <= 0) {
    toast.error("En az bir tutar girin.");
    return;
  }

  if (fazla) {
    const onay = window.confirm(
      `Girilen tutar (${formatPara(toplam)}) kalan bakiyeden (${formatPara(
        kalanBakiye,
      )}) fazla. Devam edilsin mi?`,
    );
    if (!onay) return;
  }

  startTransition(async () => {
    try {
      const yanit = await fetch("/api/tahsilat/odeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteriId,
          hisseIds: hisseler.map((h) => h.id),
          nakit: parsePara(nakit),
          havale: parsePara(havale),
          kart: parsePara(kart),
          notlar: notlar.trim() || undefined,
          dagitim,
        }),
      });
      const sonuc = (await yanit.json()) as {
        basarili: boolean;
        dekontNo?: string;
        odemeIds?: number[];
        toplam?: number;
        hata?: string;
      };
      if (!yanit.ok || !sonuc.basarili) {
        throw new Error(sonuc.hata ?? "Ödeme alınamadı");
      }

      // 🆕 Toast — sade ve net
      toast.success(`✓ Ödeme alındı · ${sonuc.dekontNo}`, {
        duration: 3000,
      });

      // 🆕 Son ödeme bilgisini state'e yaz (yazdır butonu için)
      if (sonuc.odemeIds?.[0] && sonuc.dekontNo) {
        setSonOdeme({
          odemeId: sonuc.odemeIds[0],
          dekontNo: sonuc.dekontNo,
          toplam: sonuc.toplam ?? toplam,
        });
      }

      // 🆕 Form alanlarını temizle (yeni tahsilat için hazır)
      setNakit("");
      setHavale("");
      setKart("");
      setNotlar("");

      // Sayfayı yenile (kalan bakiye güncellensin)
      router.refresh();

      // ❌ KALDIRILDI: window.open() artık otomatik açmıyor
      // ❌ KALDIRILDI: router.push() artık başka sayfaya gitmiyor
    } catch (e) {
      const m = e instanceof Error ? e.message : "Hata";
      toast.error(m);
    }
  });
}
```

### C) "Son Ödeme" panelini render et

Submit butonunun **üstüne** veya **altına** ekle:

```tsx
{/* 🆕 Son başarılı ödeme paneli — opsiyonel yazdır butonu */}
{sonOdeme && (
  <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600 shrink-0" />
          <span className="font-semibold text-green-900">
            Ödeme Alındı
          </span>
        </div>
        <div className="text-sm text-green-700 mt-1 font-mono">
          {sonOdeme.dekontNo} · {formatPara(sonOdeme.toplam)}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(`/api/tahsilat/dekont/${sonOdeme.odemeId}`, "_blank")
          }
          className="gap-1.5"
        >
          🖨️ Dekont Yazdır
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSonOdeme(null)}
        >
          ✕ Kapat
        </Button>
      </div>
    </div>
  </div>
)}

<Button
  type="submit"
  disabled={bekleniyor || toplam <= 0}
  size="lg"
  className="w-full"
>
  {bekleniyor ? "Ödeme alınıyor..." : "✓ Ödemeyi Al"}
</Button>
```

**ÖNEMLİ değişiklikler:**
- ✅ Buton metni: "✓ Ödemeyi Al ve Dekont Bas" → **"✓ Ödemeyi Al"** (dekont opsiyonel)
- ✅ Başarı sonrası sayfa **değişmiyor** (router.push kaldırıldı)
- ✅ Dekont **otomatik açılmıyor** (window.open kaldırıldı)
- ✅ Yeşil panel görünür, **"Dekont Yazdır" butonu** opsiyonel
- ✅ Form temizlenir → aynı müşteriye **yeni tahsilat** alabilirsin
- ✅ `router.refresh()` ile kalan bakiye güncellenir

---

## ✅ TEST ADIM ADIM

```bash
# 1. Build
pnpm tsc --noEmit
pnpm build

# 2. Dev
pnpm dev
```

### Tarayıcı Testi

1. `/tahsilat` → bir müşteri seç → tahsilat sayfası açıl
2. **Senaryo A — Hızlı geçiş:**
   - 1.000 TL nakit gir
   - "Ödemeyi Al" bas
   - ✅ Toast: "Ödeme alındı · ABH-2026-NNN"
   - ✅ Sayfa **değişmez**, **yeşil panel** görünür
   - ✅ Form temizlenir
   - ✅ Yeşil panelde "Dekont Yazdır" butonu var
   - ✅ "✕ Kapat" butonu var
3. **"Kapat"** bas → panel kapanır, kalan bakiye güncel
4. **Senaryo B — Dekontla:**
   - 500 TL havale gir
   - "Ödemeyi Al" bas
   - **"🖨️ Dekont Yazdır"** bas → yeni sekmede dekont açılır
   - Dekont'ta kontrol et:
     - ✅ **"ÖDEME YÖNTEMİ"** satırı: "HAVALE / EFT"
     - ✅ **"YAZIYLA:"** satırı: "Beş yüz Türk Lirası"
5. **Senaryo C — Karışık ödeme:**
   - 200 TL nakit + 300 TL kart gir (toplam 500)
   - Ödemeyi Al → Yazdır
   - ✅ Dekont'ta: "ÖDEME YÖNTEMİ: KARIŞIK ÖDEME"
   - ✅ "YAZIYLA: Beş yüz Türk Lirası"

### KUTSAL Kontrolü

- [ ] `/api/tahsilat/odeme` çalışıyor → ABH-2026-NNN
- [ ] Atomic counter çalışıyor (SPRINT-P0 koruma)
- [ ] Fazla tahsilat hâlâ engelli
- [ ] Kasa hareketi oluşuyor
- [ ] Audit log yazılıyor
- [ ] Eski dekontlar (ABH-2026-000001 ... 000012) hâlâ açılabilir (yontem field DB'de var)

---

## 📊 RAPOR FORMATI

Bittiğinde:

```
✅ Commit SHA: ...
✅ pnpm tsc + build temiz

İŞ 1 (Tutar Yazıyla):
✅ shared/lib/tutar-yaziyla.ts oluşturuldu
✅ Test: 27000 → "Yirmi yedi bin Türk Lirası"
✅ Test: 1500.50 → "Bin beş yüz Türk Lirası elli kuruş"

İŞ 2 (Dekont):
✅ OzetKartVerisi.yontem alanı eklendi
✅ "ÖDEME YÖNTEMİ" satırı dekontta görünüyor
✅ "YAZIYLA:" satırı dekontta görünüyor
✅ CSS uyumlu (A4 yazdırma)
✅ Eski dekontlar bozulmadı

İŞ 3 (Form akış):
✅ Submit sonrası sayfa değişmiyor
✅ window.open otomatik açma KALDIRILDI
✅ Yeşil "Ödeme Alındı" paneli görünüyor
✅ "Dekont Yazdır" butonu opsiyonel
✅ Form temizleniyor
✅ Kalan bakiye refresh ile güncelleniyor

KUTSAL:
✅ ABH-2026-000XXX üretiliyor (sıralı)
✅ Atomic counter çalışıyor
✅ Karışık ödeme yöntemi doğru gösteriliyor
```

---

## 🎯 BAYRAM GÜNÜ FAYDA SENARYOLARI

### Senaryo 1: "Acele eden müşteri"
```
Müşteri: 10K TL nakit verir
Kasiyer: Tahsilatı Al → ABH-2026-013 başarılı
Müşteri: "Hemen gitmem lazım dekontu Whatsapp'tan yollar mısın?"
Kasiyer: "Tabi" → sayfa zaten açık → kapat
       Dekontu mesajlaşmadan whatsapp ile gönderir
```
✅ **Hızlı**, müşteri 5 saniye sonra çıkar.

### Senaryo 2: "Dekont isteyen müşteri"
```
Müşteri: 5K TL kart + 3K TL nakit verir (karışık)
Kasiyer: Tahsilatı Al → ABH-2026-014 başarılı
Kasiyer: "Dekont Yazdır" basar
Dekont:
  ÖDEME YÖNTEMİ: KARIŞIK ÖDEME
  YAZIYLA: Sekiz bin Türk Lirası
  Müşteri imzalar → çıkar
```
✅ **Profesyonel**, yasal/muhasebe için sağlam.

### Senaryo 3: "Aynı müşteriye 2. ödeme"
```
Müşteri: 2K TL kapora bırakır → dekont 1
        15 dakika sonra geri gelir
        "Kalan 23K TL'yi de havale yapayım"
Kasiyer: Aynı sayfada → 23K havale gir → Tahsilatı Al
        Yeşil panel → dekont 2 yazdır
```
✅ Sayfa değişimi yok, **hızlı seri tahsilat**.

---

## ⏰ SÜREÇ

**Süre: ~45 dakika**

İş sırası:
1. `tutar-yaziyla.ts` (10 dk)
2. `dekont-ozet-kart.ts` güncelleme (10 dk)
3. `dekont-html.ts` interface + endpoint (5 dk)
4. `OdemeFormu.tsx` rewrite (15 dk)
5. Test (5 dk)

---

## 🚨 ÖNEMLİ NOT

Bu sprint sadece **2 dosya rewrite + 1 yeni dosya**. Schema değişikliği YOK, migration YOK. Çok güvenli, çok hızlı.

**Yapma:**
- Schema'da yeni field ekleme (gereksiz, `Odeme.yontem` zaten var)
- Yeni endpoint yazma (mevcut dekont endpoint'i yeterli)
- Dekont layout değiştirme (zaten güzel)
