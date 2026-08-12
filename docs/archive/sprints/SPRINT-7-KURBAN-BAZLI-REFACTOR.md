---
id: ARCH-A9F5276C479D
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 🎯 SPRINT-7 — KURBAN BAZLI OPERASYON REFACTOR

**Bayrama 2 gün** (27 Mayıs 2026). Sistemin **kalbi** olan kesim operasyonu mantığı yanlış kurulmuş — şu an hisse bazlı görünüyor, doğrusu kurban (DANA) bazlı olmalı. Bu prompt'la:

1. Hisse grubu (kg aralığı) eklenir
2. Personel paneli kurban kart bazlı yeniden yazılır (drag-drop + geri al + hissedar isimleri)
3. Sidebar "Kesim Takip Ekranı" altında 6 alt menü ile yeniden yapılır
4. Vekalet panel hisse bazlı kalır (doğru zaten)

---

## ⛔ KIRMIZI ÇİZGİLER (KESINLIKLE DOKUNMA)

- `/api/tahsilat/odeme` ve tüm `/api/odeme*` endpoint'leri **KUTSAL**
- `Odeme`, `KasaHareketi`, `Hisse.musteriId`, `Vekalet` schema kayitlari
- Mevcut migration'lar
- `iron-session`, `aktifOturum()`, izin sistemi
- `BildirimLog.kullaniciId` (SPRINT-EX'te eklendi)
- Hisse-Odeme ilişkisi (hisse bazlı tahsilat doğru, dokunma)

---

## 📋 İŞ 1 — SCHEMA: Kurban.hisseGrubu

`prisma/schema.prisma` → `model Kurban {` bloğu içinde, **notlar** alanından sonra şu satırı ekle:

```prisma
  // Hisse grup notu (sadece bilgi amaçlı, fiyatlandirma yapmaz)
  // "30-35" | "35-40" | "40-45" | "45-50" | "50-55" | null (belirsiz)
  hisseGrubu    String?
```

Aynı bloğun en altına `@@index` listesine ekle:

```prisma
  @@index([hisseGrubu])
```

Sonra:

```bash
pnpm prisma migrate dev --name add_kurban_hisse_grubu
pnpm prisma generate
```

---

## 📋 İŞ 2 — KURBAN FORMUNA HISSE GRUBU DROPDOWN

Dosya: `app/hayvanlar/yeni/page.tsx` (veya `KurbanForm.tsx`)

Form alanlarına ekle:

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

API endpoint'leri (`POST /api/kurbanlar`, `PATCH /api/kurbanlar/[id]`) zaten Prisma Client kullanıyorsa otomatik kaydeder. Eğer manuel field listesi varsa `hisseGrubu`'nu ekle.

---

## 📋 İŞ 3 — KURBAN KART KOMPONENTI (en kritik iş)

Dosya: `modules/tv/components/personel/PersonelKurbanKart.tsx`

**Mevcut kartın üstüne şunlar EKLENMELİ:**

```tsx
// Kart başlığında DANA-NO büyük, kg grubu rozet, hissedar isimleri
<div className="flex items-start gap-3 mb-3">
  {/* Sol: BÜYÜK kurban no */}
  <div className="flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-2xl bg-primary/10 border-2 border-primary">
    <span className="text-[10px] text-muted-foreground uppercase">Dana</span>
    <span className="text-3xl font-bold text-primary leading-none">
      {kurban.kesimSirasi}
    </span>
  </div>

  {/* Sağ: Detaylar */}
  <div className="flex-1 min-w-0">
    {/* Hisse grubu rozet */}
    {kurban.hisseGrubu && (
      <Badge variant="outline" className="mb-1 text-xs">
        ⚖️ {kurban.hisseGrubu} KG
      </Badge>
    )}

    {/* Aşama bilgisi */}
    <p className="text-sm font-medium">
      {ASAMA_ETIKETLERI[kurban.kesimDurumu] || kurban.kesimDurumu}
    </p>

    {/* Hissedar listesi (max 3 isim + sayı) */}
    <div className="mt-1 flex items-center gap-1 flex-wrap">
      {kurban.hisseler.slice(0, 3).map((h) => (
        <span
          key={h.id}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium"
        >
          {h.musteri
            ? `${h.musteri.adSoyad.charAt(0)}. ${h.musteri.adSoyad.split(' ').slice(-1)[0]}`
            : `H${h.no}: Boş`}
        </span>
      ))}
      {kurban.hisseler.length > 3 && (
        <span className="text-[10px] text-muted-foreground">
          +{kurban.hisseler.length - 3} daha
        </span>
      )}
    </div>

    {/* Boş hisse sayısı */}
    {kurban.hisseler.some(h => !h.musteriId) && (
      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-orange-600">
        <CircleDot className="h-2.5 w-2.5" />
        {kurban.hisseler.filter(h => !h.musteriId).length} boş hisse
      </div>
    )}
  </div>
</div>

{/* İlerleme barı */}
<Progress value={kurban.ilerlemeYuzde} className="h-1.5 mb-3" />

{/* Aşama butonları — yatay scroll, tek elle erişilebilir */}
<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
  {/* GERİ ALMA butonu */}
  {onceki && (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => onAsamaGuncelle(kurban.id, onceki, 'geri')}
      className="shrink-0 h-12 min-w-[44px] touch-manipulation"
      title={`Geri: ${ASAMA_ETIKETLERI[onceki]}`}
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )}

  {/* +%10 ilerleme */}
  <Button
    size="sm"
    variant="outline"
    onClick={() => onIlerlemeArtir(kurban.id)}
    className="shrink-0 h-12 px-3 touch-manipulation"
  >
    +%10
  </Button>

  {/* SONRAKI AŞAMA — ana eylem, en büyük */}
  {sonraki && (
    <Button
      size="lg"
      onClick={() => onAsamaGuncelle(kurban.id, sonraki, 'ileri')}
      className="flex-1 h-12 min-h-[48px] touch-manipulation font-semibold"
    >
      <ChevronRight className="h-5 w-5 mr-1" />
      {ASAMA_ETIKETLERI[sonraki]}
    </Button>
  )}

  {/* Sorun bildir */}
  <Button
    size="sm"
    variant="ghost"
    onClick={() => onSorunBildir(kurban.id)}
    className="shrink-0 h-12 min-w-[44px] touch-manipulation text-orange-600"
  >
    <AlertTriangle className="h-5 w-5" />
  </Button>
</div>
```

**Veri çekme:** `/api/tv/kurbanlar-aktif` endpoint'i (varsa) veya yeni endpoint:

```ts
// app/api/tv/personel-gorevler/route.ts (YENİ)
import { NextRequest, NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/oturum";
import { prisma } from "@/shared/lib/prisma";
import { GOREV_ASAMALARI, gorevGecerliMi } from "@/modules/tv/lib/personel-gorev";

export async function GET(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum?.kullaniciId) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.kullaniciId },
    select: { gorev: true, rol: true },
  });

  const gorev = gorevGecerliMi(kullanici?.gorev);
  const asamalar = GOREV_ASAMALARI[gorev];

  // KRİTİK: "beklemede" durumu da listede gözükmeli ki personel ilerletebilsin
  const aktifAsamalar = gorev === "genel"
    ? [...asamalar, "beklemede"]
    : asamalar;

  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: { in: aktifAsamalar },
    },
    select: {
      id: true,
      kesimSirasi: true,
      kesimDurumu: true,
      ilerlemeYuzde: true,
      hisseGrubu: true,
      asama: true,
      kesimBaslama: true,
      hisseler: {
        where: { silindiMi: false },
        select: {
          id: true,
          no: true,
          musteriId: true,
          vekaletAlindi: true,
          paketDurumu: true,
          musteri: {
            select: { id: true, adSoyad: true, telefon: true },
          },
        },
        orderBy: { no: "asc" },
      },
    },
    orderBy: [
      { operasyonSira: "asc" },
      { kesimSirasi: "asc" },
    ],
  });

  return NextResponse.json({
    gorev,
    kurbanlar,
    sayim: {
      hepsi: kurbanlar.length,
      vekalet: kurbanlar.filter(k => k.kesimDurumu === "vekalet_bekliyor").length,
      kesim: kurbanlar.filter(k =>
        ["siradaki","hazirlik","kesimde","deri_yuzme","parcalama"].includes(k.kesimDurumu)
      ).length,
      tartim: kurbanlar.filter(k => k.kesimDurumu === "tartimda").length,
      paketleme: kurbanlar.filter(k => k.kesimDurumu === "paketleme").length,
      teslim: kurbanlar.filter(k =>
        ["teslime_hazir","tamamlandi"].includes(k.kesimDurumu)
      ).length,
    },
  });
}
```

`PersonelAnaClient.tsx` bu yeni endpoint'i `/api/tv/personel-gorevler` polling ile çağırmalı (her 5sn'de bir).

