---
id: ARCH-DDD46EADBDCD
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 16 — ESNEK FİYATLANDIRMA + MOBİL ALT NAVİGASYON

**Hedef:** (A) Esnek/seçilebilir fiyatlandırma sistemi, (B) Mobil saha kullanımı için alt navigasyon + hızlı işlem butonu.
**Süre:** ~2 saat
**Risk:** Orta — hayvan oluşturma akışı + global layout değişiyor. Schema'ya 1 alan eklenebilir.

---

## 🎯 BÖLÜM A — ESNEK FİYATLANDIRMA

### Sorun
Şu an sadece "Toplam Satış Bedeli" giriliyor, eşit bölünüyor (`satisBedeli / hisseSayisi`).
Rakipler kilo bazlı otomatik hesaplıyor. Esnek olmalı.

### Çözüm: 3 Fiyatlandırma Modu (Kullanıcı Seçer)

Hayvan eklerken **radyo seçim:**

1. **Toplam Bedelden Böl** (mevcut davranış)
   - Toplam bedel gir → hisse fiyatı = bedel / hisse sayısı
   - Örn: 350.000 ₺ / 7 = 50.000 ₺/hisse

2. **Hisse Fiyatından Çarp** (yeni)
   - Hisse başı fiyat gir → toplam = hisse fiyatı × hisse sayısı
   - Örn: 50.000 ₺ × 7 = 350.000 ₺

3. **Kilo Bazlı** (yeni — rakip standardı)
   - Canlı kg + kg-fiyatı gir → toplam = kg × kg-fiyatı
   - Hisse fiyatı = toplam / hisse sayısı
   - Örn: 500 kg × 700 ₺ = 350.000 ₺ → 50.000 ₺/hisse

Üçü de **aynı sonuca** (satisBedeli + hisseFiyati) ulaşır, sadece giriş yöntemi farklı. Pratiklik için kullanıcı duruma göre seçer.

### Schema (opsiyonel ekleme)
`Kurban` modeline bilgi amaçlı 2 alan (varsa atla):
```prisma
kgFiyati      Float?   // kilo bazlı seçildiyse kaydedilen kg fiyatı
fiyatModu     String?  // "bedel" | "hisse" | "kilo" — hangi modla girildi
```
`canliAgirlik` zaten var, onu kullan.

⚠️ Schema değişikliği gerekiyorsa: `prisma db push` (migrate değil, veri kaybı yok). Ama önce sor — schema'ya dokunmadan da yapılabilir (sadece hesaplama formda yapılır, DB'ye yine satisBedeli+hisseFiyati gider).

### PRE-WRITE GATE (Bölüm A)
```bash
# Mevcut form ve API
cat app/hayvanlar/yeni/YeniKurbanForm.tsx
cat app/api/hayvanlar/route.ts
# canliAgirlik schema'da var mı (var, doğrula)
grep "canliAgirlik\|kgFiyati\|fiyatModu" prisma/schema.prisma
```

### Uygulama (Bölüm A)

**YeniKurbanForm.tsx** — fiyatlandırma modu seçici ekle:

```tsx
const [fiyatModu, setFiyatModu] = useState<"bedel" | "hisse" | "kilo">("bedel");
const [veri, setVeri] = useState({
  kesimSirasi: "",
  kupeNo: "",
  hisseSayisi: "7",
  satisBedeli: "",
  hisseFiyatiInput: "",   // mod "hisse" için
  canliAgirlik: "",       // mod "kilo" için
  kgFiyati: "",           // mod "kilo" için
  hisseGrubu: "",
});

// Hesaplanan değerler (canlı önizleme)
const hesap = useMemo(() => {
  const hisseSayisi = Number.parseInt(veri.hisseSayisi, 10) || 7;
  let satisBedeli = 0;

  if (fiyatModu === "bedel") {
    satisBedeli = Number.parseFloat(veri.satisBedeli) || 0;
  } else if (fiyatModu === "hisse") {
    const hf = Number.parseFloat(veri.hisseFiyatiInput) || 0;
    satisBedeli = hf * hisseSayisi;
  } else if (fiyatModu === "kilo") {
    const kg = Number.parseFloat(veri.canliAgirlik) || 0;
    const kgf = Number.parseFloat(veri.kgFiyati) || 0;
    satisBedeli = kg * kgf;
  }

  const hisseFiyati = hisseSayisi > 0 ? satisBedeli / hisseSayisi : 0;
  return { satisBedeli, hisseFiyati, hisseSayisi };
}, [fiyatModu, veri]);
```

