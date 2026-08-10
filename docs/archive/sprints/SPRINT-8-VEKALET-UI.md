# SPRINT 8 — VEKALET YÖNETİMİ MODERN UI

**Hedef:** `/hayvanlar/vekalet` sayfasını bayram günü kullanıma hazırla.
**Süre:** ~2.5 saat
**Aciliyet:** Bayrama 1 gün — bugün bitmeli
**Risk:** Düşük-orta. Mevcut PATCH API'si kullanılacak, schema değişmiyor.

---

## ⛔ DOKUNMA

- Schema (`Hisse.vekaletAlindi`, `Hisse.vekaletTarihi`, `Vekalet` modeli)
- Backend mevcut endpoints (sadece kullanılacak):
  - `PATCH /api/hisseler/[id]/vekalet` (mevcut, çalışıyor)
  - `POST /api/vekaletler` (mevcut, dosya yükleme)
- Diğer modüller (tahsilat, kasa, TV, raporlar)
- Auth/izin sistemi (mevcut `tv.kontrol` ve `musteriler.vekalet.yaz` izinleri korunsun)

---

## 📋 PRE-WRITE GATE

```bash
# Mevcut vekalet sayfa & component'leri
cat app/hayvanlar/vekalet/page.tsx
find modules -path "*vekalet*" -type f 2>/dev/null

# Toplu API var mı (varsa onu kullan, yoksa loop)
grep -rn "toplu\|bulk" app/api --include="*.ts" 2>/dev/null | head

# Mevcut UI bileşenleri
ls components/ui/ | head -30
# Checkbox, Slider, ScrollArea var mı?

# Mobile breakpoint
grep -n "md:\|sm:" app/hayvanlar/vekalet/page.tsx 2>/dev/null
```

**Raporla:**
- `Slider`, `Checkbox`, `ScrollArea` shadcn bileşenleri mevcut mu?
- Toplu vekalet onay için yeni API endpoint mı yazılacak (`POST /api/hisseler/vekalet-toplu`), yoksa client-side loop ile mevcut PATCH'i çağırmak yeterli mi?
- Mevcut sayfada client component dönüşümü yapılacak (page.tsx server, içerik client)
- Aşağıdaki dosya yapısı uygun mu?

```
modules/vekalet/
├── components/
│   ├── VekaletYonetimiClient.tsx     # Ana client (state + layout)
│   ├── VekaletKpiBanner.tsx          # Üst KPI
│   ├── VekaletFiltreBari.tsx         # Sekme + arama
│   ├── VekaletKurbanGrubu.tsx        # DANA-X başlık + hisseler
│   ├── VekaletHisseSatir.tsx         # Tek hisse satırı + slider
│   ├── VekaletCokluAksiyonBar.tsx    # Sticky alt bar (multi-select)
│   ├── VekaletDosyaYukleModal.tsx    # PDF/foto upload
│   └── KaydirOnayla.tsx              # Reusable swipe-to-confirm
└── lib/
    └── vekalet-helper.ts
```

---

## 🎯 ONAY SONRASI YAPILACAKLAR

### 1. Sayfa: `app/hayvanlar/vekalet/page.tsx` (Server Component — değişecek)

