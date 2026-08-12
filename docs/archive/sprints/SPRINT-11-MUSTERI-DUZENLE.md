---
id: ARCH-E7EF7C1D2B01
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 11 — MÜŞTERİ DÜZENLEME SAYFASI

**Hedef:** Mevcut müşteri kaydının bilgilerini güncellemek için PATCH endpoint + UI.
**Süre:** ~30 dk
**Risk:** Düşük — mevcut form'un kopyası, schema değişmiyor.
**Aciliyet:** Bayram için ZORUNLU — isimsiz müşterilerin gerçek bilgilerini girmek için.

---

## 🎯 NEDEN BU SPRINT KRİTİK?

Bayram günü gelecek senaryo:
1. Sistemde "İSİMSİZ DANA-56 H2" müşterisi var (vekili Erdal Bey)
2. Gerçek hissedar Ali Bey gelir, "Ben DANA-56'da hissesahibiyim" der
3. Personel müşteri detayına gider, **"Düzenle"** tıklar
4. Ad Soyad → "ALİ DEMİR", Telefon → "0532..." girer, Kaydet
5. Bütün bağlar korunur (hisse, ödeme, vekalet)

**ŞU AN:** "Düzenle" butonu var, ama tıklanınca 404 — sayfa yok.

---

## 📋 YAPILACAKLAR

### A. PATCH Endpoint: `/api/musteriler/[id]/route.ts`

Mevcut dosyaya `PATCH` handler ekle:

```typescript
import { z } from "zod";

const PatchBody = z.object({
  adSoyad: z.string().min(3).optional(),
  telefon: z.string().nullable().optional(),
  tcKimlik: z.string().nullable().optional(),
  adres: z.string().nullable().optional(),
  notlar: z.string().nullable().optional(),
  etiketler: z.string().nullable().optional(),  // JSON string
});

export async function PATCH(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.guncelle")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }

  const { id } = await params;
  const data = await req.json();
  const parsed = PatchBody.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz veri", detay: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Müşteri var mı?
  const mevcut = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
  });
  if (!mevcut) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 }
    );
  }

  // Sadece gönderilen alanları güncelle
  const guncelleme: Record<string, unknown> = {};
  if (parsed.data.adSoyad !== undefined) guncelleme.adSoyad = parsed.data.adSoyad.trim().toUpperCase();
  if (parsed.data.telefon !== undefined) guncelleme.telefon = parsed.data.telefon;
  if (parsed.data.tcKimlik !== undefined) guncelleme.tcKimlik = parsed.data.tcKimlik;
  if (parsed.data.adres !== undefined) guncelleme.adres = parsed.data.adres;
  if (parsed.data.notlar !== undefined) guncelleme.notlar = parsed.data.notlar;
  if (parsed.data.etiketler !== undefined) guncelleme.etiketler = parsed.data.etiketler;

  const guncel = await prisma.musteri.update({
    where: { id },
    data: guncelleme,
  });

  await auditLog({
    eylem: "guncelle",
    model: "Musteri",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      onceki: {
        adSoyad: mevcut.adSoyad,
        telefon: mevcut.telefon,
        tcKimlik: mevcut.tcKimlik,
        adres: mevcut.adres,
        notlar: mevcut.notlar,
        etiketler: mevcut.etiketler,
      },
      yeni: guncelleme,
    },
  });

  return NextResponse.json({ basarili: true, veri: guncel });
}
```

### B. Düzenleme Sayfası: `app/musteriler/[id]/duzenle/page.tsx`

```tsx
import { redirect, notFound } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { MusteriDuzenleForm } from "./MusteriDuzenleForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function MusteriDuzenlePage({ params }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "musteriler.guncelle")) redirect("/musteriler");

  const { id } = await params;
  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    select: {
      id: true,
      adSoyad: true,
      telefon: true,
      tcKimlik: true,
      adres: true,
      notlar: true,
      etiketler: true,
    },
  });

  if (!musteri) notFound();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Müşteri Düzenle"
        altBaslik={musteri.adSoyad}
      />
      <div className="p-6 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <MusteriDuzenleForm musteri={musteri} />
        </div>
      </div>
    </AppShell>
  );
}
```

### C. Form: `app/musteriler/[id]/duzenle/MusteriDuzenleForm.tsx`

YeniMusteriForm.tsx'in kopyası, küçük farklarla:

- **İlk değerler** mevcut veriden gelir
- **Submit endpoint:** `PATCH /api/musteriler/[id]` (POST değil)
- **Buton metni:** "Güncelle" (Kaydet değil)
- **Tek buton:** "Müşteriyi Güncelle" + İptal (Kaydet+Yeni yok)
- **Yönlendirme:** Güncelleme sonrası `/musteriler/[id]` (geri detay sayfası)
- **Toast:** "✓ {ad} güncellendi"