**Mod seçici UI (radyo butonlar — büyük, dokunmatik):**
```tsx
<div className="space-y-2">
  <Label>Fiyatlandırma Yöntemi</Label>
  <div className="grid grid-cols-3 gap-2">
    {[
      { v: "bedel", l: "Toplam Bedel", aciklama: "Bedeli böl" },
      { v: "hisse", l: "Hisse Fiyatı", aciklama: "Hisseyi çarp" },
      { v: "kilo", l: "Kilo Bazlı", aciklama: "kg × fiyat" },
    ].map((m) => (
      <button
        key={m.v}
        type="button"
        onClick={() => setFiyatModu(m.v as any)}
        className={cn(
          "flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all",
          fiyatModu === m.v
            ? "border-orange-500 bg-orange-50"
            : "border-input hover:border-orange-300"
        )}
      >
        <span className="text-sm font-semibold">{m.l}</span>
        <span className="text-xs text-muted-foreground">{m.aciklama}</span>
      </button>
    ))}
  </div>
</div>

{/* Mod'a göre değişen giriş alanları */}
{fiyatModu === "bedel" && (
  <div>
    <Label>Toplam Satış Bedeli (₺)</Label>
    <Input inputMode="decimal" value={veri.satisBedeli}
      onChange={(e) => alanGuncelle("satisBedeli", e.target.value)} />
  </div>
)}

{fiyatModu === "hisse" && (
  <div>
    <Label>Hisse Başı Fiyat (₺)</Label>
    <Input inputMode="decimal" value={veri.hisseFiyatiInput}
      onChange={(e) => alanGuncelle("hisseFiyatiInput", e.target.value)} />
  </div>
)}

{fiyatModu === "kilo" && (
  <div className="grid grid-cols-2 gap-2">
    <div>
      <Label>Canlı Ağırlık (kg)</Label>
      <Input inputMode="decimal" value={veri.canliAgirlik}
        onChange={(e) => alanGuncelle("canliAgirlik", e.target.value)} />
    </div>
    <div>
      <Label>Kg Fiyatı (₺)</Label>
      <Input inputMode="decimal" value={veri.kgFiyati}
        onChange={(e) => alanGuncelle("kgFiyati", e.target.value)} />
    </div>
  </div>
)}

{/* CANLI ÖNİZLEME — her zaman göster */}
<div className="rounded-lg bg-stone-50 border p-3 space-y-1">
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Toplam Bedel:</span>
    <span className="font-bold">{formatPara(hesap.satisBedeli)}</span>
  </div>
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Hisse Başı ({hesap.hisseSayisi} hisse):</span>
    <span className="font-bold text-orange-600">{formatPara(hesap.hisseFiyati)}</span>
  </div>
</div>
```