```tsx
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { VekaletYonetimiClient } from "@/modules/vekalet/components/VekaletYonetimiClient";

export const dynamic = "force-dynamic";

export interface VekaletHisseVeri {
  id: string;
  no: number;
  vekaletAlindi: boolean;
  vekaletTarihi: string | null;  // ISO string
  vekaletDosyaUrl: string | null; // Vekalet relation'dan
  musteri: {
    id: string;
    adSoyad: string;
    telefon: string | null;
  };
  kurban: {
    id: string;
    kesimSirasi: number;
  };
}

export default async function VekaletPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/hayvanlar/vekalet");
  // tv.kontrol veya musteriler.vekalet.yaz izinli olmalı
  if (!izinKontrol(oturum, "tv.kontrol") && !izinKontrol(oturum, "musteriler.vekalet.yaz")) {
    redirect("/giris");
  }

  const hisseler = await prisma.hisse.findMany({
    where: { musteriId: { not: null }, silindiMi: false },
    include: {
      musteri: { select: { id: true, adSoyad: true, telefon: true } },
      kurban: { select: { id: true, kesimSirasi: true } },
      vekalet: { select: { dosyaUrl: true, silindiMi: true } },
    },
    orderBy: [
      { kurban: { kesimSirasi: "asc" } },
      { no: "asc" },
    ],
  });

  const veri: VekaletHisseVeri[] = hisseler.map((h) => ({
    id: h.id,
    no: h.no,
    vekaletAlindi: h.vekaletAlindi,
    vekaletTarihi: h.vekaletTarihi?.toISOString() ?? null,
    vekaletDosyaUrl: h.vekalet && !h.vekalet.silindiMi ? h.vekalet.dosyaUrl : null,
    musteri: {
      id: h.musteri!.id,
      adSoyad: h.musteri!.adSoyad,
      telefon: h.musteri!.telefon,
    },
    kurban: {
      id: h.kurban.id,
      kesimSirasi: h.kurban.kesimSirasi,
    },
  }));

  return <VekaletYonetimiClient hisseler={veri} />;
}
```

### 2. KaydirOnayla (Reusable Swipe-to-Confirm)

`modules/vekalet/components/KaydirOnayla.tsx`:

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Props {
  metin: string;          // "ONAYLA" veya "İPTAL ET"
  onayli?: boolean;       // true = yeşil (onaylı durumda)
  yukleniyor?: boolean;
  onTamamlandi: () => void;
  className?: string;
}

const ESIK_YUZDE = 70; // %70+ kaydırılınca onay