---

## 📋 İŞ 4 — DRAG & DROP + GERİ AL ÖZELLİĞİ

`PersonelKurbanKart.tsx` dosyasının üstüne:

```tsx
import { useSwipeable } from "react-swipeable";

// Kurban kartında:
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => {
    if (sonraki) {
      navigator.vibrate?.(50);
      onAsamaGuncelle(kurban.id, sonraki, 'ileri');
    }
  },
  onSwipedRight: () => {
    if (onceki) {
      navigator.vibrate?.(30);
      onAsamaGuncelle(kurban.id, onceki, 'geri');
    }
  },
  preventScrollOnSwipe: true,
  trackMouse: false,
});

return (
  <div {...swipeHandlers} className="...">
    {/* kart içeriği */}
  </div>
);
```

Gerekli paket:

```bash
pnpm add react-swipeable
```

**Geri alma API'si zaten var** (`/api/tv/kurban-asama` POST) — sadece `yeniDurum` parametresine bir önceki aşamayı gönder.

`modules/tv/lib/asama-akisi.ts` içinde **yeni helper** ekle:

```ts
/** Verilen aşamadan bir öncekini döner (geri alma için) */
export function oncekiAsama(mevcut: string): string | null {
  const idx = ASAMA_SIRASI.indexOf(mevcut);
  if (idx <= 0) return null;
  return ASAMA_SIRASI[idx - 1];
}
```

