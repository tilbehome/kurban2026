---
id: ARCH-F3C72C93A289
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 🎯 SPRINT-FINAL — BAYRAM ÖNCESİ SON KAPSAMLI REFACTOR

**Bayrama 36 saat kaldı (27 Mayıs 2026 Çarşamba 06:00).** Bu prompt SPRINT-9 sonrasında çalıştırılacak. Tek seferde **SPRINT-7 + SPRINT-8 + son rötüşlar** birleşik.

## 📋 İÇİNDEKİLER

1. **İŞ A**: Schema migration — `Kurban.hisseGrubu` field (kg aralığı notu)
2. **İŞ B**: Yeni kurban formuna hisse grubu dropdown
3. **İŞ C**: Hayvanlar galerisinde kg grubu rozeti + filtre
4. **İŞ D**: Personel kart UI yenilenmesi (büyük DANA-NO + hissedar isimleri + boş hisse uyarısı)
5. **İŞ E**: Swipe + Geri Al butonu (personel paneli)
6. **İŞ F**: Sidebar yenileme — "Kesim Takip Ekranı" + 8 alt menü
7. **İŞ G**: Kesim Listesi A4 yazdırma sayfası (`/raporlar/kesim-listesi`)
8. **İŞ H**: Ana sayfaya "Kesim Listesi Yazdır" hızlı erişim
9. **İŞ I**: Bayram hazırlık kontrol scripti