export function KaydirOnayla({
  metin,
  onayli = false,
  yukleniyor = false,
  onTamamlandi,
  className
}: Props) {
  const [kaydirma, setKaydirma] = useState(0); // 0-100
  const [aktif, setAktif] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const baslangic = useRef<number>(0);

  const handleStart = useCallback((clientX: number) => {
    if (yukleniyor) return;
    baslangic.current = clientX;
    setAktif(true);
  }, [yukleniyor]);

  const handleMove = useCallback((clientX: number) => {
    if (!aktif || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const fark = clientX - baslangic.current;
    const yuzde = Math.max(0, Math.min(100, (fark / container.width) * 100));
    setKaydirma(yuzde);
  }, [aktif]);

  const handleEnd = useCallback(() => {
    if (!aktif) return;
    setAktif(false);
    if (kaydirma >= ESIK_YUZDE) {
      // Onay tetikle
      setKaydirma(100);
      // Haptic feedback (destekleniyorsa)
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
      onTamamlandi();
      // Kısa süre sonra reset
      setTimeout(() => setKaydirma(0), 400);
    } else {
      // Geri kaydır
      setKaydirma(0);
    }
  }, [aktif, kaydirma, onTamamlandi]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse events (test için)
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => aktif && handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => aktif && handleEnd();

  const renkSinif = onayli
    ? "bg-green-100 border-green-300"     // Onaylı (toggle = iptal et)
    : "bg-amber-50 border-amber-300";      // Bekliyor (onayla)

  const sliderRenk = onayli
    ? "bg-green-500"
    : "bg-amber-500";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-12 rounded-lg border-2 overflow-hidden select-none touch-none",
        renkSinif,
        yukleniyor && "opacity-50",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Track text (background) */}
      <div className="absolute inset-0 flex items-center justify-center font-semibold text-sm">
        <ChevronRight className="h-4 w-4 mr-1.5" />
        Sağa kaydır → {metin}
      </div>

      {/* Slider thumb */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full transition-all flex items-center justify-end pr-3",
          sliderRenk,
          aktif ? "duration-0" : "duration-200 ease-out"
        )}
        style={{ width: `${Math.max(20, kaydirma)}%` }}
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
```

### 3. VekaletHisseSatir (Tek satır)

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Paperclip, FileCheck, Calendar } from "lucide-react";
import { KaydirOnayla } from "./KaydirOnayla";
import { VekaletDosyaYukleModal } from "./VekaletDosyaYukleModal";
import { formatTarih } from "@/shared/lib/tarih";
import type { VekaletHisseVeri } from "@/app/hayvanlar/vekalet/page";

interface Props {
  hisse: VekaletHisseVeri;
  secili: boolean;
  onSec: (id: string, secili: boolean) => void;
  onGuncellendi: () => void;
}

export function VekaletHisseSatir({ hisse, secili, onSec, onGuncellendi }: Props) {
  const [yukleniyor, startTransition] = useTransition();
  const [dosyaModal, setDosyaModal] = useState(false);

  function toggleVekalet() {
    const yeni = !hisse.vekaletAlindi;
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/hisseler/${hisse.id}/vekalet`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vekaletAlindi: yeni }),
        });
        if (!yanit.ok) throw new Error("Vekalet güncellenemedi");
        toast.success(
          yeni
            ? `✓ ${hisse.musteri.adSoyad} vekaleti alındı`
            : `${hisse.musteri.adSoyad} vekaleti iptal edildi`
        );
        onGuncellendi();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <div className="border-b last:border-b-0 px-3 py-3">
      <div className="flex items-start gap-3">
        {/* Checkbox (multi-select) */}
        <Checkbox
          checked={secili}
          onCheckedChange={(c) => onSec(hisse.id, !!c)}
          aria-label={`${hisse.musteri.adSoyad} seç`}
          className="mt-1"
        />

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          {/* Header: ad + tel + tarih */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {hisse.kurban.kesimSirasi}.{hisse.no}
                </span>
                <span className="font-medium text-sm truncate">
                  {hisse.musteri.adSoyad}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                {hisse.musteri.telefon ? (
                  <span>{hisse.musteri.telefon}</span>
                ) : (
                  <span className="italic">telefon yok</span>
                )}
                {hisse.vekaletAlindi && hisse.vekaletTarihi && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Calendar className="h-3 w-3" />
                    {formatTarih(new Date(hisse.vekaletTarihi))}
                  </span>
                )}
              </div>
            </div>

            {/* Dosya yükleme butonu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDosyaModal(true)}
              className="shrink-0 h-8"
              title={hisse.vekaletDosyaUrl ? "Vekalet dosyası yüklü" : "PDF/Foto yükle"}
            >
              {hisse.vekaletDosyaUrl ? (
                <FileCheck className="h-4 w-4 text-green-600" />
              ) : (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Sağa kaydır */}
          <KaydirOnayla
            metin={hisse.vekaletAlindi ? "VEKALETİ İPTAL ET" : "VEKALETİ ONAYLA"}
            onayli={hisse.vekaletAlindi}
            yukleniyor={yukleniyor}
            onTamamlandi={toggleVekalet}
          />
        </div>
      </div>

      {dosyaModal && (
        <VekaletDosyaYukleModal
          hisseId={hisse.id}
          mevcut={hisse.vekaletDosyaUrl}
          onClose={() => setDosyaModal(false)}
          onBasarili={() => {
            onGuncellendi();
            setDosyaModal(false);
          }}
        />
      )}
    </div>
  );
}
```

### 4. VekaletYonetimiClient (Ana state)

State'ler:
- `aramaTerim: string`
- `sekmeFiltre: "bekliyor" | "alindi" | "tumu"`
- `secilenler: Set<string>` — multi-select için hisse ID'leri
- Filtrelenmiş + gruplanmış veri

Multi-select aktifken sticky alt bar:
- "3 hisse seçildi" text
- `KaydirOnayla` ile "3 HİSSEYİ ONAYLA" tek tek loop ederek PATCH at
- İptal butonu (seçimi temizler)

Kurban gruplaması:
```tsx
{kurbanGruplari.map((grup) => (
  <div key={grup.kurbanId}>
    {/* Grup başlığı */}
    <div className="sticky top-0 bg-background py-2 px-3 border-b">
      <span className="text-xs font-semibold">
        DANA-{grup.kesimSirasi} ({grup.alinanSayi}/{grup.hisseler.length} ✓)
      </span>
    </div>

    {/* Hisseler */}
    {grup.hisseler.map((h) => (
      <VekaletHisseSatir
        key={h.id}
        hisse={h}
        secili={secilenler.has(h.id)}
        onSec={...}
        onGuncellendi={() => router.refresh()}
      />
    ))}
  </div>
))}
```

### 5. KPI Banner

```tsx
const toplam = hisseler.length;
const alinan = hisseler.filter(h => h.vekaletAlindi).length;
const bekleyen = toplam - alinan;
const yuzde = toplam > 0 ? (alinan / toplam) * 100 : 0;

<Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
  <CardContent className="p-4">
    <div className="flex items-center justify-between mb-2">
      <div>
        <span className="text-2xl font-bold">{alinan}</span>
        <span className="text-muted-foreground text-sm"> / {toplam} alındı</span>
        <span className="text-sm text-muted-foreground ml-2">· %{yuzde.toFixed(1)}</span>
      </div>
      <Badge variant={bekleyen > 0 ? "destructive" : "default"} className="text-sm">
        {bekleyen} bekliyor
      </Badge>
    </div>
    <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 transition-all"
        style={{ width: `${yuzde}%` }}
      />
    </div>
    {bekleyen > 0 && (
      <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Kesim öncesi tüm vekaletler alınmalı
      </p>
    )}
  </CardContent>
</Card>
```

### 6. Filtre bar (sekme + arama)

```tsx
<div className="space-y-3 mb-4">
  {/* Arama */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Müşteri adı veya telefon..."
      value={aramaTerim}
      onChange={(e) => setAramaTerim(e.target.value)}
      className="pl-9"
    />
  </div>

  {/* Sekmeler */}
  <Tabs value={sekmeFiltre} onValueChange={(v) => setSekmeFiltre(v as any)}>
    <TabsList className="grid grid-cols-3 w-full">
      <TabsTrigger value="bekliyor">
        Bekliyor ({bekleyen})
      </TabsTrigger>
      <TabsTrigger value="alindi">
        Alındı ({alinan})
      </TabsTrigger>
      <TabsTrigger value="tumu">
        Tümü ({toplam})
      </TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

### 7. VekaletDosyaYukleModal

Mevcut `POST /api/vekaletler` endpoint'ini kullan, FormData ile gönder:
- `<input type="file" accept=".pdf,.jpg,.png">`
- Max 5MB kontrolü client-side
- Yükleme sonrası: zaten endpoint `vekaletAlindi=true` ayarlıyor, refresh yeter
- Mevcut dosya varsa thumbnail göster + "Değiştir" butonu

### 8. Multi-Select Sticky Bar

```tsx
{secilenler.size > 0 && (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
    <div className="max-w-3xl mx-auto space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {secilenler.size} hisse seçildi
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSecilenler(new Set())}
        >
          Seçimi temizle
        </Button>
      </div>
      <KaydirOnayla
        metin={`${secilenler.size} HİSSEYİ ONAYLA`}
        onayli={false}
        onTamamlandi={async () => {
          // Tüm seçilenleri loop'la PATCH at
          for (const hisseId of secilenler) {
            await fetch(`/api/hisseler/${hisseId}/vekalet`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vekaletAlindi: true }),
            });
          }
          toast.success(`${secilenler.size} vekalet onaylandı`);
          setSecilenler(new Set());
          router.refresh();
        }}
      />
    </div>
  </div>
)}
```

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] Sayfa client component'e dönüştü, server query kalıcı
- [ ] KPI banner üstte (toplam/alındı/bekliyor + progress)
- [ ] Arama kutusu canlı filtre (ad + telefon)
- [ ] 3 sekme: Bekliyor (default) / Alındı / Tümü
- [ ] Kurban grup başlıkları: "DANA-1 (3/7 ✓)"
- [ ] Her hisse satırında: checkbox + ad + tel + sağa kaydır + dosya butonu
- [ ] Sağa kaydır onay (tek hisse) çalışıyor
- [ ] Onaylı hisse → tekrar sağa kaydır → iptal eder (toggle)
- [ ] Multi-select: 1+ seçim varsa sticky alt bar görünür
- [ ] Sticky bar: tek sağa kaydır ile tümünü onayla
- [ ] Dosya yükleme modal: PDF/JPG/PNG, max 5MB
- [ ] Dosya yüklenince otomatik vekalet onayı
- [ ] Mobil: 48px+ touch hedefleri, sticky bar safe-area
- [ ] Loading state'leri toast ile
- [ ] router.refresh() ile veri güncellemesi
- [ ] Konsol hata yok