---

## 📋 İŞ 5 — SIDEBAR: "Kesim Takip Ekranı" YENİDEN

`shared/lib/sidebar-config.ts` içinde **mevcut 11. menüyü** (TV Ekranı tek link) ve **4. menüyü** (Kesim Operasyonu) **şununla değiştir**:

```ts
// 4) KESİM TAKİP EKRANI — TÜM operasyon merkezi
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
      id: "tartim-keypad",
      ad: "Tartım Girişi",
      ikon: Scale,
      rota: "/kesim/tartim",
      izin: "tv.kontrol",
    },
    {
      id: "teslim-paneli",
      ad: "Teslim Paneli",
      ikon: PackageCheck,
      rota: "/kesim/teslim",
      izin: "tv.kontrol",
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

**11. menüyü** (`id: "tv"` olan tek link) **TAMAMEN KALDIR** — artık alt menüde "TV Canlı Ekran" var.

`sidebarMenuleri` array'inin sırası şu olsun:
1. Ana Sayfa
2. Müşteriler / Cari
3. Kurban Yönetimi
4. **Kesim Takip Ekranı** (yeni)
5. Tahsilat & Ödeme
6. Kasa & Finans
7. Lojistik & Teslimat
8. İletişim & WhatsApp
9. Raporlar & Analiz
10. Personel & Ekip
11. ~~TV Ekranı~~ (KALDIRILDI — Kesim Takip Ekranı içinde)
12. Ayarlar & Sistem

Yani toplam **11 ana menü** olur (12 değil).

---

## 📋 İŞ 6 — TARTIM KEYPAD SAYFASI

`app/kesim/tartim/page.tsx` (YENİ):

```tsx
import { TartimAnaClient } from "@/modules/kesim/components/TartimAnaClient";

export const dynamic = "force-dynamic";

