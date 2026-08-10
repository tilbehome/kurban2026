# 🎯 SPRINT-9 — TV KONTROL PANELİ: KURBAN BAZLI + 6 AŞAMA

**Amaç:** TV Kontrol Paneli şu an **hisse bazlı** (260 satır) ve **12 aşama** gösteriyor. Olması gereken:
- **Kurban bazlı** (63 satır, her satır 1 dana)
- **6 aşama** (Beklemede / Vekalet / Kesim / Parçalama / Tartım / Teslim)
- Sütunlar: **KURBAN NO + KÜPE NO + DURUM + AŞAMA + İLERLEME**
- Hissedar isimleri SOL listede **YOK** (kurban kartına tıklayınca detay açılır, isteğe bağlı)

Bayrama 36 saat var. Risk minimum: **sistem 12 aşamayı arka planda kullanmaya devam edecek**, sadece UI ve seçim 6 aşamaya gruplanacak.

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- `/api/tahsilat/odeme` ve tüm KUTSAL endpoint'ler
- Mevcut 12 aşama sistemi (`asama-akisi.ts` `KurbanKesimDurumu`, `ASAMA_SIRASI`)
- `/api/tv/kurban-asama` endpoint'i (kullanıcı bazlı geçiş)
- `/api/tv/kesim-durum` endpoint'i (admin manuel override)
- `kurbanAsamaGuncelle()` atomic transaction
- `/tv/personel` mobil saha paneli (zaten kurban bazlı)
- `/tv` public canlı ekran (PII korumalı)
- Schema (hiçbir değişiklik yok)

**Sadece UI değişiyor. Veri akışı aynı.**

---

## 📋 İŞ 1 — Yeni helper dosyası: 12→6 aşama gruplama

Yeni dosya: `modules/tv/lib/asama-grup.ts`

```ts
/**
 * 12 detaylı aşama → 6 görünür aşama gruplama.
 *
 * Backend (DB) 12 aşamada kalır — sistem bozulmaz.
 * Bu dosya sadece UI için "user-friendly" gruplandırma yapar.
 *
 * Rapor isteği:
 *   1. Beklemede / Sıradaki
 *   2. Vekalet / Onay
 *   3. Kesim
 *   4. Parçalama
 *   5. Tartım
 *   6. Teslim
 */

import type { KurbanKesimDurumu } from "./asama-akisi";

export type AsamaGrubu =
  | "beklemede"
  | "vekalet"
  | "kesim"
  | "parcalama"
  | "tartim"
  | "teslim"
  | "tamamlandi"
  | "iptal";

export const ASAMA_GRUBU_SIRASI: AsamaGrubu[] = [
  "beklemede",
  "vekalet",
  "kesim",
  "parcalama",
  "tartim",
  "teslim",
  "tamamlandi",
];

export const GRUP_ETIKETLERI: Record<AsamaGrubu, string> = {
  beklemede: "Beklemede / Sıradaki",
  vekalet: "Vekalet / Onay",
  kesim: "Kesim",
  parcalama: "Parçalama",
  tartim: "Tartım",
  teslim: "Teslim",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const GRUP_KISA_ETIKET: Record<AsamaGrubu, string> = {
  beklemede: "Beklemede",
  vekalet: "Vekalet",
  kesim: "Kesim",
  parcalama: "Parçalama",
  tartim: "Tartım",
  teslim: "Teslim",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const GRUP_RENKLERI: Record<AsamaGrubu, string> = {
  beklemede: "bg-slate-100 text-slate-700 border-slate-300",
  vekalet: "bg-amber-100 text-amber-700 border-amber-300",
  kesim: "bg-orange-100 text-orange-700 border-orange-300",
  parcalama: "bg-pink-100 text-pink-700 border-pink-300",
  tartim: "bg-blue-100 text-blue-700 border-blue-300",
  teslim: "bg-green-100 text-green-700 border-green-300",
  tamamlandi: "bg-emerald-100 text-emerald-700 border-emerald-300",
  iptal: "bg-red-100 text-red-700 border-red-300",
};

export const GRUP_EMOJI: Record<AsamaGrubu, string> = {
  beklemede: "⏳",
  vekalet: "📜",
  kesim: "🔪",
  parcalama: "🥩",
  tartim: "⚖️",
  teslim: "✅",
  tamamlandi: "🎉",
  iptal: "❌",
};

/**
 * 12'li detay aşamayı 6'lı gruba çevirir.
 */
export function durumuGrupla(durum: KurbanKesimDurumu): AsamaGrubu {
  switch (durum) {
    case "beklemede":
    case "siradaki":
      return "beklemede";
    case "vekalet_bekliyor":
      return "vekalet";
    case "hazirlik":
    case "kesimde":
    case "deri_yuzme":
      return "kesim";
    case "parcalama":
      return "parcalama";
    case "tartimda":
      return "tartim";
    case "paketleme":
    case "teslime_hazir":
      return "teslim";
    case "tamamlandi":
      return "tamamlandi";
    case "iptal":
      return "iptal";
    default:
      return "beklemede";
  }
}

/**
 * Bir gruba geçiş yapılırken hangi detay duruma yazılacak?
 * (Kullanıcı "Kesim" seçti → backend "kesimde" yazar)
 */
export function gruptanIlkDuruma(grup: AsamaGrubu): KurbanKesimDurumu {
  switch (grup) {
    case "beklemede":
      return "beklemede";
    case "vekalet":
      return "vekalet_bekliyor";
    case "kesim":
      return "kesimde";
    case "parcalama":
      return "parcalama";
    case "tartim":
      return "tartimda";
    case "teslim":
      return "teslime_hazir";
    case "tamamlandi":
      return "tamamlandi";
    case "iptal":
      return "iptal";
  }
}

/**
 * Bir sonraki grup (UI'da "İlerlet" butonu için).
 */
export function sonrakiGrup(mevcut: AsamaGrubu): AsamaGrubu | null {
  if (mevcut === "iptal" || mevcut === "tamamlandi") return null;
  const idx = ASAMA_GRUBU_SIRASI.indexOf(mevcut);
  if (idx === -1 || idx === ASAMA_GRUBU_SIRASI.length - 1) return null;
  return ASAMA_GRUBU_SIRASI[idx + 1];
}

/**
 * Önceki grup (geri al).
 */
export function oncekiGrup(mevcut: AsamaGrubu): AsamaGrubu | null {
  const idx = ASAMA_GRUBU_SIRASI.indexOf(mevcut);
  if (idx <= 0) return null;
  return ASAMA_GRUBU_SIRASI[idx - 1];
}
```