**Submit'te:** `hesap.satisBedeli` API'ye gönderilir. API zaten `satisBedeli / hisseSayisi` yapıyor, değişmesine gerek yok. İstenirse `canliAgirlik`, `kgFiyati`, `fiyatModu` da gönderilir (schema'da varsa).

**API güncellemesi (app/api/hayvanlar/route.ts):**
Zod şemasına opsiyonel alanlar ekle (schema'da varsa):
```typescript
canliAgirlik: z.number().min(0).optional(),
kgFiyati: z.number().min(0).optional(),
fiyatModu: z.enum(["bedel", "hisse", "kilo"]).optional(),
```

---

## 🎯 BÖLÜM B — MOBİL ALT NAVİGASYON + FAB

### Sorun
Mobilde sadece hamburger menü (drawer) var. Saha personeli için sık işlemler parmak altında olmalı.

### Çözüm
1. **Alt navigasyon (bottom nav)** — 5 ikon, sadece mobilde (<lg)
2. **FAB (hızlı işlem)** — sağ alt, "+ " butonu → hızlı menü

### PRE-WRITE GATE (Bölüm B)
```bash
cat shared/components/AppShell.tsx
# lucide-react güvenli iconlar (Beef ÇALIŞIYOR ama temkinli):
# Home, Users, Wallet, Beef, Menu, Plus, X — hepsi var (kanıtlandı)
grep "lucide-react" package.json
```

### Uygulama (Bölüm B)

**Yeni component: shared/components/MobileBottomNav.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Wallet, Beef, Menu } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/hayvanlar", label: "Hayvanlar", icon: Beef },
  { href: "/tahsilat", label: "Tahsilat", icon: Wallet },
  { href: "/musteriler", label: "Müşteri", icon: Users },
];

export function MobileBottomNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-white/95 backdrop-blur lg:hidden">
      {NAV_ITEMS.map((item) => {
        const aktif = pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
              aktif ? "text-orange-600" : "text-muted-foreground"
            )}
          >
            <Icon size={22} strokeWidth={aktif ? 2.5 : 2} />
            <span className={aktif ? "font-semibold" : ""}>{item.label}</span>
          </Link>
        );
      })}
      {/* Daha fazla → drawer aç */}
      <button
        onClick={onMenuClick}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
      >
        <Menu size={22} />
        <span>Menü</span>
      </button>
    </nav>
  );
}
```

**Yeni component: shared/components/MobileHizliIslem.tsx (FAB)**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Beef, Wallet, UserPlus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const HIZLI_EYLEMLER = [
  { href: "/hayvanlar/yeni", label: "Yeni Kurban", icon: Beef, renk: "bg-amber-500" },
  { href: "/tahsilat", label: "Tahsilat Al", icon: Wallet, renk: "bg-green-600" },
  { href: "/musteriler/yeni", label: "Yeni Müşteri", icon: UserPlus, renk: "bg-blue-600" },
];

export function MobileHizliIslem() {
  const [acik, setAcik] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 lg:hidden">
      {/* Açılır eylemler */}
      {acik &&
        HIZLI_EYLEMLER.map((e) => {
          const Icon = e.icon;
          return (
            <Link
              key={e.href}
              href={e.href}
              onClick={() => setAcik(false)}
              className="flex items-center gap-2"
            >
              <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium shadow-lg">
                {e.label}
              </span>
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg", e.renk)}>
                <Icon size={20} />
              </span>
            </Link>
          );
        })}

      {/* Ana FAB butonu */}
      <button
        onClick={() => setAcik((a) => !a)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl transition-transform",
          acik && "rotate-45"
        )}
        aria-label="Hızlı işlem"
      >
        {acik ? <X size={26} /> : <Plus size={26} />}
      </button>
    </div>
  );
}
```

**AppShell.tsx güncelle** — bottom nav + FAB ekle, içeriğe alt boşluk:

```tsx
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHizliIslem } from "./MobileHizliIslem";

// ... mevcut kod ...

return (
  <div className="bg-background flex h-screen">
    <div className="hidden lg:flex">
      <Sidebar kullaniciAdSoyad={oturum.adSoyad} kullaniciRol={oturum.rol} />
    </div>

    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Mobile top bar — mevcut */}
      <header className="...lg:hidden">
        {/* ... mevcut ... */}
      </header>

      {/* İçerik — mobilde alt nav için padding-bottom */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
    </div>

    {/* YENİ: Mobil alt navigasyon + FAB */}
    <MobileBottomNav />
    <MobileHizliIslem />

    <SwGuncellemeUyarisi />
  </div>
);
```

