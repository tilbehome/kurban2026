---
id: ARCH-1B5A54729288
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 13 — KESİM SIRASI DETAYLI MUHASEBE RAPORU

**Hedef:** Kesim sırasına göre, her hayvanın hissedarları + ödeme detayları (nakit/havale/kart ayrı) gösteren kapsamlı muhasebe raporu.
**Sebep:** Hesaplarda sorun çıktı, her işlemin detaylı dökümü gerekli.
**Süre:** ~1.5 saat
**Aciliyet:** ACİL
**Risk:** Düşük — sadece okuma + yeni rapor sayfası.

---

## 🎯 NE İSTENİYOR?

Kesim sırasına göre (DANA-1, DANA-2...) tablo:
- **Her hayvan:** kesim no, hisse sayısı, satış bedeli
- **Her hissedar:** ad, telefon, hisse fiyatı
- **Cari işlemler:** her ödeme ayrı satır — tarih, nakit, havale, kart, toplam, dekont no
- **Özet:** hisse bazında ödenen/kalan, hayvan bazında toplam

Hem **ekranda görüntüleme** hem **A4 yazdırma** olmalı.

---

## ⛔ DOKUNMA

- Schema (`Kurban`, `Hisse`, `Odeme`, `Musteri` — sadece okunacak)
- Diğer raporlar/sayfalar
- Tahsilat akışı
- Auth/izin

---

## 📋 PRE-WRITE GATE

```bash
# Mevcut kesim listesi raporuna bak (referans için)
cat app/raporlar/kesim-listesi/page.tsx 2>/dev/null | head -50
ls modules/raporlar/components/ 2>/dev/null

# rapor.service.ts mevcut fonksiyonlar
grep -n "export async function\|export function" modules/raporlar/lib/rapor.service.ts

# Print pattern (mevcut yazdırma sayfalarından)
ls app/musteriler/borclular/yazdir/ 2>/dev/null
```

**Raporla:**
- `lucide-react` versiyonu nedir? (Önceki sorunda Beef icon yoktu — sadece temel iconlar kullan: FileText, Printer, Download — bunlar her versiyonda var)
- Mevcut `formatPara`, `formatTarih` helper'ları nerede?
- Kesim listesi sayfası nasıl yapılmış? (referans alınabilir)

---

## 🎯 ONAY SONRASI YAPILACAKLAR

### 1. Backend: rapor.service.ts'e yeni fonksiyon

```typescript
export interface KesimMuhasebeOdeme {
  dekontNo: string;
  tarih: string;          // ISO
  nakit: number;
  havale: number;
  kart: number;
  toplamTutar: number;
  yontem: string;
  iptal: boolean;
}

export interface KesimMuhasebeHisse {
  hisseNo: number;
  musteriAdi: string | null;
  telefon: string | null;
  hisseFiyati: number;
  toplamOdenen: number;
  kalan: number;
  vekaletAlindi: boolean;
  odemeler: KesimMuhasebeOdeme[];
}

export interface KesimMuhasebeKurban {
  kesimSirasi: number;
  kupeNo: string | null;
  hisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  // Yöntem bazlı toplam (hayvan seviyesinde)
  toplamNakit: number;
  toplamHavale: number;
  toplamKart: number;
  hisseler: KesimMuhasebeHisse[];
}

export async function kesimMuhasebeRaporu(): Promise<KesimMuhasebeKurban[]> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { adSoyad: true, telefon: true } },
          odemeler: {
            orderBy: { tarih: "asc" },
            select: {
              dekontNo: true,
              tarih: true,
              nakit: true,
              havale: true,
              kart: true,
              toplamTutar: true,
              yontem: true,
              iptal: true,
            },
          },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const hisseler: KesimMuhasebeHisse[] = k.hisseler.map((h) => {
      // İptal olmayan ödemeler
      const gecerliOdemeler = h.odemeler.filter((o) => !o.iptal);
      const toplamOdenen = yuvarla(
        topla(...gecerliOdemeler.map((o) => o.toplamTutar)),
      );
      const kalan = yuvarla(h.hisseFiyati - toplamOdenen);

      return {
        hisseNo: h.no,
        musteriAdi: h.musteri?.adSoyad ?? null,
        telefon: h.musteri?.telefon ?? null,
        hisseFiyati: yuvarla(h.hisseFiyati),
        toplamOdenen,
        kalan,
        vekaletAlindi: h.vekaletAlindi,
        odemeler: h.odemeler.map((o) => ({
          dekontNo: o.dekontNo,
          tarih: o.tarih.toISOString(),
          nakit: o.nakit,
          havale: o.havale,
          kart: o.kart,
          toplamTutar: o.toplamTutar,
          yontem: o.yontem,
          iptal: o.iptal,
        })),
      };
    });

    // Hayvan seviyesi toplamlar (iptal olmayan ödemelerden)
    const tumOdemeler = k.hisseler.flatMap((h) =>
      h.odemeler.filter((o) => !o.iptal),
    );
    const toplamNakit = yuvarla(topla(...tumOdemeler.map((o) => o.nakit)));
    const toplamHavale = yuvarla(topla(...tumOdemeler.map((o) => o.havale)));
    const toplamKart = yuvarla(topla(...tumOdemeler.map((o) => o.kart)));
    const toplamOdenen = yuvarla(toplamNakit + toplamHavale + toplamKart);
    const kalan = yuvarla(k.satisBedeli - toplamOdenen);

    return {
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      hisseSayisi: k.hisseSayisi,
      satisBedeli: yuvarla(k.satisBedeli),
      toplamOdenen,
      kalan,
      toplamNakit,
      toplamHavale,
      toplamKart,
      hisseler,
    };
  });
}
```