---

## 📋 İŞ 2 — `app/tv/kontrol/page.tsx` REWRITE (hisse → kurban)

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Tv, ArrowLeft, Settings, Smartphone } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { TvKontrolClient } from "@/modules/tv/components/TvKontrolClient";
import { AcilDurumKart } from "@/modules/tv/components/admin/AcilDurumKart";
import { SiraYonetimKart } from "@/modules/tv/components/admin/SiraYonetimKart";
import type { KurbanKesimDurumu } from "@/modules/tv/lib/asama-akisi";
import type { KontrolKurbanSatir } from "@/modules/tv/components/TvKontrolClient";
import type { SiraSatir } from "@/modules/tv/components/admin/SiraYonetimKart";

export const dynamic = "force-dynamic";

export default async function TvKontrolPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            TV kontrol yetkiniz yok.
          </p>
        </div>
      </AppShell>
    );
  }

  // KURBAN BAZLI sorgu (hisse bazlı DEGIL)
  const [kurbanlarRaw, sirayaAlinanlarRaw, acilKey, acilMesajKey] =
    await Promise.all([
      prisma.kurban.findMany({
        where: { silindiMi: false },
        orderBy: [
          { operasyonSira: "asc" },
          { kesimSirasi: "asc" },
        ],
        select: {
          id: true,
          kesimSirasi: true,
          kupeNo: true,
          hisseGrubu: true,
          kesimDurumu: true,
          operasyonSira: true,
          asama: true,
          ilerlemeYuzde: true,
          kalanSureDk: true,
          kesimBaslama: true,
          hisseler: {
            where: { silindiMi: false },
            select: {
              id: true,
              musteriId: true,
              vekaletAlindi: true,
            },
          },
        },
      }),
      prisma.kurban.findMany({
        where: {
          silindiMi: false,
          kesimDurumu: { in: ["siradaki", "vekalet_bekliyor", "hazirlik"] },
        },
        orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
        take: 30,
        select: {
          id: true,
          kesimSirasi: true,
          operasyonSira: true,
          kesimDurumu: true,
        },
      }),
      prisma.tvAyari.findUnique({ where: { anahtarKey: "acil_durum_aktif" } }),
      prisma.tvAyari.findUnique({ where: { anahtarKey: "acil_durum_mesaj" } }),
    ]);

  const kurbanlar: KontrolKurbanSatir[] = kurbanlarRaw.map((k) => {
    const doluHisse = k.hisseler.filter((h) => h.musteriId).length;
    const vekaletAlinan = k.hisseler.filter((h) => h.vekaletAlindi).length;
    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo ?? null,
      hisseGrubu: k.hisseGrubu ?? null,
      kesimDurumu: k.kesimDurumu as KurbanKesimDurumu,
      operasyonSira: k.operasyonSira ?? null,
      asama: k.asama ?? null,
      ilerlemeYuzde: k.ilerlemeYuzde,
      kalanSureDk: k.kalanSureDk,
      kesimBaslama: k.kesimBaslama?.toISOString() ?? null,
      hisseDolu: doluHisse,
      hisseToplam: k.hisseler.length,
      vekaletAlinan,
    };
  });

  const siraSatirlar: SiraSatir[] = sirayaAlinanlarRaw.map((k, i) => ({
    id: k.id,
    kesimSirasi: k.kesimSirasi,
    operasyonSira: k.operasyonSira ?? i + 1,
    kesimDurumu: k.kesimDurumu,
  }));

  const acilDurumAktif = acilKey?.deger === "true";
  const acilDurumMesaj = acilMesajKey?.deger ?? null;
  const adminMiResult = adminMi(oturum.rol);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="TV Kontrol Paneli"
        altBaslik={`${kurbanlar.length} kurban · ${siraSatirlar.length} sıradaki`}
        aksiyonlar={
          <div className="flex gap-2">
            <Link
              href="/tv"
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"}
            >
              <Tv size={14} />
              TV (yeni sekme)
            </Link>
            <Link
              href="/tv/personel"
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"}
            >
              <Smartphone size={14} />
              Personel Paneli
            </Link>
            <Link
              href="/tv/ayarlar"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"}
            >
              <Settings size={14} />
              Ayarlar
            </Link>
            <Link
              href="/"
              className={buttonVariants({ variant: "ghost", size: "sm" }) + " gap-1.5"}
            >
              <ArrowLeft size={14} />
              Ana Sayfa
            </Link>
          </div>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {adminMiResult && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AcilDurumKart ilkAktif={acilDurumAktif} ilkMesaj={acilDurumMesaj} />
            <SiraYonetimKart ilkSira={siraSatirlar} />
          </div>
        )}

        <TvKontrolClient kurbanlar={kurbanlar} />

        {adminMiResult && (
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                TV Canlı Önizleme
              </h3>
              <Link href="/tv" target="_blank" className="text-xs text-orange-600 underline">
                Tam ekran aç →
              </Link>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
              <iframe
                src="/tv"
                title="TV Canlı Önizleme"
                className="h-full w-full"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

---

## 📋 İŞ 3 — `modules/tv/components/TvKontrolClient.tsx` REWRITE

**Eski hisse bazlı kod TAMAMEN değiştirilecek**. Yeni versiyon:

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Save, Play, CheckCircle2, ChevronRight, ChevronLeft, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";
import type { KurbanKesimDurumu } from "@/modules/tv/lib/asama-akisi";
import {
  ASAMA_GRUBU_SIRASI,
  GRUP_ETIKETLERI,
  GRUP_KISA_ETIKET,
  GRUP_RENKLERI,
  GRUP_EMOJI,
  durumuGrupla,
  gruptanIlkDuruma,
  sonrakiGrup,
  oncekiGrup,
  type AsamaGrubu,
} from "@/modules/tv/lib/asama-grup";

export interface KontrolKurbanSatir {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  hisseGrubu: string | null;
  kesimDurumu: KurbanKesimDurumu;
  operasyonSira: number | null;
  asama: string | null;
  ilerlemeYuzde: number;
  kalanSureDk: number | null;
  kesimBaslama: string | null;
  hisseDolu: number;
  hisseToplam: number;
  vekaletAlinan: number;
}

interface TvKontrolClientProps {
  kurbanlar: KontrolKurbanSatir[];
}

export function TvKontrolClient({ kurbanlar }: TvKontrolClientProps) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [filtreGrup, setFiltreGrup] = useState<AsamaGrubu | "tum">("tum");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [bekleniyor, startTransition] = useTransition();

  // Düzenleme state
  const [editGrup, setEditGrup] = useState<AsamaGrubu>("beklemede");
  const [editSira, setEditSira] = useState<string>("");
  const [editIlerleme, setEditIlerleme] = useState<number>(0);
  const [editKalanDk, setEditKalanDk] = useState<string>("");

  // Filtre + arama
  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return kurbanlar.filter((k) => {
      const grup = durumuGrupla(k.kesimDurumu);
      if (filtreGrup !== "tum" && grup !== filtreGrup) return false;
      if (q.length === 0) return true;
      return (
        k.kesimSirasi.toString().includes(q) ||
        k.kupeNo?.toLowerCase().includes(q) ||
        k.operasyonSira?.toString().includes(q)
      );
    });
  }, [kurbanlar, arama, filtreGrup]);

  // Grup başına sayım
  const grupSayim = useMemo(() => {
    const sayim: Record<AsamaGrubu, number> = {
      beklemede: 0, vekalet: 0, kesim: 0, parcalama: 0,
      tartim: 0, teslim: 0, tamamlandi: 0, iptal: 0,
    };
    kurbanlar.forEach((k) => {
      sayim[durumuGrupla(k.kesimDurumu)]++;
    });
    return sayim;
  }, [kurbanlar]);

  function secVeYukle(k: KontrolKurbanSatir) {
    setSeciliId(k.id);
    setEditGrup(durumuGrupla(k.kesimDurumu));
    setEditSira(k.operasyonSira?.toString() ?? "");
    setEditIlerleme(k.ilerlemeYuzde);
    setEditKalanDk(k.kalanSureDk?.toString() ?? "");
  }

  async function asamaGuncelle(
    kurbanId: string,
    hedefGrup: AsamaGrubu,
  ) {
    const yeniDurum = gruptanIlkDuruma(hedefGrup);
    try {
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kurbanId, yeniDurum }),
      });
      const sonuc = await yanit.json();
      if (!yanit.ok || !sonuc.basarili) {
        throw new Error(sonuc.hata ?? "Güncelleme başarısız");
      }
      toast.success(`${GRUP_KISA_ETIKET[hedefGrup]} aşamasına geçti`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  }

  function ilerlet(k: KontrolKurbanSatir) {
    const mevcutGrup = durumuGrupla(k.kesimDurumu);
    const sonraki = sonrakiGrup(mevcutGrup);
    if (!sonraki) {
      toast.info("Son aşamada");
      return;
    }
    startTransition(() => asamaGuncelle(k.id, sonraki));
  }

  function geriAl(k: KontrolKurbanSatir) {
    const mevcutGrup = durumuGrupla(k.kesimDurumu);
    const onceki = oncekiGrup(mevcutGrup);
    if (!onceki) {
      toast.info("İlk aşamada");
      return;
    }
    if (!confirm(`${k.kesimSirasi} numaralı kurbanı bir önceki aşamaya (${GRUP_KISA_ETIKET[onceki]}) geri almak istiyor musunuz?`)) {
      return;
    }
    startTransition(() => asamaGuncelle(k.id, onceki));
  }

  function durumKaydet() {
    if (!seciliId) return;
    startTransition(() => asamaGuncelle(seciliId, editGrup));
  }

  function ilerlemeKaydet() {
    if (!seciliId) return;
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/ilerleme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kurbanId: seciliId,
            ilerlemeYuzde: editIlerleme,
            kalanSureDk: editKalanDk ? Number(editKalanDk) : null,
          }),
        });
        const sonuc = await yanit.json();
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Güncelleme başarısız");
        }
        toast.success("İlerleme güncellendi");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  const secili = kurbanlar.find((k) => k.id === seciliId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Sol: Filtre + Kurban Listesi */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Kurban Listesi · {filtreli.length} / {kurbanlar.length}
            </CardTitle>
          </div>

          {/* Grup chip filtreleri */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFiltreGrup("tum")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filtreGrup === "tum"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50",
              )}
            >
              Tümü ({kurbanlar.length})
            </button>
            {ASAMA_GRUBU_SIRASI.map((g) => (
              <button
                key={g}
                onClick={() => setFiltreGrup(g)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filtreGrup === g
                    ? GRUP_RENKLERI[g] + " border-current"
                    : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50",
                )}
              >
                {GRUP_EMOJI[g]} {GRUP_KISA_ETIKET[g]} ({grupSayim[g]})
              </button>
            ))}
          </div>

          {/* Arama */}
          <div className="relative mt-2">
            <Search size={14} className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2" />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kurban no, küpe no, sıra ile ara"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 sticky top-0 z-10">
                <tr className="border-b text-left text-[11px] font-semibold tracking-wider uppercase">
                  <th className="px-3 py-2">Kurban No</th>
                  <th className="px-3 py-2">Küpe No</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2 text-center">Hisse</th>
                  <th className="px-3 py-2 text-center">Sıra</th>
                  <th className="px-3 py-2 text-center">%</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtreli.map((k) => {
                  const grup = durumuGrupla(k.kesimDurumu);
                  const sonraki = sonrakiGrup(grup);
                  return (
                    <tr
                      key={k.id}
                      className={cn(
                        "hover:bg-stone-50 border-b transition-colors cursor-pointer",
                        seciliId === k.id && "bg-orange-50",
                      )}
                      onClick={() => secVeYukle(k)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="font-mono font-bold text-base text-stone-900">
                            {k.kesimSirasi}
                          </div>
                          {k.hisseGrubu && (
                            <span className="text-[10px] text-orange-700 font-medium">
                              {k.hisseGrubu}KG
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-stone-600">
                        {k.kupeNo ?? <span className="italic text-stone-400">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            GRUP_RENKLERI[grup],
                          )}
                        >
                          {GRUP_EMOJI[grup]} {GRUP_KISA_ETIKET[grup]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Users size={11} className="text-stone-400" />
                          {k.hisseDolu}/{k.hisseToplam}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-mono">
                        {k.operasyonSira ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        {k.ilerlemeYuzde > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <div className="w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500"
                                style={{ width: `${k.ilerlemeYuzde}%` }}
                              />
                            </div>
                            <span className="font-mono">%{k.ilerlemeYuzde}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {grup !== "tamamlandi" && grup !== "iptal" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => geriAl(k)}
                              disabled={bekleniyor || oncekiGrup(grup) === null}
                              className="h-7 w-7 p-0"
                              title="Geri al"
                            >
                              <ChevronLeft size={14} />
                            </Button>
                          )}
                          {sonraki && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => ilerlet(k)}
                              disabled={bekleniyor}
                              className="h-7 px-2 text-[11px] gap-1"
                            >
                              {GRUP_KISA_ETIKET[sonraki]}
                              <ChevronRight size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtreli.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-muted-foreground py-12 text-center text-xs">
                      Sonuç yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sağ: Düzenleme Paneli */}
      <Card className="lg:sticky lg:top-4 lg:h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {secili ? (
              <>
                Kurban <span className="font-mono text-orange-600">#{secili.kesimSirasi}</span>
              </>
            ) : (
              "Düzenleme Paneli"
            )}
          </CardTitle>
          {secili && secili.kupeNo && (
            <p className="text-xs text-muted-foreground font-mono">Küpe: {secili.kupeNo}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!secili ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Soldan bir kurban seçin
            </p>
          ) : (
            <>
              {/* Hisse durumu özet */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 rounded-md p-2">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Dolu Hisse</div>
                  <div className="font-mono font-bold text-stone-900">
                    {secili.hisseDolu}/{secili.hisseToplam}
                  </div>
                </div>
                <div className="bg-stone-50 rounded-md p-2">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Vekalet</div>
                  <div className="font-mono font-bold text-stone-900">
                    {secili.vekaletAlinan}/{secili.hisseDolu}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Aşama</Label>
                <select
                  value={editGrup}
                  onChange={(e) => setEditGrup(e.target.value as AsamaGrubu)}
                  className="border-input bg-background h-10 rounded-md border px-2 text-sm"
                >
                  {ASAMA_GRUBU_SIRASI.map((g) => (
                    <option key={g} value={g}>
                      {GRUP_EMOJI[g]} {GRUP_ETIKETLERI[g]}
                    </option>
                  ))}
                  <option value="iptal">❌ İptal</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Operasyon Sırası</Label>
                <Input
                  inputMode="numeric"
                  value={editSira}
                  onChange={(e) => setEditSira(e.target.value)}
                  placeholder="örn. 5"
                  className="h-10 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Bu kurbanın kesim sırasındaki konumu
                </p>
              </div>

              <Button
                type="button"
                onClick={durumKaydet}
                disabled={bekleniyor}
                className="w-full h-11"
              >
                <Save size={14} />
                Aşamayı Kaydet
              </Button>

              <div className="border-t pt-3" />

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  İlerleme: <strong className="font-mono text-orange-600">%{editIlerleme}</strong>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={editIlerleme}
                  onChange={(e) => setEditIlerleme(Number(e.target.value))}
                  className="w-full accent-orange-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Kalan Süre (dakika)</Label>
                <Input
                  inputMode="numeric"
                  value={editKalanDk}
                  onChange={(e) => setEditKalanDk(e.target.value)}
                  placeholder="örn. 8"
                  className="h-10 text-sm"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={ilerlemeKaydet}
                disabled={bekleniyor}
                className="w-full h-11"
              >
                <Save size={13} />
                İlerleme Kaydet
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📋 İŞ 4 — `/api/tv/ilerleme/route.ts` GÜNCELLE

Eski endpoint `hisseId` alıyordu. Şimdi `kurbanId` alacak:

```ts
// app/api/tv/ilerleme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { auditYaz } from "@/shared/lib/audit";

const sema = z.object({
  // Eski: hisseId (geriye uyum)
  hisseId: z.string().optional(),
  // Yeni: kurbanId
  kurbanId: z.string().optional(),
  ilerlemeYuzde: z.number().int().min(0).max(100),
  kalanSureDk: z.number().int().nullable().optional(),
  asama: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 401 });
  }

  const body = await req.json();
  const parse = sema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ basarili: false, hata: "Geçersiz veri" }, { status: 400 });
  }

  const { hisseId, kurbanId, ilerlemeYuzde, kalanSureDk, asama } = parse.data;

  if (!hisseId && !kurbanId) {
    return NextResponse.json({ basarili: false, hata: "hisseId veya kurbanId gerekli" }, { status: 400 });
  }

  try {
    if (kurbanId) {
      // KURBAN BAZLI (yeni)
      await prisma.kurban.update({
        where: { id: kurbanId },
        data: {
          ilerlemeYuzde,
          kalanSureDk: kalanSureDk ?? null,
          ...(asama ? { asama } : {}),
        },
      });
      // Tüm hisseleri de senkronize et
      await prisma.hisse.updateMany({
        where: { kurbanId, silindiMi: false },
        data: {
          ilerlemeYuzde,
          kalanSureDk: kalanSureDk ?? null,
          ...(asama ? { asama } : {}),
        },
      });
      await auditYaz({
        eylem: "tv-ilerleme-guncelle",
        model: "Kurban",
        kayitId: kurbanId,
        kullaniciId: oturum.kullaniciId,
        detaylar: JSON.stringify({ ilerlemeYuzde, kalanSureDk, asama }),
      });
    } else if (hisseId) {
      // HİSSE BAZLI (eski - geriye uyum)
      await prisma.hisse.update({
        where: { id: hisseId },
        data: {
          ilerlemeYuzde,
          kalanSureDk: kalanSureDk ?? null,
          ...(asama ? { asama } : {}),
        },
      });
    }

    return NextResponse.json({ basarili: true });
  } catch (e) {
    console.error("[tv/ilerleme] hata:", e);
    return NextResponse.json({ basarili: false, hata: "Güncelleme başarısız" }, { status: 500 });
  }
}
```

---

## 📋 İŞ 5 — TV Canlı Ekran (`/tv`) güncellemesi

`modules/tv/components/TvAnaSutunlar.tsx` (veya hangi dosya 4 sütun gösteriyorsa) **kontrol et**. Şu an muhtemelen 4 sütun:

- Sıradakiler
- Şu An Kesimde
- Şu An Tartımda
- Teslime Hazır

Raporundaki TV mantığına göre **6 sütun olmalı** ama TV ekranı **büyük monitor** için, 6 sütun fazla sıkışır. Mevcut 4 sütun bayrama yetişir. **Dokunma**.

(Bayram sonrası: TV ekranını 6 sütuna çevirme isteğe bağlı.)

---

## 📋 İŞ 6 — Sidebar'da "Hisse Listesi" yazısını "Kurban Listesi" yap

Kullanıcı ekran görüntüsünde `Hisse Listesi · 260 kayıt` yazıyordu. Yukarıdaki `TvKontrolClient` zaten `Kurban Listesi · X / Y` yazıyor — otomatik düzelir. **Ek iş yok.**

---

## ✅ TEST AKIŞI

```bash
pnpm tsc --noEmit
pnpm build
pnpm dev
```

Tarayıcıda:

1. **`/tv/kontrol`** aç
2. **"Kurban Listesi · 63 kayıt"** görmelisin (260 değil!)
3. Her satırda **KURBAN NO + KÜPE NO + DURUM + HİSSE + SIRA + %** olmalı
4. **Hissedar isimleri SOL listede OLMAMALI** (sadece "5/7" gibi hisse sayısı)
5. **6 chip filtre**: Tümü / Beklemede / Vekalet / Kesim / Parçalama / Tartım / Teslim / Tamamlandı
6. Bir kurban satırına tıkla → sağ panel açılır
7. Sağ panelde **6 aşamalı dropdown** (12 değil!)
8. **Sağ panelde**: Dolu Hisse 5/7 · Vekalet 3/5 mini kartlar
9. Liste satırının sağında: **← Geri Al butonu** + **İlerlet → butonu** (Vekalet → Kesim → Parçalama...)
10. "İlerlet" tıkla → durum bir grup ileri gider + toast bildirim
11. Filtre chip'lerine tıkla → sayım doğru gelir (Tümü 63, Beklemede 50, vs.)
12. Arama "1" yaz → DANA-1, DANA-10, DANA-11... çıkar
13. Arama "TR-1234" küpe ile → o kurban çıkar

**KUTSAL kontrolü:**
- Tahsilat hâlâ çalışıyor mu? `/tahsilat/musteri/[id]` → ödeme al → ABH-2026-NNN üretilmeli
- Personel paneli `/tv/personel` → 12 detaylı aşama hâlâ var (değişmedi)
- TV canlı ekran `/tv` → değişmedi

---

## 🚨 KRİTİK NOTLAR

1. **`/api/tv/kurban-asama` zaten kurban bazlı** — yeni endpoint yazılmıyor, mevcut kullanılıyor
2. **12 aşama → 6 gruba** sadece UI'da gruplandı. DB'de yine 12 detay var
3. **Personel paneli (`/tv/personel`) etkilenmez** — orada detaylı 12 aşama lazım (kesim → deri yüzme → parçalama gibi alt adımlar saha personeli için anlamlı)
4. **TV canlı ekran (`/tv`) etkilenmez** — müşteri görüntüsü, dokunulmaz
5. **Hissedar listesi** kontrol panelinde GİZLİ ama personel kartı tıklayınca detayda görünür (zaten öyle, dokunma)

---

## 🎁 BONUS — Hissedar detay modal (opsiyonel, isteğe göre eklenir)

İsteğe göre: Kurban satırına çift tıklayınca veya "Detay" butonu eklenip modal açılır. İçinde 7 hissedar ismi, telefon, ödeme durumu. Bu **opsiyonel**, bayrama yetişmez ise bayram sonrası eklersin.

Eklemek istersen ayrıca prompt veririm.

---

## 📊 RAPOR FORMATI

Bittiğinde:

```
✅ Commit SHA: ...
✅ pnpm tsc --noEmit temiz
✅ pnpm build temiz
✅ /tv/kontrol açıldı: "Kurban Listesi · 63" görünüyor
✅ 6 chip filtre çalışıyor (sayım doğru)
✅ Geri al / İlerlet butonları çalışıyor
✅ Sağ panel kurban bazlı (hisse değil)
✅ Tahsilat KUTSAL test: ABH-2026-000XXX olustu
✅ /tv/personel etkilenmedi (12 aşama hâlâ var)
✅ /tv canlı ekran etkilenmedi
```

**Süre tahmini: 60-90 dakika.**