---

## 🧪 TEST SENARYOLARI

1. **Tek hisse onay** → Bir satırda sağa kaydır → yeşil olur, tarih görünür
2. **Tek hisse iptal (toggle)** → Onaylı satırda tekrar sağa kaydır → gri olur
3. **Multi-select aile** → 5 checkbox tikle → sticky bar görünür → kaydır → 5 hisse onaylanır
4. **Arama** → "Ahmet" yaz → sadece Ahmet'ler kalır, gruplar boş kurbanları gizler
5. **Sekme** → "Bekliyor" → sadece bekleyenler; "Alındı" → sadece onaylılar
6. **Dosya yükleme** → PDF yükle → yükleme sonrası otomatik onaylanmış olur
7. **Mobil** → Telefondan aç → touch ile kaydır, accidental click yok

---

## 📦 COMMIT MESAJI

```
feat(vekalet): modern vekalet yönetimi — sağa kaydır onay + multi-select

- KaydirOnayla: reusable swipe-to-confirm bileşeni (touch+mouse)
- Toggle: onaylı hisse aynı slider ile iptal edilebilir
- Multi-select: checkbox + sticky alt bar ile toplu onay
- Kurban gruplaması: DANA başlıkları + ilerleme sayacı
- KPI banner: toplam/alındı/bekliyor + progress bar
- Filtre: 3 sekme (Bekliyor/Alındı/Tümü) + canlı arama
- Dosya yükleme modal: PDF/JPG/PNG (mevcut /api/vekaletler kullanır)
- Mobil-first: 48px+ touch, haptic feedback, safe-area

Etkilenmeyen: backend API, schema, diğer modüller
```

---

## 🛑 SORU & ONAY BEKLENİYOR

1. **Toplu API:** Client-side loop (8 hisse için 8 PATCH) acceptable mı, yoksa yeni `POST /api/hisseler/vekalet-toplu` endpoint mi yazsak? **Önerim:** Önce loop ile başla, yavaş gelirse endpoint ekleriz. Bayram için yeterli olur.

2. **Slider eşik değeri:** %70 kaydırınca onay. Çok mu kolay/zor? **Önerim:** %70 dene, gerekirse ayarla.

3. **Haptic feedback:** `navigator.vibrate(50)` mobilde titreşim. iOS Safari'de çalışmaz ama Android'de iyi UX. Eklensin mi? **Önerim:** Evet, kontrol et ve graceful degrade.

4. **Audit log:** Mevcut PATCH endpoint'i zaten audit logluyor. Multi-select toplu onay durumunda her birinin ayrı log'u olur — bu doğru davranış mı? **Önerim:** Evet, audit trail için doğru.

5. **Stickyalt bar mobile safe-area:** iPhone notch için `pb-safe` (Tailwind plugin) gerek olabilir. **Önerim:** `pb-[max(env(safe-area-inset-bottom),1rem)]` inline style.

ONAY GELİRSE Claude Code yazmaya başlasın.