### 2. Sayfa: app/raporlar/kesim-muhasebe/page.tsx

```tsx
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { kesimMuhasebeRaporu } from "@/modules/raporlar/lib/rapor.service";
import { KesimMuhasebeClient } from "@/modules/raporlar/components/KesimMuhasebeClient";

export const dynamic = "force-dynamic";

export default async function KesimMuhasebePage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const veri = await kesimMuhasebeRaporu();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kesim Sırası Muhasebe Raporu"
        altBaslik={`${veri.length} kurban · detaylı ödeme dökümü`}
      />
      <div className="p-4 sm:p-6">
        <KesimMuhasebeClient veri={veri} />
      </div>
    </AppShell>
  );
}
```

### 3. Client: modules/raporlar/components/KesimMuhasebeClient.tsx

**Özellikler:**
- Üstte özet KPI (toplam bedel, nakit, havale, kart, kalan)
- Arama (kesim no / hissedar adı)
- Filtre: "Borçlu olanlar" / "Tamamı ödenmiş" / "Hepsi"
- Her kurban bir kart/accordion:
  - Başlık: DANA-X · Küpe · X hisse · Satış bedeli · Kalan
  - Hisseler tablosu (hissedar, fiyat, ödenen, kalan, vekalet)
  - Her hissenin altında ödeme satırları (tarih, nakit, havale, kart, dekont)
- "Yazdır" butonu → A4 print sayfası