export default function TartimPage() {
  return <TartimAnaClient />;
}
```

`modules/kesim/components/TartimAnaClient.tsx` (YENİ):

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Scale, Save } from "lucide-react";
import { toast } from "sonner";

interface TartimaHazir {
  id: string;
  kesimSirasi: number;
  hisseGrubu: string | null;
  hisseSayisi: number;
}

export function TartimAnaClient() {
  const [kurbanlar, setKurbanlar] = useState<TartimaHazir[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [kgInput, setKgInput] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    yukle();
    const i = setInterval(yukle, 5000);
    return () => clearInterval(i);
  }, []);

  async function yukle() {
    try {
      const r = await fetch("/api/kesim/tartima-hazir");
      const d = await r.json();
      setKurbanlar(d.kurbanlar || []);
    } catch (e) {
      console.error(e);
    }
  }

  function basamakBas(b: string) {
    if (b === "C") {
      setKgInput("");
      return;
    }
    if (b === ".") {
      if (kgInput.includes(".")) return;
      setKgInput(kgInput + ".");
      return;
    }
    if (kgInput.length >= 6) return;
    setKgInput(kgInput + b);
  }

  async function kaydet() {
    if (!secili || !kgInput) {
      toast.error("Kurban ve kg girin");
      return;
    }
    const kg = parseFloat(kgInput);
    if (isNaN(kg) || kg <= 0 || kg > 1000) {
      toast.error("Geçersiz kg (1-1000)");
      return;
    }
    setYukleniyor(true);
    try {
      const r = await fetch("/api/kesim/tartim-kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kurbanId: secili, toplamKg: kg }),
      });
      if (!r.ok) throw new Error("Kaydedilemedi");
      toast.success(`${kg} kg kaydedildi → Paketleme aşamasına geçti`);
      setSecili(null);
      setKgInput("");
      navigator.vibrate?.(100);
      yukle();
    } catch (e) {
      toast.error("Kaydedilemedi");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Scale className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Tartım Girişi</h1>
          <p className="text-sm text-muted-foreground">
            Karkas tartıldıktan sonra toplam kg girin
          </p>
        </div>
      </div>

      {/* Tartıma hazır liste */}
      <div className="grid grid-cols-3 gap-2">
        {kurbanlar.map((k) => (
          <button
            key={k.id}
            onClick={() => setSecili(k.id)}
            className={`p-3 rounded-xl border-2 transition-all ${
              secili === k.id
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            }`}
          >
            <div className="text-xs text-muted-foreground">DANA</div>
            <div className="text-2xl font-bold">{k.kesimSirasi}</div>
            {k.hisseGrubu && (
              <div className="text-[10px] text-orange-600">{k.hisseGrubu} KG</div>
            )}
          </button>
        ))}
        {kurbanlar.length === 0 && (
          <Card className="col-span-3 p-8 text-center text-muted-foreground">
            Tartıma hazır kurban yok
          </Card>
        )}
      </div>

      {secili && (
        <>
          {/* Display */}
          <Card className="p-6 bg-muted/30">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Toplam Karkas KG</div>
              <div className="text-6xl font-bold tabular-nums">{kgInput || "0"}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Hisse başı: {kgInput ? (parseFloat(kgInput) / 7).toFixed(1) : "0"} kg
              </div>
            </div>
          </Card>

          {/* Keypad 3x4 */}
          <div className="grid grid-cols-3 gap-2">
            {["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "C"].map((b) => (
              <Button
                key={b}
                variant={b === "C" ? "destructive" : "outline"}
                size="lg"
                onClick={() => basamakBas(b)}
                className="h-16 text-2xl font-semibold touch-manipulation"
              >
                {b}
              </Button>
            ))}
          </div>

          <Button
            onClick={kaydet}
            disabled={yukleniyor || !kgInput}
            className="w-full h-14 text-lg"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            {yukleniyor ? "Kaydediliyor..." : "Tartım Kaydet → Paketleme"}
          </Button>
        </>
      )}
    </div>
  );
}
```

API endpoint'leri:

```ts
// app/api/kesim/tartima-hazir/route.ts (YENİ)
import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/oturum";
import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum?.kullaniciId) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }
  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: "tartimda",
    },
    select: {
      id: true,
      kesimSirasi: true,
      hisseGrubu: true,
      hisseSayisi: true,
    },
    orderBy: { operasyonSira: "asc" },
  });
  return NextResponse.json({ kurbanlar });
}
```

