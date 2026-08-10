# 💰 SPRINT-10 — KASA TESLİM RAPORU (A4 YAZDIRMA)

**Amaç:** Bayram günü Burhan Bey muhasebe başında oturacak. Gün sonu **tüm tahsilatları, ödeme yöntemlerini, kasa hareketlerini, dekontları** tek bir A4 raporda yazdırıp muhasebe arkadaşına teslim edecek.

Bu sayfa SPRINT-8'deki "Kesim Listesi Yazdır" gibi yazdırılabilir bir rapor olacak. Tek tıkla yazdır, A4'e otur, fişe çevir, teslim et.

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- `/api/tahsilat/odeme` — KUTSAL
- `Odeme`, `KasaHareketi` schema
- Mevcut kasa sayfaları (`/kasa/*`)
- Dashboard kasa kartı (`KasaDurumuKart`)
- `dashboard.service.ts` mevcut fonksiyonları

**Bu sprint sadece OKUMA yapar, hiçbir yere yazmaz. Yeni 1 sayfa + 1 component + 1 sidebar linki.**

---

## 📋 İŞ 1 — YENİ SAYFA: `app/raporlar/kasa-teslim/page.tsx`

Yapısı:
- Server component
- `aktifOturum` + `izinKontrol(oturum, "kasa.goruntule")` kontrol
- Yetki yoksa `/giris?yonlendir=...`
- Prisma'dan **gün bazlı tüm veriler** çekilecek