```tsx
"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Printer, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import type { KesimMuhasebeKurban } from "@/modules/raporlar/lib/rapor.service";

interface Props {
  veri: KesimMuhasebeKurban[];
}

export function KesimMuhasebeClient({ veri }: Props) {
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<"hepsi" | "borclu" | "odenmis">("hepsi");
  const [acikKurbanlar, setAcikKurbanlar] = useState<Set<number>>(new Set());

  // Özet
  const ozet = useMemo(() => {
    return {
      toplamBedel: veri.reduce((s, k) => s + k.satisBedeli, 0),
      toplamOdenen: veri.reduce((s, k) => s + k.toplamOdenen, 0),
      toplamKalan: veri.reduce((s, k) => s + k.kalan, 0),
      toplamNakit: veri.reduce((s, k) => s + k.toplamNakit, 0),
      toplamHavale: veri.reduce((s, k) => s + k.toplamHavale, 0),
      toplamKart: veri.reduce((s, k) => s + k.toplamKart, 0),
    };
  }, [veri]);

  // Filtreleme
  const filtreli = useMemo(() => {
    let liste = [...veri];
    const q = arama.trim().toLowerCase();
    if (q) {
      liste = liste.filter((k) =>
        `dana-${k.kesimSirasi}`.includes(q) ||
        String(k.kesimSirasi) === q ||
        k.kupeNo?.toLowerCase().includes(q) ||
        k.hisseler.some((h) => h.musteriAdi?.toLowerCase().includes(q)),
      );
    }
    if (filtre === "borclu") {
      liste = liste.filter((k) => k.kalan > 0);
    } else if (filtre === "odenmis") {
      liste = liste.filter((k) => k.kalan <= 0);
    }
    return liste;
  }, [veri, arama, filtre]);

  function toggleKurban(no: number) {
    setAcikKurbanlar((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(no)) yeni.delete(no);
      else yeni.add(no);
      return yeni;
    });
  }

  function hepsiniAc() {
    setAcikKurbanlar(new Set(filtreli.map((k) => k.kesimSirasi)));
  }
  function hepsiniKapat() {
    setAcikKurbanlar(new Set());
  }

  return (
    <div className="space-y-4">
      {/* ÖZET KPI */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Ozet label="Toplam Bedel" deger={formatPara(ozet.toplamBedel)} />
          <Ozet label="Tahsil Edilen" deger={formatPara(ozet.toplamOdenen)} renk="text-green-600" />
          <Ozet label="Kalan" deger={formatPara(ozet.toplamKalan)} renk="text-red-600" />
          <Ozet label="Nakit" deger={formatPara(ozet.toplamNakit)} />
          <Ozet label="Havale" deger={formatPara(ozet.toplamHavale)} />
          <Ozet label="Kart" deger={formatPara(ozet.toplamKart)} />
        </div>
      </Card>

      {/* ARAÇ ÇUBUĞU */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kesim no, küpe veya hissedar ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {[
            { v: "hepsi", l: "Hepsi" },
            { v: "borclu", l: "Borçlu" },
            { v: "odenmis", l: "Ödenmiş" },
          ].map((f) => (
            <Button
              key={f.v}
              variant={filtre === f.v ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltre(f.v as any)}
              className={filtre === f.v ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              {f.l}
            </Button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={hepsiniAc}>
          Tümünü Aç
        </Button>
        <Button variant="outline" size="sm" onClick={hepsiniKapat}>
          Tümünü Kapat
        </Button>

        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <a href="/raporlar/kesim-muhasebe/yazdir" target="_blank" rel="noopener noreferrer">
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </a>
        </Button>
      </div>

      {/* KURBAN LİSTESİ */}
      <div className="space-y-3">
        {filtreli.map((k) => {
          const acik = acikKurbanlar.has(k.kesimSirasi);
          return (
            <Card key={k.kesimSirasi} className="overflow-hidden">
              {/* Başlık */}
              <button
                onClick={() => toggleKurban(k.kesimSirasi)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
              >
                {acik ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}

                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 text-orange-700 font-bold text-lg">
                  {k.kesimSirasi}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">DANA-{k.kesimSirasi}</span>
                    {k.kupeNo && <Badge variant="outline" className="text-xs">{k.kupeNo}</Badge>}
                    <Badge variant="outline" className="text-xs">{k.hisseSayisi} hisse</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Bedel: {formatPara(k.satisBedeli)} ·
                    Ödenen: {formatPara(k.toplamOdenen)} ·
                    <span className={k.kalan > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                      Kalan: {formatPara(k.kalan)}
                    </span>
                  </div>
                </div>

                {/* Yöntem özetleri */}
                <div className="hidden md:flex gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground">Nakit</div>
                    <div className="font-medium">{formatPara(k.toplamNakit)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Havale</div>
                    <div className="font-medium">{formatPara(k.toplamHavale)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Kart</div>
                    <div className="font-medium">{formatPara(k.toplamKart)}</div>
                  </div>
                </div>
              </button>

              {/* Detay (açıkken) */}
              {acik && (
                <div className="border-t bg-muted/10 p-4 space-y-3">
                  {k.hisseler.map((h) => (
                    <div key={h.hisseNo} className="bg-white rounded-lg border p-3">
                      {/* Hissedar başlık */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-muted-foreground">
                            {k.kesimSirasi}.{h.hisseNo}
                          </span>
                          <span className="font-medium truncate">
                            {h.musteriAdi ?? <span className="italic text-muted-foreground">Boş hisse</span>}
                          </span>
                          {h.telefon && (
                            <span className="text-xs text-muted-foreground">{h.telefon}</span>
                          )}
                          {h.vekaletAlindi && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                              ✓ Vekalet
                            </Badge>
                          )}
                        </div>
                        <div className="text-right text-sm shrink-0">
                          <span className="text-muted-foreground">Fiyat: </span>
                          <span className="font-medium">{formatPara(h.hisseFiyati)}</span>
                          {h.kalan > 0 ? (
                            <span className="text-red-600 ml-2">Kalan: {formatPara(h.kalan)}</span>
                          ) : (
                            <span className="text-green-600 ml-2">✓ Ödendi</span>
                          )}
                        </div>
                      </div>

                      {/* Ödeme tablosu */}
                      {h.odemeler.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground border-b">
                                <th className="text-left py-1 px-2">Tarih</th>
                                <th className="text-left py-1 px-2">Dekont</th>
                                <th className="text-right py-1 px-2">Nakit</th>
                                <th className="text-right py-1 px-2">Havale</th>
                                <th className="text-right py-1 px-2">Kart</th>
                                <th className="text-right py-1 px-2">Toplam</th>
                              </tr>
                            </thead>
                            <tbody>
                              {h.odemeler.map((o, i) => (
                                <tr key={i} className={cn("border-b last:border-0", o.iptal && "opacity-40 line-through")}>
                                  <td className="py-1 px-2">{formatTarih(new Date(o.tarih))}</td>
                                  <td className="py-1 px-2 font-mono">{o.dekontNo}</td>
                                  <td className="py-1 px-2 text-right">{o.nakit > 0 ? formatPara(o.nakit) : "—"}</td>
                                  <td className="py-1 px-2 text-right">{o.havale > 0 ? formatPara(o.havale) : "—"}</td>
                                  <td className="py-1 px-2 text-right">{o.kart > 0 ? formatPara(o.kart) : "—"}</td>
                                  <td className="py-1 px-2 text-right font-medium">{formatPara(o.toplamTutar)}</td>
                                  {o.iptal && <td className="text-red-500 text-xs">İPTAL</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Henüz ödeme yok</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Ozet({ label, deger, renk }: { label: string; deger: string; renk?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", renk)}>{deger}</p>
    </div>
  );
}
```