Önemli alanlar:
- Etiketler: Mevcut etiketler parse edilip toggle olarak yüklenmeli
- Telefon: Mevcut formatlanmamış telefonu `telefonGoster()` ile göster
- Duplikat kontrolü: Kendisi hariç başka müşteri varsa uyarı

Pseudocode:
```tsx
"use client";
import { useState, ... } from "react";

interface Props {
  musteri: {
    id: string;
    adSoyad: string;
    telefon: string | null;
    tcKimlik: string | null;
    adres: string | null;
    notlar: string | null;
    etiketler: string | null;
  };
}

export function MusteriDuzenleForm({ musteri }: Props) {
  // Mevcut etiketleri parse et
  const mevcutEtiketler = useMemo(() => {
    if (!musteri.etiketler) return [];
    try { return JSON.parse(musteri.etiketler); }
    catch { return []; }
  }, [musteri.etiketler]);

  const [veri, setVeri] = useState({
    adSoyad: musteri.adSoyad,
    telefon: musteri.telefon ? telefonGoster(musteri.telefon) : "",
    tcKimlik: musteri.tcKimlik ?? "",
    adres: musteri.adres ?? "",
    notlar: musteri.notlar ?? "",
    etiketler: mevcutEtiketler,
  });

  // ... (validasyon mantığı YeniMusteriForm'la AYNI)

  async function guncelle() {
    const payload = {
      adSoyad: veri.adSoyad.trim(),
      telefon: veri.telefon.trim() ? telefonApiFormat(veri.telefon) : null,
      tcKimlik: veri.tcKimlik.trim() || null,
      adres: veri.adres.trim() || null,
      notlar: veri.notlar.trim() || null,
      etiketler: veri.etiketler.length > 0 ? JSON.stringify(veri.etiketler) : null,
    };

    const r = await fetch(`/api/musteriler/${musteri.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) throw new Error("Güncelleme başarısız");

    toast.success(`✓ ${veri.adSoyad} güncellendi`);
    router.push(`/musteriler/${musteri.id}`);
    router.refresh();
  }

  // JSX: YeniMusteriForm ile aynı UI, sadece buton:
  return (
    <form onSubmit={...}>
      {/* Kart 1 ve Kart 2: AYNI */}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
        <Button variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
        <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
          <Save className="h-4 w-4 mr-1.5" />
          Müşteriyi Güncelle
        </Button>
      </div>
    </form>
  );
}
```

---

## ⛔ DOKUNMA

- Schema
- Diğer modüller (hisse, ödeme, tahsilat)
- Yeni müşteri formu (mevcut çalışıyor)
- Helper'lar (`telefon-format`, `tc-dogrula`, `etiketler`)
- DELETE endpoint
- Müşteri detay sayfası ana yapısı

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] `PATCH /api/musteriler/[id]` çalışıyor (zod validasyon dahil)
- [ ] `/musteriler/[id]/duzenle` sayfa açılıyor (mevcut veri yüklü)
- [ ] Tüm alanlar (ad, tel, TC, adres, notlar, etiketler) güncellenebilir
- [ ] Etiketler mevcut JSON'dan parse ediliyor, toggle çalışıyor
- [ ] Validasyon mantığı YeniMusteriForm ile aynı
- [ ] Güncelleme sonrası `/musteriler/[id]` detay sayfasına dönüyor
- [ ] Toast bildirimi görünüyor
- [ ] Audit log kaydı atılıyor (önceki + yeni değerler)
- [ ] Yetki kontrolü: `musteriler.guncelle` izni olmayan giremiyor
- [ ] Müşteri detay sayfasındaki "Düzenle" butonu artık 404 değil

---

## 🧪 TEST

1. `/musteriler/{bir_id}` aç
2. "Düzenle" tıkla → form açılır, mevcut veriler dolu
3. Ad Soyad değiştir → "Güncelle" → detay sayfasında yeni ad görünür
4. Etiket ekle → güncelle → detayda etiket görünür
5. Boş telefonu doldur → güncelle → kayıt değişir
6. İzleyici hesabıyla dene → "Yetki yok" alır

---

## 📦 COMMIT

```
feat(musteriler): müşteri düzenleme — PATCH endpoint + UI sayfası

- PATCH /api/musteriler/[id]: kısmi güncelleme + audit log
- /musteriler/[id]/duzenle: mevcut form'un kopyası
- Tüm validasyon ve helper'lar yeniden kullanıldı
- Etiketler JSON parse + serialize döngüsü çalışıyor

Sebep: İsimsiz/bilinmeyen müşterilerin bayram günü gerçek bilgileriyle
güncellenebilmesi için zorunlu. "Düzenle" butonu artık 404 değil.

Etkilenmeyen: schema, diğer modüller, yeni müşteri formu
```