**Sorgulanacak veriler (URL query'den `?tarih=2026-05-27` alır, yoksa bugün):**

```ts
const tarih = sayfa.searchParams?.tarih
  ? new Date(sayfa.searchParams.tarih)
  : new Date();

const gunBaslangic = new Date(tarih);
gunBaslangic.setHours(0, 0, 0, 0);
const gunSonu = new Date(tarih);
gunSonu.setHours(23, 59, 59, 999);

// 1) GÜN İÇİNDEKİ TÜM ÖDEMELER
const odemeler = await prisma.odeme.findMany({
  where: {
    silindiMi: false,
    tarih: { gte: gunBaslangic, lte: gunSonu },
  },
  orderBy: { tarih: "asc" },
  select: {
    id: true,
    dekontNo: true,
    tarih: true,
    nakit: true,
    havale: true,
    kart: true,
    toplamTutar: true,
    yontem: true,
    iptal: true,
    iptalSebep: true,
    iptalTarihi: true,
    notlar: true,
    kullanici: { select: { adSoyad: true, kullaniciAdi: true } },
    hisse: {
      select: {
        no: true,
        kurban: { select: { kesimSirasi: true } },
        musteri: { select: { adSoyad: true, telefon: true } },
      },
    },
  },
});

// 2) GÜN İÇİNDEKİ KASA HAREKETLERİ
const kasaHareketleri = await prisma.kasaHareketi.findMany({
  where: {
    silindiMi: false,
    tarih: { gte: gunBaslangic, lte: gunSonu },
  },
  orderBy: { tarih: "asc" },
  select: {
    id: true,
    tip: true,
    tutar: true,
    yontem: true,
    aciklama: true,
    tarih: true,
    kullanici: { select: { adSoyad: true } },
  },
});

// 3) FİRMA AYARLARI
const firmaAyari = await prisma.ayar.findUnique({ where: { anahtar: "firma_adi" } });
const firmaAdres = await prisma.ayar.findUnique({ where: { anahtar: "firma_adres" } });
const firmaTelefon = await prisma.ayar.findUnique({ where: { anahtar: "firma_telefon" } });

// Bunları aşağıdaki client component'e prop olarak geçir.
```

Sayfa Client'ı render eder: `<KasaTeslimRaporuClient odemeler={...} kasaHareketleri={...} firma={...} tarih={tarih.toISOString()} />`

---

## 📋 İŞ 2 — CLIENT COMPONENT: `modules/raporlar/components/KasaTeslimRaporuClient.tsx`

Yapısı:
- "use client"
- Yazdırma butonu üstte (print:hidden)
- Tarih seçici (date input → URL query güncelleyip refresh)
- A4 yazdırma sayfası

### ⚙️ HESAPLANACAK ÖZETLER

```ts
// Aktif (iptal değil) ödemeler
const aktifOdemeler = odemeler.filter(o => !o.iptal);
const iptalOdemeler = odemeler.filter(o => o.iptal);

// Yöntem bazlı toplam
const toplamNakit = aktifOdemeler.reduce((s, o) => s + o.nakit, 0);
const toplamHavale = aktifOdemeler.reduce((s, o) => s + o.havale, 0);
const toplamKart = aktifOdemeler.reduce((s, o) => s + o.kart, 0);
const toplamTahsilat = toplamNakit + toplamHavale + toplamKart;

// İptal toplamı
const toplamIptal = iptalOdemeler.reduce((s, o) => s + o.toplamTutar, 0);

// Kasa hareketleri
const giderler = kasaHareketleri.filter(h => h.tip === "gider");
const toplamGider = giderler.reduce((s, h) => s + h.tutar, 0);

// Kasiyer bazlı (kim ne kadar tahsilat yaptı)
const kasiyerOzet = aktifOdemeler.reduce((acc, o) => {
  const ad = o.kullanici.adSoyad;
  if (!acc[ad]) acc[ad] = { sayi: 0, toplam: 0, nakit: 0, havale: 0, kart: 0 };
  acc[ad].sayi++;
  acc[ad].toplam += o.toplamTutar;
  acc[ad].nakit += o.nakit;
  acc[ad].havale += o.havale;
  acc[ad].kart += o.kart;
  return acc;
}, {} as Record<string, { sayi: number; toplam: number; nakit: number; havale: number; kart: number }>);

// Net kasa
const netNakit = toplamNakit - giderler.filter(g => g.yontem === "nakit").reduce((s, g) => s + g.tutar, 0);
```

### 🎨 SAYFA YAPISI (A4 dikey, tek sayfa veya çok sayfa)

```
┌────────────────────────────────────────────────────────────┐
│ ADA BEREKET HAYVANCILIK · KASA TESLİM RAPORU              │
│ Tarih: 27 Mayıs 2026 Çarşamba                              │
│ Düzenleyen: Bünyamin TİLBE · Saat: 23:45                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 📊 GÜN ÖZETİ                                               │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  Toplam Tahsilat:        ₺ 875.450,00  ( 142 işlem )   │ │
│ │  ├─ Nakit:               ₺ 450.000,00  (  85 işlem )   │ │
│ │  ├─ Havale/EFT:          ₺ 280.450,00  (  35 işlem )   │ │
│ │  └─ Kart/POS:            ₺ 145.000,00  (  22 işlem )   │ │
│ │                                                        │ │
│ │  Toplam Gider:           ₺   2.500,00  (   3 kayıt )   │ │
│ │  İptal Edilen:           ₺  15.000,00  (   1 işlem )   │ │
│ │                                                        │ │
│ │  NET KASA NAKİT:         ₺ 447.500,00                  │ │
│ │  NET KASA HAVALE:        ₺ 280.450,00                  │ │
│ │  NET KASA KART:          ₺ 145.000,00                  │ │
│ │  ─────────────────────────────────                     │ │
│ │  NET TOPLAM:             ₺ 872.950,00                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ 👤 KASİYER BAZLI ÖZET                                      │
│ ┌─────────────────┬──────┬──────────┬──────────┬─────────┐ │
│ │ Kasiyer         │ Adet │ Nakit    │ Havale   │ Kart    │ │
│ ├─────────────────┼──────┼──────────┼──────────┼─────────┤ │
│ │ Bünyamin TİLBE  │ 142  │ 450.000  │ 280.450  │ 145.000 │ │
│ └─────────────────┴──────┴──────────┴──────────┴─────────┘ │
│                                                            │
│ 📋 TAHSİLAT DETAY LİSTESİ                                  │
│ ┌────┬─────────┬──────────────┬──────┬──────────┬───────┐ │
│ │Saat│ Dekont  │ Müşteri      │ Hisse│ Tutar    │ Yöntem│ │
│ ├────┼─────────┼──────────────┼──────┼──────────┼───────┤ │
│ │07:15│ABH..0001│Ahmet KILIÇ   │#1.3  │ 48.000,00│Nakit  │ │
│ │07:22│ABH..0002│Mehmet KÜN    │#2.1  │ 57.000,00│Havale │ │
│ │... │  ...    │              │      │          │       │ │
│ └────┴─────────┴──────────────┴──────┴──────────┴───────┘ │
│                                                            │
│ 💸 GİDER DETAYI (eğer varsa)                               │
│ ┌────┬─────────────────────┬──────────┬────────────────┐  │
│ │Saat│ Açıklama            │ Tutar    │ Yöntem         │  │
│ ├────┼─────────────────────┼──────────┼────────────────┤  │
│ │08:30│Personel öğle parası│ 2.500,00 │ Nakit          │  │
│ └────┴─────────────────────┴──────────┴────────────────┘  │
│                                                            │
│ ❌ İPTAL EDİLEN TAHSİLATLAR (eğer varsa)                   │
│ ┌────┬─────────┬──────────────┬──────────┬─────────────┐  │
│ │Saat│ Dekont  │ Müşteri      │ Tutar    │ İptal Sebebi│  │
│ ├────┼─────────┼──────────────┼──────────┼─────────────┤  │
│ │10:15│ABH..0045│Test          │ 15.000,00│ Yanlış kayıt│  │
│ └────┴─────────┴──────────────┴──────────┴─────────────┘  │
│                                                            │
│ ───────────────────────────────────────────────────────── │
│  TESLİM EDEN:                  TESLİM ALAN:                │
│  Bünyamin TİLBE                 ____________________       │
│  İmza: ____________             İmza: ______________       │
│  Tarih: 27.05.2026             Tarih: ______________      │
│                                                            │
│ www.adaberekethayvancilik.com.tr · Sayfa 1/N              │
└────────────────────────────────────────────────────────────┘
```

### 🎨 CSS Print Stilleri (önemli)

```css
@page {
  size: A4 portrait;
  margin: 0;
}

.kasa-teslim-sayfa {
  width: 210mm;
  min-height: 297mm;
  padding: 12mm 10mm 10mm 10mm;
  box-sizing: border-box;
  color: #000;
  font-family: 'Inter', sans-serif;
  page-break-after: always;
}

/* Özet kartı */
.ozet-kart {
  border: 0.75pt solid #000;
  padding: 4mm 5mm;
  margin-bottom: 6mm;
  background: #fafafa;
}

/* Tablo stilleri */
.detay-tablo {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
}
.detay-tablo th {
  background: #e8f1f8;
  border: 0.5pt solid #000;
  padding: 1mm 2mm;
  text-align: left;
}
.detay-tablo td {
  border: 0.25pt solid #ccc;
  padding: 0.8mm 2mm;
}
.para {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.iptal-satir {
  text-decoration: line-through;
  color: #c00;
}

/* İmza alanı */
.imza-alani {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20mm;
  margin-top: 10mm;
  padding-top: 6mm;
  border-top: 0.5pt solid #000;
}

@media print {
  body { background: white !important; }
  .print\\:hidden { display: none !important; }
  .kasa-teslim-sayfa { box-shadow: none !important; }
}
```

### 📝 ÜST TOOLBAR (print:hidden)

```tsx
<div className="print:hidden sticky top-0 z-10 bg-background border-b shadow-sm">
  <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Link href="/raporlar">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Raporlar
        </Button>
      </Link>
      <div className="border-l h-6" />
      <h1 className="text-lg font-semibold">Kasa Teslim Raporu</h1>
    </div>

    <div className="flex items-center gap-3">
      {/* Tarih seçici */}
      <Input
        type="date"
        value={seciliTarih}
        onChange={(e) => {
          const yeni = e.target.value;
          window.location.search = `?tarih=${yeni}`;
        }}
        className="w-44 h-9"
      />

      {/* Yazdır */}
      <Button onClick={() => window.print()} size="sm" className="gap-2">
        <Printer className="h-4 w-4" />
        Yazdır / PDF
      </Button>
    </div>
  </div>
</div>
```

---

## 📋 İŞ 3 — SİDEBAR LİNKİ EKLE

Dosya: `shared/lib/sidebar-config.ts`

**"Raporlar & Analiz"** menüsü altında, mevcut "Kesim Listesi Yazdır" linkinin **hemen altına** ekle:

```ts
{
  id: "kasa-teslim-raporu",
  ad: "Kasa Teslim Raporu",
  ikon: Receipt, // veya FileText - üstteki import'tan
  rota: "/raporlar/kasa-teslim",
  izin: "kasa.goruntule",
},
```

İmport ekle (yoksa): `import { Receipt } from "lucide-react";`

---

## 📋 İŞ 4 — ANA SAYFA HIZLI ERİŞİM (OPSİYONEL)

`app/page.tsx` veya hızlı erişim grid'inde:

```tsx
<Link href="/raporlar/kasa-teslim" className="block">
  <Card className="p-4 hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all">
    <Receipt className="h-6 w-6 mb-2 text-green-600" />
    <div className="font-semibold text-sm">Kasa Teslim Raporu</div>
    <div className="text-xs text-muted-foreground mt-0.5">Gün sonu · Muhasebe için</div>
  </Card>
</Link>
```

---

## ✅ TEST ADIM ADIM

```bash
pnpm tsc --noEmit
pnpm build
pnpm dev
```

Tarayıcıda:

1. `http://localhost:3000/raporlar/kasa-teslim` aç
2. **Bugünkü tarih otomatik gelir**, tüm ödemeler listelenir
3. Üst toolbar'da **tarih değiştir** → URL `?tarih=2026-05-27` olur → o günün verisi gelir
4. **Özet kartı** kontrolü:
   - Toplam Tahsilat
   - Yöntem bazında dağılım (nakit/havale/kart)
   - Net kasa
5. **Kasiyer özeti tablosu** → herkes kim ne kadar tahsilat yaptı
6. **Detay tablosu** → her ödeme tek tek (saat + dekont + müşteri + hisse + tutar + yöntem)
7. **İptal listesi** → sadece o güne ait iptal edilenler (kırmızı, üstü çizili)
8. **Gider listesi** → o günün kasa giderleri
9. **İmza alanı** → "Teslim Eden / Teslim Alan" alt sırada
10. **"Yazdır / PDF"** butonu → tarayıcı print diyaloğu
11. Print preview'de:
    - Toolbar gizli
    - Her şey A4'e oturuyor
    - Tablolar bölünüyorsa yeni sayfaya geçiyor
    - Her sayfada başlık + footer

## KUTSAL Kontrol

- [ ] `/api/tahsilat/odeme` çalışıyor → ABH-2026-NNN oluşturulabiliyor
- [ ] Mevcut kasa sayfaları (`/kasa`, `/kasa/hareketler`) etkilenmedi
- [ ] Dashboard kasa kartı çalışıyor

---

## 📊 RAPOR FORMATI

Bittiğinde:

```
✅ Commit SHA: ...
✅ pnpm tsc temiz
✅ pnpm build temiz
✅ /raporlar/kasa-teslim → bugünkü ödemeler listeleniyor
✅ Tarih değiştirme çalışıyor (?tarih=YYYY-MM-DD)
✅ Yöntem bazlı toplam doğru hesaplanıyor
✅ Yazdırma A4'e tam oturuyor
✅ Sidebar'da "Kasa Teslim Raporu" linki görünüyor
✅ KUTSAL test: ABH-2026-000XXX dekont oluştu
```

**Süre tahmini: 45-60 dakika.**

---

## 💡 BAYRAM GÜNÜ KULLANIM SENARYOSU

```
23:30 - Bayram günü kapanış
       ↓
Burhan Bey → /raporlar/kasa-teslim aç
       ↓
"Yazdır" butonuna bas → A4 çıktı
       ↓
Çıktıyı imzala (Teslim Eden bölümüne)
       ↓
Muhasebe arkadaşına ver
       ↓
Muhasebe arkadaşı para sayımı yapar, eşleşiyorsa
"Teslim Alan" bölümünü imzalar
       ↓
Belge resmi muhasebe kaydı olur, dosyalanır
```

Bu rapor:
- ✅ Adli/muhasebe geçerli (tarih + imza + tüm detay)
- ✅ Hangi kasiyer ne kadar tahsilat yapmış net belli
- ✅ İptal/iade ayrı görünür
- ✅ Net kasa tutarları net (nakit/havale/kart ayrı)
- ✅ Gün sonu kasa açma/kapama farkları analiz edilebilir