> Not: `MobileBottomNav`'daki "Menü" butonu drawer'ı açmalı. Mevcut `MobileSidebar` drawer state'i nasıl yönetiyorsa ona bağla. Eğer MobileSidebar kendi trigger'ını içeriyorsa, bottom nav'daki Menü butonu o trigger'ı tetiklemeli (ya da MobileSidebar'ı kontrollü hale getir). Bu detayı mevcut MobileSidebar koduna göre çöz.

---

## ✅ TAMAMLAMA KRİTERLERİ

**Bölüm A — Fiyatlandırma:**
- [ ] 3 mod seçici (bedel/hisse/kilo) çalışıyor
- [ ] Canlı önizleme: toplam + hisse başı doğru hesaplanıyor
- [ ] Kilo modu: kg × kg-fiyatı doğru
- [ ] Submit'te doğru satisBedeli gidiyor
- [ ] Mevcut "bedel" modu eskisi gibi çalışıyor (geriye uyumlu)

**Bölüm B — Mobil:**
- [ ] Alt navigasyon 5 ikon (<lg ekranlarda)
- [ ] Aktif sayfa vurgulanıyor (turuncu)
- [ ] FAB sağ altta, tıkla → 3 hızlı eylem açılıyor
- [ ] İçerik alt nav'ın altına gizlenmiyor (pb-16)
- [ ] Desktop'ta bunlar GÖRÜNMÜYOR (lg:hidden)
- [ ] Menü butonu drawer'ı açıyor
- [ ] Konsol hata yok

---

## 🧪 TEST

1. **Fiyat bedel modu:** 350000 gir → hisse 50000 (7 hisse)
2. **Fiyat hisse modu:** 50000 gir → toplam 350000
3. **Fiyat kilo modu:** 500 kg × 700 → toplam 350000, hisse 50000
4. **Mobil (F12 → telefon görünümü 375px):** alt nav görünüyor mu?
5. **FAB:** + bas → 3 eylem çıkıyor mu? "Yeni Kurban" → forma gidiyor mu?
6. **Desktop (1280px):** alt nav + FAB GİZLİ mi?
7. **Aktif vurgulama:** /tahsilat'tayken Tahsilat ikonu turuncu mu?

---

## 📦 COMMIT

```
feat(fiyat+mobil): esnek fiyatlandırma + mobil alt navigasyon

Bölüm A — Esnek Fiyatlandırma:
- 3 mod: Toplam Bedel / Hisse Fiyatı / Kilo Bazlı (kg × fiyat)
- Canlı önizleme (toplam + hisse başı)
- Geriye uyumlu (bedel modu eski davranış)

Bölüm B — Mobil Saha:
- MobileBottomNav: 5 ikon alt navigasyon (<lg)
- MobileHizliIslem: FAB + 3 hızlı eylem (yeni kurban/tahsilat/müşteri)
- AppShell entegrasyonu, içerik pb-16

Etkilenmeyen: schema (opsiyonel kgFiyati/fiyatModu), diğer modüller
```

---

## 🛑 ONAY

PRE-WRITE GATE raporunu ver:
1. YeniKurbanForm mevcut yapısı
2. lucide-react versiyonu + Beef/Plus/Home/Users/Wallet/Menu var mı (kanıtla)
3. MobileSidebar drawer state nasıl yönetiliyor (Menü butonu bağlamak için)
4. Schema'ya kgFiyati/fiyatModu eklensin mi yoksa sadece form hesabı mı?

"Devam et" deyince yaz. Sıra: Önce Bölüm A (fiyat), test, commit → sonra Bölüm B (mobil), test, commit.