**Toplam tahmini süre: 2-3 saat**

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- `/api/tahsilat/odeme` ve KUTSAL endpoint'ler
- `Odeme`, `KasaHareketi`, `Hisse.musteriId` schema kayıtları
- Mevcut migration'lar
- `iron-session`, `aktifOturum()`, izin sistemi
- `BildirimLog.kullaniciId` (SPRINT-EX'te eklendi)
- Hisse-Odeme ilişkisi
- TV canlı ekran (`/tv`) — müşteri görüntüsü, dokunulmaz
- Tahsilat akışı

---

# 📋 İŞ A — SCHEMA: `Kurban.hisseGrubu`

`prisma/schema.prisma` dosyasında `model Kurban {` bloğunda **`notlar`** alanından SONRA şu satırları ekle:

```prisma
  // Hisse grup notu (sadece bilgi amaçlı, fiyatlandirma yapmaz)
  // "30-35" | "35-40" | "40-45" | "45-50" | "50-55" | null (belirsiz)
  hisseGrubu    String?
```

Aynı `model Kurban` bloğunun en altındaki `@@index` listesine ekle:

```prisma
  @@index([hisseGrubu])
```

Sonra terminalde:

```bash
pnpm prisma migrate dev --name add_kurban_hisse_grubu
pnpm prisma generate
```

---

# 📋 İŞ B — YENİ KURBAN FORMUNA HISSE GRUBU DROPDOWN

Dosya: `app/hayvanlar/yeni/page.tsx` veya bu sayfada kullanılan form component'i (genelde `modules/hayvanlar/components/KurbanForm.tsx` veya benzeri).

Form alanlarına ekle (örnek: `kupeNo`'dan sonra):

```tsx
<div className="space-y-2">
  <Label htmlFor="hisseGrubu">Hisse Grubu (kg aralığı)</Label>
  <Select
    value={hisseGrubu || "belirsiz"}
    onValueChange={(v) => setHisseGrubu(v === "belirsiz" ? null : v)}
  >
    <SelectTrigger id="hisseGrubu">
      <SelectValue placeholder="Seçiniz" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="belirsiz">Belirsiz</SelectItem>
      <SelectItem value="30-35">30-35 KG</SelectItem>
      <SelectItem value="35-40">35-40 KG</SelectItem>
      <SelectItem value="40-45">40-45 KG</SelectItem>
      <SelectItem value="45-50">45-50 KG</SelectItem>
      <SelectItem value="50-55">50-55 KG</SelectItem>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Sadece bilgi amaçlı — fiyatlandırma etkilenmez.
  </p>
</div>
```

State: `const [hisseGrubu, setHisseGrubu] = useState<string | null>(null);`

POST body'sine ekle: `hisseGrubu`.

API endpoint'i `app/api/hayvanlar/route.ts` (veya `/kurbanlar/route.ts`) ZodSchema'sına ekle:

```ts
hisseGrubu: z.string().nullable().optional(),
```

Prisma create() içinde `data: { ..., hisseGrubu }`.

PATCH endpoint'i `/api/hayvanlar/[id]/route.ts` aynı şekilde.

---

# 📋 İŞ C — HAYVANLAR GALERİSİNDE KG GRUBU GÖSTERİMİ + FİLTRE

Dosya: `modules/hayvanlar/components/galeri/KurbanKart.tsx`

Mevcut karta hisse grubu rozeti ekle (kupe no yanına):

```tsx
{kurban.hisseGrubu && (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
    ⚖️ {kurban.hisseGrubu}KG
  </span>
)}
```

`modules/hayvanlar/lib/kurban-filtre.ts` içine yeni filtre kategorisi:

```ts
export type HisseGrubuFiltre = "tum" | "30-35" | "35-40" | "40-45" | "45-50" | "50-55" | "belirsiz";

export function hisseGrubuFiltreUygula(
  kurbanlar: KurbanGaleri[],
  filtre: HisseGrubuFiltre
): KurbanGaleri[] {
  if (filtre === "tum") return kurbanlar;
  if (filtre === "belirsiz") return kurbanlar.filter(k => !k.hisseGrubu);
  return kurbanlar.filter(k => k.hisseGrubu === filtre);
}
```

Galeri ust component'inde (`HayvanlarGaleriUst.tsx`) filtre dropdown ekle:

```tsx
<Select value={hisseGrubuFiltre} onValueChange={setHisseGrubuFiltre}>
  <SelectTrigger className="w-[140px]">
    <SelectValue placeholder="Kg Grubu" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="tum">Tüm Kg Grupları</SelectItem>
    <SelectItem value="30-35">30-35 KG</SelectItem>
    <SelectItem value="35-40">35-40 KG</SelectItem>
    <SelectItem value="40-45">40-45 KG</SelectItem>
    <SelectItem value="45-50">45-50 KG</SelectItem>
    <SelectItem value="50-55">50-55 KG</SelectItem>
    <SelectItem value="belirsiz">Belirsiz</SelectItem>
  </SelectContent>
</Select>
```

Service `kurbanlariListele()` select'ine `hisseGrubu: true` ekle.

---

# 📋 İŞ D — PERSONEL KART UI YENİLENMESİ

Dosya: `modules/tv/components/personel/PersonelKurbanKart.tsx` (mevcut PersonelGorevKart olabilir).

**Mevcut kart yapısı değişecek**. Yeni iskelet:

```tsx
<Card className="bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
  <CardContent className="p-3">
    {/* ÜST BÖLÜM: Büyük no + detaylar */}
    <div className="flex items-start gap-3 mb-3">
      {/* Sol: BÜYÜK kurban no */}
      <div className="flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-2xl bg-primary/10 border-2 border-primary shrink-0">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Kurban</span>
        <span className="text-3xl font-bold text-primary leading-none">
          {kurban.kesimSirasi}
        </span>
      </div>

      {/* Sağ: Detaylar */}
      <div className="flex-1 min-w-0">
        {/* Üst sıra: rozetler */}
        <div className="flex items-center gap-1 flex-wrap mb-1">
          {kurban.hisseGrubu && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              ⚖️ {kurban.hisseGrubu}KG
            </Badge>
          )}
          {kurban.kupeNo && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
              {kurban.kupeNo}
            </Badge>
          )}
        </div>

        {/* Aşama bilgisi */}
        <p className="text-sm font-semibold text-stone-900">
          {ASAMA_ETIKETLERI[kurban.kesimDurumu] || kurban.kesimDurumu}
        </p>

        {/* Hissedar baş harfleri - max 3 + sayı */}
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          {kurban.hisseler
            .filter(h => h.musteri)
            .slice(0, 3)
            .map((h) => {
              const isim = h.musteri!.adSoyad;
              const parcalar = isim.trim().split(/\s+/);
              const kisaIsim = parcalar.length >= 2
                ? `${parcalar[0].charAt(0)}. ${parcalar[parcalar.length - 1]}`
                : isim;
              return (
                <span
                  key={h.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-stone-700"
                  title={isim}
                >
                  {kisaIsim}
                </span>
              );
            })}
          {kurban.hisseler.filter(h => h.musteri).length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{kurban.hisseler.filter(h => h.musteri).length - 3} daha
            </span>
          )}
        </div>

        {/* Boş hisse uyarısı */}
        {kurban.hisseler.some(h => !h.musteriId) && (
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-orange-600 font-medium">
            <CircleDot className="h-2.5 w-2.5" />
            {kurban.hisseler.filter(h => !h.musteriId).length} boş hisse
          </div>
        )}
      </div>
    </div>

    {/* İlerleme barı */}
    <Progress value={kurban.ilerlemeYuzde} className="h-1.5 mb-3" />

    {/* AKSİYON BUTONLARI */}
    <div className="flex gap-2">
      {/* GERİ AL — küçük */}
      {onceki && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAsamaGuncelle(kurban.id, onceki, 'geri')}
          disabled={yukleniyor}
          className="h-12 w-12 p-0 shrink-0 touch-manipulation"
          title={`Geri: ${ASAMA_ETIKETLERI[onceki]}`}
          aria-label="Geri al"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* SONRAKI AŞAMA — ana eylem */}
      {sonraki && (
        <Button
          size="lg"
          onClick={() => onAsamaGuncelle(kurban.id, sonraki, 'ileri')}
          disabled={yukleniyor}
          className="flex-1 h-12 font-semibold touch-manipulation"
        >
          {ASAMA_ETIKETLERI[sonraki]}
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      )}

      {/* +%10 ilerleme */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onIlerlemeArtir(kurban.id)}
        disabled={yukleniyor}
        className="h-12 px-3 shrink-0 touch-manipulation text-xs"
      >
        +10%
      </Button>

      {/* Sorun bildir */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSorunBildir(kurban.id)}
        className="h-12 w-12 p-0 shrink-0 touch-manipulation text-orange-600"
        aria-label="Sorun bildir"
      >
        <AlertTriangle className="h-5 w-5" />
      </Button>
    </div>
  </CardContent>
</Card>
```

**Veri:** Kart prop'larına `kurban.kupeNo`, `kurban.hisseGrubu`, `kurban.hisseler[].musteri.adSoyad` eklenmeli.

PersonelAnaClient'taki polling endpoint'i (`/api/tv/personel-gorevler` veya benzeri) bu alanları döndürmeli.

---

# 📋 İŞ E — SWIPE + GERİ AL

Paket ekle:

```bash
pnpm add react-swipeable
```

`PersonelKurbanKart.tsx` üstüne:

```tsx
import { useSwipeable } from "react-swipeable";
```

Component içinde:

```tsx
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => {
    if (sonraki && !yukleniyor) {
      navigator.vibrate?.(50);
      onAsamaGuncelle(kurban.id, sonraki, 'ileri');
    }
  },
  onSwipedRight: () => {
    if (onceki && !yukleniyor) {
      navigator.vibrate?.(30);
      onAsamaGuncelle(kurban.id, onceki, 'geri');
    }
  },
  preventScrollOnSwipe: true,
  trackMouse: false,
  delta: 50,
});
```

En dış `<Card>` veya wrapper `<div>`'e `{...swipeHandlers}` ekle.

`oncekiAsama()` helper'ı `modules/tv/lib/asama-akisi.ts` içine ekle:

```ts
/** Verilen aşamadan bir öncekini döner (geri alma için) */
export function oncekiAsama(mevcut: KurbanKesimDurumu): KurbanKesimDurumu | null {
  if (mevcut === "iptal") return null;
  const idx = ASAMA_SIRASI.indexOf(mevcut);
  if (idx <= 0) return null;
  return ASAMA_SIRASI[idx - 1];
}
```

`PersonelAnaClient` veya parent component'inde:

```tsx
const onceki = oncekiAsama(kurban.kesimDurumu);
const sonraki = sonrakiAsama(kurban.kesimDurumu);
```

Geri alma için backend `/api/tv/kurban-asama` endpoint'i zaten herhangi bir `yeniDurum` kabul ediyor (geri veya ileri fark etmez). **Yeni endpoint yazılmıyor.**

---

# 📋 İŞ F — SİDEBAR YENİLEMESİ "Kesim Takip Ekranı"

Dosya: `shared/lib/sidebar-config.ts`

**Mevcut 4. menü** (`id: "kesim"`, "Kesim Operasyonu") **TAMAMEN değiştirilecek**:

```ts
// 4) KESİM TAKİP EKRANI — bayram operasyon merkezi
{
  id: "kesim-takip",
  ad: "Kesim Takip Ekranı",
  ikon: Scissors,
  izin: "hayvanlar.goruntule",
  altMenuler: [
    {
      id: "kontrol-paneli",
      ad: "Kontrol Paneli",
      ikon: LayoutTemplate,
      rota: "/tv/kontrol",
      izin: "tv.kontrol",
    },
    {
      id: "personel-paneli",
      ad: "Personel Saha Paneli",
      ikon: Smartphone,
      rota: "/tv/personel",
      izin: "tv.kontrol",
    },
    {
      id: "tv-canli",
      ad: "TV Canlı Ekran",
      ikon: Tv,
      rota: "/tv",
      yeniSekme: true,
    },
    {
      id: "vekalet-yonetim",
      ad: "Vekalet Yönetimi",
      ikon: ScrollText,
      rota: "/hayvanlar/vekalet",
      bildirimAnahtari: "eksikVekalet",
      izin: "musteriler.vekalet.oku",
    },
    {
      id: "tartim-girisi",
      ad: "Tartım Girişi",
      ikon: Scale,
      rota: "/kesim/tartim",
      izin: "tv.kontrol",
      placeholder: true,
      faz: "sonrasi",
      aciklama: "Karkasın toplam kg'sını gir, sistem otomatik 7 hisseye böler.",
      ozellikler: ["3x4 keypad (eldivene uygun)", "Otomatik hisse başı kg", "Paketleme aşamasına geç"],
    },
    {
      id: "teslim-paneli",
      ad: "Teslim Paneli",
      ikon: PackageCheck,
      rota: "/kesim/teslim",
      izin: "tv.kontrol",
      placeholder: true,
      faz: "sonrasi",
      aciklama: "Paketlenmiş hisseleri müşterilere teslim et + WhatsApp bildirim.",
      ozellikler: ["Teslim Edildi tek tık", "WhatsApp otomatik haber", "İmza/foto onay (Faz 2)"],
    },
    {
      id: "sira-yonetim",
      ad: "Sıra Yönetimi",
      ikon: ClipboardList,
      rota: "/kesim/sira",
      placeholder: true,
      faz: "sonrasi",
      aciklama: "Drag-drop ile kesim sırasını yeniden düzenle.",
      ozellikler: ["Drag-drop sıralama", "Acil sıra atlama", "WhatsApp ile çağrı"],
    },
    {
      id: "operasyon-raporu",
      ad: "Operasyon Raporu",
      ikon: BarChart3,
      rota: "/kesim/rapor",
      placeholder: true,
      faz: "sonrasi",
      aciklama: "Saatlik kesim grafiği, personel performansı, kapasite analizi.",
      ozellikler: ["Saatlik kesim grafiği", "Personel performansı", "Aşama bazlı süre"],
    },
  ],
},
```

**Önceki 11. menü** (`id: "tv"`, "TV Ekranı" tek link) **TAMAMEN KALDIR**.

Üstteki import listesine ekle (yoksa):

```ts
import {
  ...,
  LayoutTemplate,
  Smartphone,
  Tv,
  Scale,
  PackageCheck,
  ClipboardList,
  BarChart3,
  ScrollText,
  Scissors,
  Printer,
} from "lucide-react";
```

**Raporlar menüsü altına Kesim Listesi Yazdır linkini ekle** (`id: "raporlar"` menüsü `altMenuler` listesinin ortasına):

```ts
{
  id: "kesim-listesi-yazdir",
  ad: "Kesim Listesi Yazdır",
  ikon: Printer,
  rota: "/raporlar/kesim-listesi",
  izin: "raporlar.goruntule",
},
```

Yeni menü sırası:
1. Ana Sayfa
2. Müşteriler / Cari
3. Kurban Yönetimi
4. **Kesim Takip Ekranı** (yeni)
5. Tahsilat & Ödeme
6. Kasa & Finans
7. Lojistik & Teslimat
8. İletişim & WhatsApp
9. Raporlar & Analiz (içinde Kesim Listesi Yazdır eklendi)
10. Personel & Ekip
11. Ayarlar & Sistem

Toplam **11 ana menü** (eski 12 → "TV Ekranı" silindi).

---

# 📋 İŞ G — KESİM LİSTESİ A4 YAZDIRMA SAYFASI

## G.1 — Sayfa: `app/raporlar/kesim-listesi/page.tsx`

```tsx
import { KesimListesiClient } from "@/modules/raporlar/components/KesimListesiClient";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kurban Kesim Listesi · Ada Bereket Hayvancılık",
};

export default async function KesimListesiPage() {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "raporlar.goruntule")) {
    redirect("/giris?yonlendir=/raporlar/kesim-listesi");
  }

  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: {
      id: true,
      kesimSirasi: true,
      kupeNo: true,
      hisseGrubu: true,
      satisBedeli: true,
      hisseler: {
        where: { silindiMi: false },
        select: {
          id: true,
          no: true,
          hisseFiyati: true,
          vekaletAlindi: true,
          musteri: {
            select: { adSoyad: true, telefon: true },
          },
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true },
          },
        },
        orderBy: { no: "asc" },
      },
    },
    orderBy: { kesimSirasi: "asc" },
  });

  const firmaAyari = await prisma.ayar.findUnique({
    where: { anahtar: "firma_adi" },
  });
  const firmaAdi = firmaAyari?.deger || "Ada Bereket Hayvancılık";

  return (
    <KesimListesiClient
      kurbanlar={kurbanlar}
      firmaAdi={firmaAdi}
    />
  );
}
```

## G.2 — Client: `modules/raporlar/components/KesimListesiClient.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Hisse {
  id: string;
  no: number;
  hisseFiyati: number;
  vekaletAlindi: boolean;
  musteri: { adSoyad: string; telefon: string | null } | null;
  odemeler: { toplamTutar: number }[];
}

interface Kurban {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  hisseGrubu: string | null;
  satisBedeli: number;
  hisseler: Hisse[];
}

interface Props {
  kurbanlar: Kurban[];
  firmaAdi: string;
}

const KART_SAYFA_BASI = 6;

function paraFormat(deger: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(deger);
}

function telefonFormat(tel: string | null): string {
  if (!tel) return "";
  const t = tel.replace(/\D/g, "");
  if (t.length === 10) return `(${t.slice(0,3)}) ${t.slice(3,6)} ${t.slice(6,8)} ${t.slice(8)}`;
  if (t.length === 11) return `(${t.slice(1,4)}) ${t.slice(4,7)} ${t.slice(7,9)} ${t.slice(9)}`;
  return tel;
}

export function KesimListesiClient({ kurbanlar, firmaAdi }: Props) {
  const [filtreDurum, setFiltreDurum] = useState<"hepsi" | "borclu" | "odenmis">("hepsi");

  const filtreliKurbanlar = useMemo(() => {
    if (filtreDurum === "hepsi") return kurbanlar;
    return kurbanlar.filter((k) => {
      const toplamOdenen = k.hisseler.reduce(
        (acc, h) => acc + h.odemeler.reduce((a, o) => a + o.toplamTutar, 0),
        0
      );
      const toplamBedel = k.hisseler.reduce((a, h) => a + h.hisseFiyati, 0);
      const kalan = toplamBedel - toplamOdenen;
      if (filtreDurum === "borclu") return kalan > 0.01;
      if (filtreDurum === "odenmis") return kalan <= 0.01;
      return true;
    });
  }, [kurbanlar, filtreDurum]);

  const sayfalar: Kurban[][] = [];
  for (let i = 0; i < filtreliKurbanlar.length; i += KART_SAYFA_BASI) {
    sayfalar.push(filtreliKurbanlar.slice(i, i + KART_SAYFA_BASI));
  }
  const sayfaSayisi = sayfalar.length;

  function yazdir() {
    window.print();
  }

  const bugun = new Date().toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* TOOLBAR — print:hidden */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/raporlar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Raporlar
              </Button>
            </Link>
            <div className="border-l h-6" />
            <h1 className="text-lg font-semibold">Kurban Kesim Listesi</h1>
            <span className="text-sm text-muted-foreground">
              {filtreliKurbanlar.length} kurban · {sayfaSayisi} sayfa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md p-0.5">
              <Button
                size="sm"
                variant={filtreDurum === "hepsi" ? "default" : "ghost"}
                onClick={() => setFiltreDurum("hepsi")}
                className="h-8 text-xs"
              >
                Hepsi
              </Button>
              <Button
                size="sm"
                variant={filtreDurum === "borclu" ? "default" : "ghost"}
                onClick={() => setFiltreDurum("borclu")}
                className="h-8 text-xs"
              >
                Borçlu
              </Button>
              <Button
                size="sm"
                variant={filtreDurum === "odenmis" ? "default" : "ghost"}
                onClick={() => setFiltreDurum("odenmis")}
                className="h-8 text-xs"
              >
                Ödenmiş
              </Button>
            </div>

            <Button onClick={yazdir} size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Sayfayı Yazdır
            </Button>
          </div>
        </div>
      </div>

      {/* ÖNİZLEME + YAZDIRMA */}
      <div className="container max-w-[210mm] mx-auto py-4 print:py-0 print:max-w-none">
        {sayfalar.map((sayfaKurbanlari, sayfaIndex) => (
          <div
            key={sayfaIndex}
            className="kesim-listesi-sayfa bg-white shadow-md print:shadow-none mx-auto mb-4 print:mb-0"
          >
            <div className="sayfa-baslik">
              <div className="text-[10px] text-gray-600 uppercase tracking-wide">
                {firmaAdi}
              </div>
              <div className="text-base font-semibold tracking-wider">
                KURBAN KESİM LİSTESİ
              </div>
              <div className="text-[10px] text-gray-600 text-right">
                <div>TARİH: {bugun}</div>
                <div>SAYFA: {sayfaIndex + 1} / {sayfaSayisi}</div>
              </div>
            </div>

            <div className="kurban-listesi">
              {sayfaKurbanlari.map((kurban) => {
                const toplamBedel = kurban.hisseler.reduce((a, h) => a + h.hisseFiyati, 0);
                const toplamOdenen = kurban.hisseler.reduce(
                  (acc, h) => acc + h.odemeler.reduce((a, o) => a + o.toplamTutar, 0),
                  0
                );
                const toplamKalan = toplamBedel - toplamOdenen;

                return (
                  <div key={kurban.id} className="kurban-karti">
                    <div className="kurban-bilgi-hucre">
                      <div className="kbh-baslik">KURBAN BİLGİLERİ</div>
                      <div className="kbh-icerik">
                        <div className="text-[8px] text-gray-600">SIRA NO</div>
                        <div className="text-2xl font-semibold leading-none">
                          {kurban.kesimSirasi}
                        </div>
                        <div className="text-[7px] text-gray-600 mt-1">KÜPE NO</div>
                        <div className="text-[9px]">{kurban.kupeNo || "-"}</div>
                        {kurban.hisseGrubu && (
                          <div className="text-[8px] text-orange-700 mt-1 font-medium">
                            {kurban.hisseGrubu} KG
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="musteri-hucre">
                      <div className="hucre-baslik">MÜŞTERİ BİLGİLERİ</div>
                      <table className="musteri-tablo">
                        <thead>
                          <tr>
                            <th className="w-[14px]">#</th>
                            <th>ADI SOYADI</th>
                            <th className="w-[75px]">TELEFON</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 7 }).map((_, idx) => {
                            const hisse = kurban.hisseler.find((h) => h.no === idx + 1);
                            return (
                              <tr key={idx}>
                                <td className="td-sira">{idx + 1}</td>
                                <td className="td-isim">
                                  {hisse?.musteri ? hisse.musteri.adSoyad.toUpperCase() : ""}
                                  {hisse && hisse.musteri && !hisse.vekaletAlindi && (
                                    <span className="text-[7px] text-red-600 ml-1">⚠V</span>
                                  )}
                                </td>
                                <td className="td-tel">
                                  {hisse?.musteri ? telefonFormat(hisse.musteri.telefon) : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="td-toplam">
                            <td colSpan={3} className="text-right pr-2">
                              TOPLAM TUTARLAR :
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bakiye-hucre">
                      <div className="hucre-baslik">BAKİYE DETAYLARI</div>
                      <table className="bakiye-tablo">
                        <thead>
                          <tr>
                            <th>HİSSE BEDELİ</th>
                            <th>KAPARO</th>
                            <th>KALAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 7 }).map((_, idx) => {
                            const hisse = kurban.hisseler.find((h) => h.no === idx + 1);
                            const odenen = hisse?.odemeler.reduce((a, o) => a + o.toplamTutar, 0) || 0;
                            const kalan = hisse ? hisse.hisseFiyati - odenen : 0;
                            return (
                              <tr key={idx}>
                                <td className="td-para">
                                  {hisse ? "₺ " + paraFormat(hisse.hisseFiyati) : ""}
                                </td>
                                <td className="td-para">
                                  {hisse ? "₺ " + paraFormat(odenen) : ""}
                                </td>
                                <td className={`td-para ${kalan > 0.01 ? "td-borc" : "td-tamam"}`}>
                                  {hisse ? "₺ " + paraFormat(kalan) : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="td-toplam">
                            <td className="td-para">₺ {paraFormat(toplamBedel)}</td>
                            <td className="td-para">₺ {paraFormat(toplamOdenen)}</td>
                            <td className={`td-para ${toplamKalan > 0.01 ? "td-borc" : "td-tamam"}`}>
                              ₺ {paraFormat(toplamKalan)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sayfa-alt">
              <div>www.adaberekethayvancilik.com.tr</div>
              <div>⚠V = Vekalet eksik</div>
            </div>
          </div>
        ))}

        {filtreliKurbanlar.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            Filtreye uyan kurban bulunamadı
          </Card>
        )}
      </div>

      {/* YAZDIRMA CSS */}
      <style jsx global>{`
        .kesim-listesi-sayfa {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm 10mm 8mm 10mm;
          box-sizing: border-box;
          color: #000;
          font-family: 'Inter', system-ui, sans-serif;
          page-break-after: always;
        }
        .kesim-listesi-sayfa:last-child {
          page-break-after: auto;
        }

        .sayfa-baslik {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding-bottom: 4mm;
          margin-bottom: 4mm;
          border-bottom: 1.5pt solid #000;
        }
        .sayfa-baslik > div:nth-child(2) { text-align: center; }

        .kurban-listesi {
          display: flex;
          flex-direction: column;
          gap: 2.5mm;
        }

        .kurban-karti {
          display: grid;
          grid-template-columns: 22mm 1fr 55mm;
          border: 0.75pt solid #000;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .kurban-bilgi-hucre {
          border-right: 0.75pt solid #000;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
        }
        .kbh-baslik {
          background: #e8f1f8;
          border-bottom: 0.75pt solid #000;
          font-size: 7pt;
          font-weight: 500;
          padding: 1mm;
          text-align: center;
        }
        .kbh-icerik {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1mm;
          text-align: center;
        }

        .musteri-hucre, .bakiye-hucre { display: flex; flex-direction: column; }
        .musteri-hucre { border-right: 0.75pt solid #000; }
        .hucre-baslik {
          background: #e8f1f8;
          border-bottom: 0.75pt solid #000;
          font-size: 7pt;
          font-weight: 500;
          padding: 1mm;
          text-align: center;
        }

        .musteri-tablo, .bakiye-tablo {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          table-layout: fixed;
        }
        .musteri-tablo th, .bakiye-tablo th {
          background: #f5f5f5;
          font-size: 7pt;
          font-weight: 500;
          padding: 0.5mm 1mm;
          border-bottom: 0.5pt solid #000;
          text-align: center;
        }
        .musteri-tablo td, .bakiye-tablo td {
          padding: 0.4mm 1mm;
          border-bottom: 0.25pt solid #ddd;
          font-size: 8pt;
          height: 4mm;
          line-height: 1.1;
        }
        .td-sira {
          background: #f5f5f5;
          text-align: center;
          font-weight: 500;
          border-right: 0.5pt solid #000;
        }
        .td-isim {
          border-right: 0.5pt solid #000;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .td-tel {
          font-size: 7.5pt;
          color: #444;
          white-space: nowrap;
        }
        .td-para {
          text-align: right;
          font-variant-numeric: tabular-nums;
          padding-right: 1.5mm !important;
          font-size: 7.5pt;
        }
        .bakiye-tablo td { border-right: 0.5pt solid #000; }
        .bakiye-tablo td:last-child { border-right: none; }
        .td-borc { color: #c00; font-weight: 500; }
        .td-tamam { color: #060; }
        .td-toplam td {
          background: #fafafa;
          border-top: 0.75pt solid #000 !important;
          font-weight: 500;
          font-size: 7.5pt;
        }

        .sayfa-alt {
          margin-top: 3mm;
          padding-top: 1.5mm;
          border-top: 0.5pt solid #000;
          display: flex;
          justify-content: space-between;
          font-size: 7pt;
          color: #666;
        }

        @media print {
          body { background: white !important; }
          .kesim-listesi-sayfa {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
```

---

# 📋 İŞ H — ANA SAYFAYA "Kesim Listesi Yazdır" HIZLI ERİŞİM

Dosya: `app/page.tsx` veya `modules/dashboard/components/HizliErisim.tsx`

Hızlı erişim quick action grid'ine ekle:

```tsx
<Link href="/raporlar/kesim-listesi" className="block">
  <Card className="p-4 hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all">
    <Printer className="h-6 w-6 mb-2 text-orange-600" />
    <div className="font-semibold text-sm">Kesim Listesi Yazdır</div>
    <div className="text-xs text-muted-foreground mt-0.5">A4 · 6 kurban/sayfa · Bayram günü için</div>
  </Card>
</Link>
```

Import: `import { Printer } from "lucide-react";`

---

# 📋 İŞ I — BAYRAM HAZIRLIK KONTROL SCRIPTİ (OPSIYONEL)

Yeni dosya: `scripts/bayram-hazirlik-kontrol.ts`

```ts
/**
 * Bayram öncesi sistem sağlık kontrolü.
 * Çalıştır: pnpm tsx scripts/bayram-hazirlik-kontrol.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function kontrol() {
  console.log("\n🔍 ADA BEREKET HAYVANCILIK — BAYRAM HAZIRLIK KONTROL\n");
  console.log("=".repeat(60));

  // 1. Veri sayımı
  const [musteriSayisi, kurbanSayisi, hisseSayisi, doluHisse, odemeSayisi, dekontSayisi] =
    await Promise.all([
      prisma.musteri.count({ where: { silindiMi: false } }),
      prisma.kurban.count({ where: { silindiMi: false } }),
      prisma.hisse.count({ where: { silindiMi: false } }),
      prisma.hisse.count({ where: { silindiMi: false, musteriId: { not: null } } }),
      prisma.odeme.count({ where: { silindiMi: false, iptal: false } }),
      prisma.odeme.count({ where: { dekontNo: { startsWith: "ABH-2026-" } } }),
    ]);

  console.log("\n📊 VERİ SAYIMI");
  console.log(`  Müşteriler: ${musteriSayisi}`);
  console.log(`  Kurbanlar: ${kurbanSayisi}`);
  console.log(`  Hisseler: ${hisseSayisi} (${doluHisse} dolu, ${hisseSayisi - doluHisse} boş)`);
  console.log(`  Aktif ödemeler: ${odemeSayisi}`);
  console.log(`  ABH-2026 dekontlar: ${dekontSayisi}`);

  // 2. Borç durumu
  const tumHisseler = await prisma.hisse.findMany({
    where: { silindiMi: false, musteriId: { not: null } },
    select: {
      hisseFiyati: true,
      odemeler: {
        where: { iptal: false, silindiMi: false },
        select: { toplamTutar: true }
      },
    },
  });

  let toplamBedel = 0, toplamOdenen = 0;
  tumHisseler.forEach(h => {
    toplamBedel += h.hisseFiyati;
    h.odemeler.forEach(o => toplamOdenen += o.toplamTutar);
  });
  const toplamBorc = toplamBedel - toplamOdenen;

  console.log("\n💰 MALİ DURUM");
  console.log(`  Toplam bedel: ${toplamBedel.toLocaleString("tr-TR")} TL`);
  console.log(`  Toplam ödenen: ${toplamOdenen.toLocaleString("tr-TR")} TL`);
  console.log(`  Toplam borç: ${toplamBorc.toLocaleString("tr-TR")} TL`);
  console.log(`  Tahsilat oranı: %${((toplamOdenen / toplamBedel) * 100).toFixed(1)}`);

  // 3. Vekalet durumu
  const vekaletAlinan = await prisma.hisse.count({
    where: { silindiMi: false, musteriId: { not: null }, vekaletAlindi: true },
  });
  const vekaletEksik = doluHisse - vekaletAlinan;

  console.log("\n📜 VEKALET DURUMU");
  console.log(`  Vekaleti alınan hisse: ${vekaletAlinan}/${doluHisse}`);
  console.log(`  Eksik vekalet: ${vekaletEksik}`);

  // 4. Kullanıcılar ve roller
  const kullanicilar = await prisma.kullanici.findMany({
    where: { silindiMi: false, aktif: true },
    select: { kullaniciAdi: true, rol: true, gorev: true },
  });
  console.log("\n👤 AKTİF KULLANICILAR");
  kullanicilar.forEach(k => {
    console.log(`  ${k.kullaniciAdi} (${k.rol}${k.gorev ? `, görev: ${k.gorev}` : ""})`);
  });

  // 5. Sistem ayarları
  const ayarlar = await prisma.ayar.findMany({
    where: { anahtar: { in: ["firma_adi", "marka_rengi", "dekont_prefix", "firma_telefon"] } },
  });
  console.log("\n⚙️ SİSTEM AYARLARI");
  ayarlar.forEach(a => {
    console.log(`  ${a.anahtar}: ${a.deger}`);
  });

  // 6. Migration durumu
  console.log("\n📦 MIGRATION DURUMU");
  console.log("  Manuel kontrol: pnpm prisma migrate status");

  // 7. Telefonsuz müşteri sayısı
  const telefonsuzMusteri = await prisma.musteri.count({
    where: { silindiMi: false, OR: [{ telefon: null }, { telefon: "" }] },
  });
  console.log("\n📱 İLETİŞİM");
  console.log(`  Telefonsuz müşteri: ${telefonsuzMusteri} (WhatsApp gönderilemez)`);

  // 8. Bayram tarihi kontrolü
  const bugun = new Date();
  const bayram = new Date("2026-05-27T00:00:00");
  const fark = Math.floor((bayram.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
  console.log("\n📅 BAYRAM SAYACI");
  console.log(`  Bugün: ${bugun.toLocaleDateString("tr-TR")}`);
  console.log(`  Bayram: 27 Mayıs 2026 Çarşamba`);
  console.log(`  Kalan: ${fark} gün`);

  // ÖZET
  console.log("\n" + "=".repeat(60));
  console.log("✅ KONTROL TAMAMLANDI\n");

  const uyarilar: string[] = [];
  if (vekaletEksik > 0) uyarilar.push(`⚠️  ${vekaletEksik} hisse vekalet eksik`);
  if (hisseSayisi - doluHisse > 0) uyarilar.push(`⚠️  ${hisseSayisi - doluHisse} boş hisse var`);
  if (toplamBorc > 0) uyarilar.push(`⚠️  Toplam ${toplamBorc.toLocaleString("tr-TR")} TL borç açık`);

  if (uyarilar.length > 0) {
    console.log("UYARILAR:");
    uyarilar.forEach(u => console.log("  " + u));
  } else {
    console.log("🎉 Hiçbir uyarı yok — sistem bayrama hazır!");
  }

  console.log("\n");

  await prisma.$disconnect();
}

kontrol().catch(e => {
  console.error("Kontrol hatası:", e);
  process.exit(1);
});
```

Çalıştırmak için:

```bash
pnpm tsx scripts/bayram-hazirlik-kontrol.ts
```

`package.json` script ekle:

```json
"scripts": {
  ...
  "bayram-kontrol": "tsx scripts/bayram-hazirlik-kontrol.ts"
}
```

---

# ✅ TEST ADIM ADIM

```bash
# 1. Migration
pnpm prisma migrate dev --name add_kurban_hisse_grubu
pnpm prisma generate

# 2. Paket
pnpm add react-swipeable

# 3. Type check
pnpm tsc --noEmit

# 4. Build
pnpm build

# 5. Dev
pnpm dev

# 6. Bayram kontrol scripti
pnpm tsx scripts/bayram-hazirlik-kontrol.ts
```

## Tarayıcı Testi

- [ ] **`/hayvanlar/yeni`** → Hisse Grubu dropdown çalışıyor (5 seçenek + Belirsiz)
- [ ] **`/hayvanlar`** galerisinde kart üzerinde kg grubu rozeti görünüyor
- [ ] **`/hayvanlar`** üst filtre: "Kg Grubu" dropdown çalışıyor
- [ ] **Sidebar**: "Kesim Takip Ekranı" menüsü 8 alt menü ile açılıyor
- [ ] **Sidebar**: "TV Ekranı" tek menüsü artık YOK (Kesim Takip altında)
- [ ] **Sidebar**: "Raporlar" altında "Kesim Listesi Yazdır" var
- [ ] **`/tv/personel`** → kart üzerinde BÜYÜK kurban no, kg grubu rozet, hissedar baş harfleri, boş hisse uyarısı
- [ ] **`/tv/personel`** → swipe sol = sonraki aşama, swipe sağ = geri al
- [ ] **`/tv/personel`** → "Geri Al" butonu görünür, çalışır
- [ ] **`/tv/personel`** → +%10 ilerleme butonu çalışır
- [ ] **`/raporlar/kesim-listesi`** → açılır, üstte toolbar + 6 kurban/sayfa önizleme
- [ ] **`/raporlar/kesim-listesi`** → 3 filtre (Hepsi/Borçlu/Ödenmiş) çalışıyor
- [ ] **`/raporlar/kesim-listesi`** → "Sayfayı Yazdır" → tarayıcı print diyaloğu
- [ ] **Print preview**: Toolbar gizli, kartlar bölünmüyor, her sayfa 6 kurban
- [ ] **Ana sayfa**: Hızlı erişim'de "Kesim Listesi Yazdır" var
- [ ] **Bayram kontrol scripti**: Tüm KPI'lar net görünür

## KUTSAL Kontrolü

- [ ] Tahsilat hâlâ çalışıyor → `/tahsilat/musteri/[id]` → ödeme al → **ABH-2026-NNN üretilmeli**
- [ ] Tahsilat iptal endpoint'i çalışıyor
- [ ] WhatsApp toplu gönderim sayfası açılıyor
- [ ] `/tv` canlı ekran etkilenmedi
- [ ] `/tv/kontrol` (SPRINT-9'da kurban bazlı yapıldıysa) hâlâ çalışıyor

---

# 🚨 BAYRAM GÜNÜ HAZIRLIK ADIMLARI

Bu sprint bittiğinde **26 Mayıs Salı akşam** yapılacaklar:

1. **DB yedek**:
   ```bash
   cp prisma/tilbe.db prisma/tilbe-SPRINT-FINAL-OK.db
   cp prisma/tilbe.db ~/Desktop/tilbe-yedek-bayram-onceisi.db
   ```

2. **Bayram kontrol**:
   ```bash
   pnpm tsx scripts/bayram-hazirlik-kontrol.ts
   ```

3. **Tüm 63 kurbanın `hisseGrubu`** alanını doldur (Prisma Studio'dan veya manuel UI):
   ```bash
   pnpm prisma studio
   ```

4. **Personel görev atamasını yap** (`/ayarlar/kullanicilar`):
   - Vekalet personel(ler)i → `gorev: "vekalet"`
   - Kasap(lar) → `gorev: "kesim"`
   - Tartım personeli → `gorev: "tartim"`
   - Paketleme personeli → `gorev: "paketleme"`
   - Teslim personeli → `gorev: "teslim"`
   - Genel/sen → `gorev: null` (hepsini görür)

5. **A4 yazdırma testi**:
   - `/raporlar/kesim-listesi` aç
   - "Sayfayı Yazdır" → gerçek yazıcıdan **1 sayfa** bas
   - Font okunabilir mi? Kartlar bölünmemiş mi? Renkler doğru mu? **Kontrol et!**

6. **Personel telefonu test**:
   - Her saha personeli telefonunda `https://senin-domain/tv/personel` aç
   - PWA olarak "Ana ekrana ekle"
   - Test kurbanı ile aşama geçişi dene
   - Swipe + buton + sesli anons çalışıyor mu?

7. **TV testi**:
   - Büyük ekran TV'ye `/tv` aç (tam ekran)
   - Kurban aşamaları geçince TV anlık güncellenmeli (SSE)

---

# 📊 RAPOR FORMATI

Bittiğinde:

```
✅ Commit SHA: ...
✅ Migration: add_kurban_hisse_grubu uygulandı
✅ pnpm tsc --noEmit temiz
✅ pnpm build temiz
✅ Test sonuçları (checkbox listesi)
✅ Bayram kontrol scripti çıktısı (1 paragraf özet)
✅ A4 yazdırma testi: gerçek yazıcıdan 1 sayfa basıldı mı? (foto eklenebilir)
✅ KUTSAL test: ABH-2026-000XXX dekont oluştu mu?
```

**Süre tahmini: 2-3 saat.**

---

# 🎯 BU SPRINT BİTTİĞİNDE

Sistem **%100 bayrama hazır**:
- ✅ Kontrol paneli kurban bazlı (SPRINT-9)
- ✅ Personel paneli kurban bazlı + isim + uyarılar
- ✅ Hisse grubu (kg) sistemi var
- ✅ Sidebar "Kesim Takip Ekranı" + 8 alt menü
- ✅ Kesim Listesi A4 yazdırma hazır
- ✅ Swipe + geri al + sorun bildir
- ✅ Bayram kontrol scripti
- ✅ 11/11 operasyon adımı çalışıyor (rapor uyumlu)

**Geriye sadece bayram günü operasyonu kaldı. Bol kazançlar!** 🎉