### 4. Yazdırma Sayfası: app/raporlar/kesim-muhasebe/yazdir/page.tsx

```tsx
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { kesimMuhasebeRaporu } from "@/modules/raporlar/lib/rapor.service";
import { KesimMuhasebeYazdirClient } from "./KesimMuhasebeYazdirClient";

export const dynamic = "force-dynamic";

export default async function KesimMuhasebeYazdirPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const veri = await kesimMuhasebeRaporu();
  return <KesimMuhasebeYazdirClient veri={veri} />;
}
```

### 5. Yazdırma Client: app/raporlar/kesim-muhasebe/yazdir/KesimMuhasebeYazdirClient.tsx

A4 portre, her kurban bir blok, hissedarlar + ödemeler tablosu. Print-friendly:

```tsx
"use client";

import { useEffect } from "react";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import type { KesimMuhasebeKurban } from "@/modules/raporlar/lib/rapor.service";

interface Props {
  veri: KesimMuhasebeKurban[];
}

export function KesimMuhasebeYazdirClient({ veri }: Props) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  const genelToplam = {
    bedel: veri.reduce((s, k) => s + k.satisBedeli, 0),
    odenen: veri.reduce((s, k) => s + k.toplamOdenen, 0),
    kalan: veri.reduce((s, k) => s + k.kalan, 0),
    nakit: veri.reduce((s, k) => s + k.toplamNakit, 0),
    havale: veri.reduce((s, k) => s + k.toplamHavale, 0),
    kart: veri.reduce((s, k) => s + k.toplamKart, 0),
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm 0.7cm; }
          body { font-family: Arial, sans-serif; background: white; font-size: 10px; }
          .no-print { display: none !important; }
          .kurban-blok { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          body { background: #f5f5f5; padding: 20px; }
          .print-container { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 1cm; }
        }
        .print-container { max-width: 21cm; margin: 0 auto; }
        .muhasebe-tablo { width: 100%; border-collapse: collapse; font-size: 9.5px; }
        .muhasebe-tablo th { background: #f0f0f0; padding: 3px 5px; text-align: left; border: 1px solid #ccc; }
        .muhasebe-tablo td { padding: 3px 5px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .iptal-satir { opacity: 0.5; text-decoration: line-through; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()} className="bg-orange-500 text-white px-4 py-2 rounded font-semibold shadow-lg">
          🖨️ Yazdır / PDF
        </button>
        <button onClick={() => window.close()} className="bg-gray-200 px-4 py-2 rounded shadow-lg">
          Kapat
        </button>
      </div>

      <div className="print-container">
        {/* Başlık */}
        <div style={{ borderBottom: "2px solid #DE0B1E", paddingBottom: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#DE0B1E" }}>ADA BEREKET HAYVANCILIK</div>
              <div style={{ fontSize: 11, color: "#666" }}>Kesim Sırası Muhasebe Raporu (Detaylı)</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, color: "#666" }}>
              <div>Tarih: {formatTarih(new Date())}</div>
              <div>{veri.length} kurban</div>
            </div>
          </div>
        </div>

        {/* Genel özet */}
        <div style={{ marginBottom: 16, padding: 10, background: "#FFF5F5", borderRadius: 4, fontSize: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <div><strong>Toplam Bedel:</strong> {formatPara(genelToplam.bedel)}</div>
          <div><strong>Tahsil Edilen:</strong> {formatPara(genelToplam.odenen)}</div>
          <div><strong>Kalan:</strong> {formatPara(genelToplam.kalan)}</div>
          <div><strong>Nakit:</strong> {formatPara(genelToplam.nakit)}</div>
          <div><strong>Havale:</strong> {formatPara(genelToplam.havale)}</div>
          <div><strong>Kart:</strong> {formatPara(genelToplam.kart)}</div>
        </div>

        {/* Her kurban */}
        {veri.map((k) => (
          <div key={k.kesimSirasi} className="kurban-blok" style={{ marginBottom: 18 }}>
            {/* Kurban başlık */}
            <div style={{ background: "#333", color: "white", padding: "5px 8px", fontSize: 11, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
              <span>DANA-{k.kesimSirasi} {k.kupeNo ? `· ${k.kupeNo}` : ""} · {k.hisseSayisi} hisse</span>
              <span>Bedel: {formatPara(k.satisBedeli)} · Kalan: {formatPara(k.kalan)}</span>
            </div>

            {/* Hisseler + ödemeler */}
            <table className="muhasebe-tablo">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>No</th>
                  <th style={{ width: "20%" }}>Hissedar</th>
                  <th style={{ width: "12%" }}>Telefon</th>
                  <th style={{ width: "10%" }}>Tarih</th>
                  <th style={{ width: "13%" }}>Dekont</th>
                  <th className="text-right" style={{ width: "8%" }}>Nakit</th>
                  <th className="text-right" style={{ width: "8%" }}>Havale</th>
                  <th className="text-right" style={{ width: "8%" }}>Kart</th>
                  <th className="text-right" style={{ width: "8%" }}>Fiyat</th>
                  <th className="text-right" style={{ width: "8%" }}>Kalan</th>
                </tr>
              </thead>
              <tbody>
                {k.hisseler.map((h) => {
                  const gecerli = h.odemeler.filter((o) => !o.iptal);
                  if (gecerli.length === 0) {
                    // Ödeme yok — tek satır
                    return (
                      <tr key={h.hisseNo}>
                        <td>{k.kesimSirasi}.{h.hisseNo}</td>
                        <td>{h.musteriAdi ?? "— Boş —"}</td>
                        <td>{h.telefon ?? "—"}</td>
                        <td colSpan={5} style={{ fontStyle: "italic", color: "#999", textAlign: "center" }}>
                          Ödeme yok
                        </td>
                        <td className="text-right">{formatPara(h.hisseFiyati)}</td>
                        <td className="text-right" style={{ color: "#c00", fontWeight: 600 }}>{formatPara(h.kalan)}</td>
                      </tr>
                    );
                  }
                  // Her ödeme bir satır, ilk satırda hissedar bilgisi
                  return gecerli.map((o, i) => (
                    <tr key={`${h.hisseNo}-${i}`}>
                      {i === 0 && (
                        <>
                          <td rowSpan={gecerli.length}>{k.kesimSirasi}.{h.hisseNo}</td>
                          <td rowSpan={gecerli.length}>{h.musteriAdi ?? "— Boş —"}</td>
                          <td rowSpan={gecerli.length}>{h.telefon ?? "—"}</td>
                        </>
                      )}
                      <td>{formatTarih(new Date(o.tarih))}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 8 }}>{o.dekontNo}</td>
                      <td className="text-right">{o.nakit > 0 ? formatPara(o.nakit) : "—"}</td>
                      <td className="text-right">{o.havale > 0 ? formatPara(o.havale) : "—"}</td>
                      <td className="text-right">{o.kart > 0 ? formatPara(o.kart) : "—"}</td>
                      {i === 0 && (
                        <>
                          <td rowSpan={gecerli.length} className="text-right">{formatPara(h.hisseFiyati)}</td>
                          <td rowSpan={gecerli.length} className="text-right" style={{ color: h.kalan > 0 ? "#c00" : "#080", fontWeight: 600 }}>
                            {formatPara(h.kalan)}
                          </td>
                        </>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 8, borderTop: "1px solid #ccc", fontSize: 9, color: "#666", textAlign: "center" }}>
          TilbeCore Kurban Yönetim Sistemi · {formatTarih(new Date())}
        </div>
      </div>
    </>
  );
}
```