```ts
// app/api/kesim/tartim-kaydet/route.ts (YENİ)
import { NextRequest, NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/oturum";
import { prisma } from "@/shared/lib/prisma";
import { auditYaz } from "@/shared/lib/audit";

export async function POST(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum?.kullaniciId) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }
  const body = await req.json();
  const kurbanId = String(body?.kurbanId || "");
  const toplamKg = Number(body?.toplamKg);

  if (!kurbanId || !toplamKg || toplamKg <= 0 || toplamKg > 1000) {
    return NextResponse.json({ hata: "Gecersiz veri" }, { status: 400 });
  }

  try {
    const kurban = await prisma.kurban.findUnique({
      where: { id: kurbanId },
      include: { hisseler: { where: { silindiMi: false } } },
    });
    if (!kurban) {
      return NextResponse.json({ hata: "Kurban bulunamadi" }, { status: 404 });
    }

    const hisseSayisi = kurban.hisseler.length || 7;
    const hisseBasiKg = toplamKg / hisseSayisi;

    await prisma.$transaction(async (tx) => {
      // Kurban → paketleme aşamasına
      await tx.kurban.update({
        where: { id: kurbanId },
        data: {
          kesimDurumu: "paketleme",
          toplamKg,
          karkasKg: toplamKg,
          ilerlemeYuzde: 70,
        },
      });

      // Tüm hisseleri → paketleme + hisse başı kg
      await tx.hisse.updateMany({
        where: { kurbanId, silindiMi: false },
        data: {
          kesimDurumu: "paketleme",
          paketDurumu: "Bekliyor",
          paketKg: hisseBasiKg,
        },
      });
    });

    await auditYaz({
      eylem: "tartim-kaydet",
      model: "Kurban",
      kayitId: kurbanId,
      kullaniciId: oturum.kullaniciId,
      detaylar: JSON.stringify({ toplamKg, hisseBasiKg }),
    });

    return NextResponse.json({ ok: true, toplamKg, hisseBasiKg });
  } catch (e) {
    console.error("[tartim-kaydet] hata:", e);
    return NextResponse.json({ hata: "Kaydedilemedi" }, { status: 500 });
  }
}
```

---

## 📋 İŞ 7 — TESLİM PANELİ SAYFASI

`app/kesim/teslim/page.tsx` (YENİ):

```tsx
import { TeslimAnaClient } from "@/modules/kesim/components/TeslimAnaClient";

export const dynamic = "force-dynamic";

export default function TeslimPage() {
  return <TeslimAnaClient />;
}
```

Component: `modules/kesim/components/TeslimAnaClient.tsx` — paketleme tamamlanmış hisseleri listeler, "Teslim Et" butonu + WhatsApp bildirimi. (`PersonelTeslimPanel`'i wrap eden basit sayfa).

---

## 📋 İŞ 8 — KONTROL PANELİ KURBAN BAZLI

`/tv/kontrol` sayfası zaten admin paneli. Şunları ekle:

1. **Hızlı kurban arama** — DANA no ile filtre (input: 1-70)
2. **Toplu aşama geç** — birden fazla kurban seç → "Hazırlık'a Geç" gibi toplu işlem
3. **Hisse grubu filtresi** — sadece "40-45 KG" gibi grupları göster

(Bu detaylar isteğe bağlı, ana iş **PersonelKurbanKart** ve **TartimKeypad**.)

---

## ✅ TEST ADIM ADIM

```bash
# 1. Schema migration
pnpm prisma migrate dev --name add_kurban_hisse_grubu
pnpm prisma generate

# 2. Paket
pnpm add react-swipeable

# 3. Type check
pnpm tsc --noEmit

# 4. Build
pnpm build

# 5. Dev server
pnpm dev
```

Tarayıcıda test:

- [ ] `/hayvanlar/yeni` → Hisse Grubu dropdown çalışıyor
- [ ] Sidebar → "Kesim Takip Ekranı" var, açılınca 8 alt menü
- [ ] `/tv/personel` → bir kurban kartı → DANA-NO büyük, hissedar isimleri, kg grubu rozeti
- [ ] Kart üzerinde **swipe sol** → sonraki aşama, **swipe sağ** → geri al
- [ ] **+%10** butonu → ilerleme yüzdesi artar
- [ ] `/kesim/tartim` → tartıma hazır kurban seç → keypad ile kg gir → kaydet → kurban "paketleme"ye geçer
- [ ] `/kesim/teslim` → paketlenmiş hisseler listesi → "Teslim Et" çalışır

## 🚨 BAYRAM GÜNÜ İÇİN HAZIRLIK

Tüm bu işler bittiğinde:
1. `pnpm prisma migrate status` → "up to date"
2. DB yedek: `cp prisma/tilbe.db prisma/tilbe-SPRINT7-OK.db`
3. Tüm 63 kurbanın `hisseGrubu` field'ı güncelle (Prisma Studio'dan veya UI'dan)

---

## RAPOR

Bittiğinde:
- Commit SHA
- `pnpm tsc --noEmit` → ✅
- `pnpm build` → ✅
- Test sonuçları (yukarıdaki checkbox'lar)
- Migration: `add_kurban_hisse_grubu` uygulandı mı?