### 6. Menüye link ekle (opsiyonel)

`/raporlar` sayfasına veya sidebar'a "Kesim Muhasebe Raporu" linki ekle.

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] `kesimMuhasebeRaporu()` fonksiyonu çalışıyor
- [ ] `/raporlar/kesim-muhasebe` sayfası açılıyor
- [ ] Özet KPI: bedel/tahsil/kalan/nakit/havale/kart
- [ ] Her kurban accordion (aç-kapa)
- [ ] Hissedar bazında: ad, telefon, fiyat, ödenen, kalan, vekalet
- [ ] Ödeme tablosu: tarih, dekont, nakit, havale, kart, toplam
- [ ] İptal edilen ödemeler üstü çizili gösteriliyor
- [ ] Arama (kesim no / küpe / hissedar)
- [ ] Filtre (hepsi/borçlu/ödenmiş)
- [ ] Tümünü Aç / Kapat
- [ ] `/raporlar/kesim-muhasebe/yazdir` A4 print
- [ ] Print'te her kurban bloğu sayfa ortasından bölünmüyor (break-inside: avoid)
- [ ] lucide-react: SADECE temel iconlar (Search, Printer, FileText, ChevronDown, ChevronRight) — Beef gibi yeni iconlar KULLANMA
- [ ] Konsol hata yok

---

## ⚠️ ÖNEMLİ — İCON UYARISI

Önceki sprint'te `Beef` icon hatası çıktı (lucide-react@1.16.0 eski).
**SADECE şu iconları kullan** (hepsi eski versiyonda var):
`Search, Printer, FileText, ChevronDown, ChevronRight, Filter, X, Download`

Emin olmadığın icon'u KULLANMA.

---

## 📦 COMMIT

```
feat(rapor): kesim sırası detaylı muhasebe raporu

- kesimMuhasebeRaporu(): kurban > hisse > ödeme (nakit/havale/kart ayrı)
- /raporlar/kesim-muhasebe: accordion + arama + filtre + özet KPI
- /raporlar/kesim-muhasebe/yazdir: A4 detaylı döküm
- İptal edilen ödemeler üstü çizili
- Hisse bazında fiyat/ödenen/kalan + hayvan bazında yöntem toplamları

Etkilenmeyen: schema, tahsilat akışı, diğer raporlar
```

---

## 🛑 ONAY

PRE-WRITE GATE raporunu ver (lucide-react versiyonu + helper konumları + kesim listesi referansı). "Devam et" deyince yaz.
