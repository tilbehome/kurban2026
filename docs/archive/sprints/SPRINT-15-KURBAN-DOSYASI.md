---
id: ARCH-DB033F82962C
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 15 — KURBAN DOSYASI (Her Dana İçin Tam Dökme Rapor)

**Hedef:** Her kurban için tek sayfalık eksiksiz dosya. Tüm işlemler, ön kapora, tahsilatlar, hissedarlar, vekalet, yöntemler, tarihler, dekontlar, notlar — hiçbir şey eksik kalmaz.
**Sebep:** Detaylı denetim ve müşteri sorularına anında cevap. "19 nolu dananın her şeyi" tek sayfada.
**Süre:** ~1.5 saat
**Risk:** Düşük — sadece okuma + yeni rapor sayfası.

---

## 🎯 NE İSTENİYOR?

İki kullanım:
1. **Tek dana:** `/raporlar/kurban-dosyasi/[kesimSirasi]/yazdir` → DANA-19'un tam dosyası (1 sayfa)
2. **Tüm danalar:** `/raporlar/kurban-dosyasi/yazdir` → her dana ayrı sayfa, hepsi arka arkaya (toplu baskı)

Her dana sayfası şunları İÇERİR (hiçbiri eksik olmayacak):

### Üst Bilgi (Hayvan Künyesi)
- DANA-N (büyük), Küpe No
- Hisse sayısı, Satış bedeli
- Canlı ağırlık, Karkas ağırlık
- Kesim saati, Kesim durumu
- Hisse grubu (varsa)
- Genel durum (aktif/kesildi/teslim)
- Hayvan notu (varsa)

### Finansal Özet Kutusu
- Toplam bedel
- Toplam tahsil edilen
- Kalan borç
- Yöntem dağılımı: Nakit / Havale / Kart toplamları
- Ödeme adedi (kaç işlem)
- İlk ödeme tarihi (ön kapora) / Son ödeme tarihi

### Hissedarlar Tablosu (her hisse detaylı)
Her hisse için:
- Hisse no
- Hissedar adı + telefon
- Hisse fiyatı
- Ödenen / Kalan
- Vekalet durumu + tarihi
- Hisse notu (varsa)

### Cari Hareket Dökümü (TÜM ödemeler — kronolojik)
Her ödeme bir satır:
- Sıra no
- Tarih (gün/ay/yıl + saat)
- Hangi hisse (hissedar adı)
- Nakit / Havale / Kart (ayrı sütunlar)
- Toplam tutar
- Dekont no
- Tahsilatı alan personel
- Ödeme notu (varsa — "ön kapora", "kalan ödeme" vb.)
- İptal ise: üstü çizili + iptal sebebi + iptal tarihi

### Alt Bilgi
- Bu dosya kaç tarihte oluşturuldu
- İmza alanları (Teslim eden / Teslim alan)

---

## ⛔ DOKUNMA

- Schema (sadece okuma)
- Diğer raporlar
- Tahsilat akışı, auth/izin

---

## 📋 PRE-WRITE GATE

```bash
# Helper'lar
grep -rn "export function formatPara\|export function yuvarla\|export function topla" shared/lib/para.ts
grep -rn "export function formatTarih\|formatTarihSaat\|formatSaat" shared/lib/tarih.ts

# Mevcut rapor servisi (muhasebeDefteri pattern referans)
grep -n "export async function\|export interface" modules/raporlar/lib/rapor.service.ts | head -20

# lucide-react versiyon (güvenli iconlar)
grep "lucide-react" package.json

# Personel adı join için Kullanici ilişkisi
grep -A 3 "kullanici " prisma/schema.prisma | head -5
```

**Raporla:**
- `formatTarih` saat de gösteriyor mu, yoksa ayrı `formatTarihSaat` var mı?
- Ödeme → Kullanici join'i çalışıyor mu (tahsilatı alan personel adı için)?
- Tarih+saat formatı için helper var mı?

---

## 🎯 ONAY SONRASI YAPILACAKLAR

### 1. Backend: rapor.service.ts'e fonksiyon

```typescript
export interface KurbanDosyaOdeme {
  sira: number;
  dekontNo: string;
  tarih: string;              // ISO
  hisseNo: number;
  hissedarAdi: string | null;
  nakit: number;
  havale: number;
  kart: number;
  toplamTutar: number;
  yontem: string;
  notlar: string | null;
  personelAdi: string | null; // tahsilatı alan
  iptal: boolean;
  iptalSebep: string | null;
  iptalTarihi: string | null;
}

export interface KurbanDosyaHisse {
  hisseNo: number;
  hissedarAdi: string | null;
  telefon: string | null;
  tcKimlik: string | null;
  adres: string | null;
  hisseFiyati: number;
  toplamOdenen: number;
  kalan: number;
  vekaletAlindi: boolean;
  vekaletTarihi: string | null;
  notlar: string | null;
}

export interface KurbanDosya {
  // Künye
  kesimSirasi: number;
  kupeNo: string | null;
  kesimSaati: string | null;
  hisseSayisi: number;
  satisBedeli: number;
  canliAgirlik: number | null;
  karkasAgirlik: number | null;
  durum: string;
  kesimDurumu: string;
  hisseGrubu: string | null;
  notlar: string | null;
  // Finansal
  toplamOdenen: number;
  kalan: number;
  toplamNakit: number;
  toplamHavale: number;
  toplamKart: number;
  odemeAdedi: number;
  ilkOdemeTarihi: string | null;   // ön kapora
  sonOdemeTarihi: string | null;
  // Detay
  hisseler: KurbanDosyaHisse[];
  cariHareketler: KurbanDosyaOdeme[]; // tüm ödemeler kronolojik
}

/** Tek kurban dosyası */
export async function kurbanDosyasi(kesimSirasi: number): Promise<KurbanDosya | null> {
  const k = await prisma.kurban.findFirst({
    where: { kesimSirasi, silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { adSoyad: true, telefon: true, tcKimlik: true, adres: true } },
          odemeler: {
            orderBy: { tarih: "asc" },
            include: { kullanici: { select: { adSoyad: true } } },
          },
        },
      },
    },
  });

  if (!k) return null;

  // Hisseler
  const hisseler: KurbanDosyaHisse[] = k.hisseler.map((h) => {
    const gecerli = h.odemeler.filter((o) => !o.iptal);
    const toplamOdenen = yuvarla(topla(...gecerli.map((o) => o.toplamTutar)));
    return {
      hisseNo: h.no,
      hissedarAdi: h.musteri?.adSoyad ?? null,
      telefon: h.musteri?.telefon ?? null,
      tcKimlik: h.musteri?.tcKimlik ?? null,
      adres: h.musteri?.adres ?? null,
      hisseFiyati: yuvarla(h.hisseFiyati),
      toplamOdenen,
      kalan: yuvarla(h.hisseFiyati - toplamOdenen),
      vekaletAlindi: h.vekaletAlindi,
      vekaletTarihi: h.vekaletTarihi?.toISOString() ?? null,
      notlar: h.notlar,
    };
  });

  // Cari hareketler (tüm hisselerin tüm ödemeleri, kronolojik)
  const tumOdemeler = k.hisseler.flatMap((h) =>
    h.odemeler.map((o) => ({
      ...o,
      hisseNo: h.no,
      hissedarAdi: h.musteri?.adSoyad ?? null,
    })),
  );
  tumOdemeler.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());

  const cariHareketler: KurbanDosyaOdeme[] = tumOdemeler.map((o, i) => ({
    sira: i + 1,
    dekontNo: o.dekontNo,
    tarih: o.tarih.toISOString(),
    hisseNo: o.hisseNo,
    hissedarAdi: o.hissedarAdi,
    nakit: o.nakit,
    havale: o.havale,
    kart: o.kart,
    toplamTutar: o.toplamTutar,
    yontem: o.yontem,
    notlar: o.notlar,
    personelAdi: o.kullanici?.adSoyad ?? null,
    iptal: o.iptal,
    iptalSebep: o.iptalSebep,
    iptalTarihi: o.iptalTarihi?.toISOString() ?? null,
  }));

  // Finansal (iptal olmayanlar)
  const gecerliTum = tumOdemeler.filter((o) => !o.iptal);
  const toplamNakit = yuvarla(topla(...gecerliTum.map((o) => o.nakit)));
  const toplamHavale = yuvarla(topla(...gecerliTum.map((o) => o.havale)));
  const toplamKart = yuvarla(topla(...gecerliTum.map((o) => o.kart)));
  const toplamOdenen = yuvarla(toplamNakit + toplamHavale + toplamKart);

  const gecerliTarihler = gecerliTum.map((o) => new Date(o.tarih).getTime());

  return {
    kesimSirasi: k.kesimSirasi,
    kupeNo: k.kupeNo,
    kesimSaati: k.kesimSaati,
    hisseSayisi: k.hisseSayisi,
    satisBedeli: yuvarla(k.satisBedeli),
    canliAgirlik: k.canliAgirlik,
    karkasAgirlik: k.karkasAgirlik,
    durum: k.durum,
    kesimDurumu: k.kesimDurumu,
    hisseGrubu: k.hisseGrubu,
    notlar: k.notlar,
    toplamOdenen,
    kalan: yuvarla(k.satisBedeli - toplamOdenen),
    toplamNakit,
    toplamHavale,
    toplamKart,
    odemeAdedi: gecerliTum.length,
    ilkOdemeTarihi: gecerliTarihler.length ? new Date(Math.min(...gecerliTarihler)).toISOString() : null,
    sonOdemeTarihi: gecerliTarihler.length ? new Date(Math.max(...gecerliTarihler)).toISOString() : null,
    hisseler,
    cariHareketler,
  };
}

/** Tüm kurban dosyaları (toplu baskı) */
export async function tumKurbanDosyalari(): Promise<KurbanDosya[]> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    select: { kesimSirasi: true },
  });
  const dosyalar: KurbanDosya[] = [];
  for (const k of kurbanlar) {
    const d = await kurbanDosyasi(k.kesimSirasi);
    if (d) dosyalar.push(d);
  }
  return dosyalar;
}
```

### 2. Tek Dana Sayfası: app/raporlar/kurban-dosyasi/[kesimSirasi]/yazdir/page.tsx

```tsx
import { redirect, notFound } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { kurbanDosyasi } from "@/modules/raporlar/lib/rapor.service";
import { KurbanDosyaYazdirClient } from "../../KurbanDosyaYazdirClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ kesimSirasi: string }>;
}

export default async function Page({ params }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const { kesimSirasi } = await params;
  const no = parseInt(kesimSirasi, 10);
  if (isNaN(no)) notFound();

  const dosya = await kurbanDosyasi(no);
  if (!dosya) notFound();

  return <KurbanDosyaYazdirClient dosyalar={[dosya]} />;
}
```

### 3. Toplu Sayfa: app/raporlar/kurban-dosyasi/yazdir/page.tsx

```tsx
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { tumKurbanDosyalari } from "@/modules/raporlar/lib/rapor.service";
import { KurbanDosyaYazdirClient } from "../KurbanDosyaYazdirClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const dosyalar = await tumKurbanDosyalari();
  return <KurbanDosyaYazdirClient dosyalar={dosyalar} />;
}
```

### 4. Client: app/raporlar/kurban-dosyasi/KurbanDosyaYazdirClient.tsx

Her dana **1 sayfa** (`page-break-after: always`). Tüm bilgiler dolu.

```tsx
"use client";

import { useEffect } from "react";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import { Printer } from "lucide-react";
import type { KurbanDosya } from "@/modules/raporlar/lib/rapor.service";

interface Props {
  dosyalar: KurbanDosya[];
}

// Tarih + saat formatı
function tarihSaat(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function KurbanDosyaYazdirClient({ dosyalar }: Props) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm 0.8cm; }
          body { font-family: Arial, sans-serif; background: white; font-size: 10px; }
          .no-print { display: none !important; }
          .dana-sayfa { page-break-after: always; }
          .dana-sayfa:last-child { page-break-after: auto; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          body { background: #f5f5f5; padding: 20px; }
          .dana-sayfa { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 1.2cm; margin-bottom: 20px; max-width: 21cm; margin-left: auto; margin-right: auto; }
        }
        .kunye-tablo { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .kunye-tablo td { padding: 4px 8px; border: 1px solid #ddd; font-size: 10px; }
        .kunye-tablo .etiket { background: #f5f5f5; font-weight: 600; width: 25%; }
        .finans-kutu { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
        .finans-item { padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
        .finans-item .label { font-size: 8px; color: #888; text-transform: uppercase; }
        .finans-item .deger { font-size: 14px; font-weight: 700; }
        .detay-tablo { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 12px; }
        .detay-tablo th { background: #333; color: white; padding: 4px; text-align: left; }
        .detay-tablo td { padding: 3px 4px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .iptal { opacity: 0.4; text-decoration: line-through; }
        .bolum-baslik { font-size: 12px; font-weight: 700; color: #DE0B1E; border-bottom: 1px solid #DE0B1E; padding-bottom: 3px; margin: 12px 0 8px; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()} className="bg-orange-500 text-white px-4 py-2 rounded font-semibold shadow-lg">
          🖨️ Yazdır / PDF
        </button>
        <button onClick={() => window.close()} className="bg-gray-200 px-4 py-2 rounded shadow-lg">Kapat</button>
      </div>

      {dosyalar.map((d) => (
        <div key={d.kesimSirasi} className="dana-sayfa">
          {/* BAŞLIK */}
          <div style={{ borderBottom: "2px solid #DE0B1E", paddingBottom: 8, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#DE0B1E" }}>DANA-{d.kesimSirasi}</div>
              <div style={{ fontSize: 10, color: "#666" }}>ADA BEREKET HAYVANCILIK · Kurban Dosyası</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 9, color: "#666" }}>
              <div>Rapor Tarihi: {formatTarih(new Date())}</div>
              {d.kupeNo && <div>Küpe: {d.kupeNo}</div>}
            </div>
          </div>

          {/* KÜNYE */}
          <div className="bolum-baslik">HAYVAN KÜNYESİ</div>
          <table className="kunye-tablo">
            <tbody>
              <tr>
                <td className="etiket">Kesim Sırası</td><td>DANA-{d.kesimSirasi}</td>
                <td className="etiket">Küpe No</td><td>{d.kupeNo ?? "—"}</td>
              </tr>
              <tr>
                <td className="etiket">Hisse Sayısı</td><td>{d.hisseSayisi}</td>
                <td className="etiket">Satış Bedeli</td><td>{formatPara(d.satisBedeli)}</td>
              </tr>
              <tr>
                <td className="etiket">Canlı Ağırlık</td><td>{d.canliAgirlik ? `${d.canliAgirlik} kg` : "—"}</td>
                <td className="etiket">Karkas Ağırlık</td><td>{d.karkasAgirlik ? `${d.karkasAgirlik} kg` : "—"}</td>
              </tr>
              <tr>
                <td className="etiket">Kesim Saati</td><td>{d.kesimSaati ?? "—"}</td>
                <td className="etiket">Hisse Grubu</td><td>{d.hisseGrubu ?? "—"}</td>
              </tr>
              <tr>
                <td className="etiket">Durum</td><td>{d.durum}</td>
                <td className="etiket">Kesim Durumu</td><td>{d.kesimDurumu}</td>
              </tr>
              {d.notlar && (
                <tr><td className="etiket">Not</td><td colSpan={3}>{d.notlar}</td></tr>
              )}
            </tbody>
          </table>

          {/* FİNANSAL ÖZET */}
          <div className="bolum-baslik">FİNANSAL ÖZET</div>
          <div className="finans-kutu">
            <div className="finans-item"><div className="label">Toplam Bedel</div><div className="deger">{formatPara(d.satisBedeli)}</div></div>
            <div className="finans-item"><div className="label">Tahsil Edilen</div><div className="deger" style={{ color: "#080" }}>{formatPara(d.toplamOdenen)}</div></div>
            <div className="finans-item"><div className="label">Kalan</div><div className="deger" style={{ color: d.kalan > 0 ? "#c00" : "#080" }}>{formatPara(d.kalan)}</div></div>
            <div className="finans-item"><div className="label">Nakit</div><div className="deger">{formatPara(d.toplamNakit)}</div></div>
            <div className="finans-item"><div className="label">Havale</div><div className="deger">{formatPara(d.toplamHavale)}</div></div>
            <div className="finans-item"><div className="label">Kart</div><div className="deger">{formatPara(d.toplamKart)}</div></div>
          </div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 12 }}>
            {d.odemeAdedi} ödeme işlemi ·
            {d.ilkOdemeTarihi && ` İlk ödeme (kapora): ${formatTarih(new Date(d.ilkOdemeTarihi))} · `}
            {d.sonOdemeTarihi && `Son ödeme: ${formatTarih(new Date(d.sonOdemeTarihi))}`}
          </div>

          {/* HİSSEDARLAR */}
          <div className="bolum-baslik">HİSSEDARLAR</div>
          <table className="detay-tablo">
            <thead>
              <tr>
                <th>No</th><th>Hissedar</th><th>Telefon</th>
                <th className="text-right">Fiyat</th><th className="text-right">Ödenen</th>
                <th className="text-right">Kalan</th><th>Vekalet</th><th>Not</th>
              </tr>
            </thead>
            <tbody>
              {d.hisseler.map((h) => (
                <tr key={h.hisseNo}>
                  <td>{d.kesimSirasi}.{h.hisseNo}</td>
                  <td>{h.hissedarAdi ?? "— Boş —"}</td>
                  <td>{h.telefon ?? "—"}</td>
                  <td className="text-right">{formatPara(h.hisseFiyati)}</td>
                  <td className="text-right">{formatPara(h.toplamOdenen)}</td>
                  <td className="text-right" style={{ color: h.kalan > 0 ? "#c00" : "#080", fontWeight: 600 }}>{formatPara(h.kalan)}</td>
                  <td>{h.vekaletAlindi ? `✓ ${h.vekaletTarihi ? formatTarih(new Date(h.vekaletTarihi)) : ""}` : "✗"}</td>
                  <td>{h.notlar ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CARİ HAREKETLER */}
          <div className="bolum-baslik">CARİ HAREKET DÖKÜMÜ (Tüm Ödemeler)</div>
          {d.cariHareketler.length > 0 ? (
            <table className="detay-tablo">
              <thead>
                <tr>
                  <th>#</th><th>Tarih</th><th>Hissedar</th>
                  <th className="text-right">Nakit</th><th className="text-right">Havale</th><th className="text-right">Kart</th>
                  <th className="text-right">Toplam</th><th>Dekont</th><th>Personel</th><th>Not</th>
                </tr>
              </thead>
              <tbody>
                {d.cariHareketler.map((o) => (
                  <tr key={o.sira} className={o.iptal ? "iptal" : ""}>
                    <td>{o.sira}</td>
                    <td>{tarihSaat(o.tarih)}</td>
                    <td>{o.hissedarAdi ?? "—"} (H{o.hisseNo})</td>
                    <td className="text-right">{o.nakit > 0 ? formatPara(o.nakit) : "—"}</td>
                    <td className="text-right">{o.havale > 0 ? formatPara(o.havale) : "—"}</td>
                    <td className="text-right">{o.kart > 0 ? formatPara(o.kart) : "—"}</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{formatPara(o.toplamTutar)}</td>
                    <td style={{ fontSize: 8, fontFamily: "monospace" }}>{o.dekontNo}</td>
                    <td>{o.personelAdi ?? "—"}</td>
                    <td>
                      {o.notlar ?? ""}
                      {o.iptal && ` [İPTAL: ${o.iptalSebep ?? "—"}]`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 10, color: "#999", fontStyle: "italic" }}>Henüz ödeme yapılmamış</p>
          )}

          {/* İMZA ALANI */}
          <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", fontSize: 9 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", width: 150, paddingTop: 4, marginTop: 30 }}>Teslim Eden</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", width: 150, paddingTop: 4, marginTop: 30 }}>Teslim Alan</div>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 6, borderTop: "1px solid #ccc", fontSize: 8, color: "#999", textAlign: "center" }}>
            TilbeCore Kurban Yönetim Sistemi · Ada Bereket Hayvancılık · {formatTarih(new Date())}
          </div>
        </div>
      ))}
    </>
  );
}
```

### 5. Erişim Noktaları

**a) Kurban detay sayfasına buton:** Mevcut `/hayvanlar/[id]` veya kurban kartına "📄 Dosya Yazdır" butonu → `/raporlar/kurban-dosyasi/{kesimSirasi}/yazdir`

**b) /raporlar sayfasına kart:** "Tüm Kurban Dosyaları" → `/raporlar/kurban-dosyasi/yazdir`

**c) Muhasebe defteri sayfasından:** Her dana satırına "Dosya" linki

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] `kurbanDosyasi(kesimSirasi)` tek dana çekiyor
- [ ] `tumKurbanDosyalari()` hepsini çekiyor
- [ ] `/raporlar/kurban-dosyasi/19/yazdir` → DANA-19 tam dosyası
- [ ] `/raporlar/kurban-dosyasi/yazdir` → tüm danalar, her biri ayrı sayfa
- [ ] Künye: küpe, ağırlık, kesim saati, durum, not — hepsi
- [ ] Finansal: bedel/tahsil/kalan + nakit/havale/kart + ilk/son ödeme tarihi
- [ ] Hissedarlar: ad, telefon, fiyat, ödenen, kalan, vekalet, not
- [ ] Cari hareketler: TÜM ödemeler kronolojik + personel + dekont + not
- [ ] İptal ödemeler üstü çizili + iptal sebebi
- [ ] Her dana 1 sayfa (page-break-after)
- [ ] İmza alanları (teslim eden/alan)
- [ ] Otomatik print dialog
- [ ] lucide-react sadece: Printer (güvenli)
- [ ] Konsol hata yok

---

## 🧪 TEST

1. `/raporlar/kurban-dosyasi/19/yazdir` → DANA-19 tek sayfa, her şey dolu
2. Ön kapora görünüyor mu? (ilk ödeme tarihi)
3. İptal edilmiş ödeme varsa üstü çizili + sebep
4. Personel adı (tahsilatı alan) görünüyor mu?
5. `/raporlar/kurban-dosyasi/yazdir` → 71 dana, 71 sayfa
6. Print preview → her dana tam sayfa, taşma yok
7. Çok ödemeli dana (10+ ödeme) tek sayfaya sığıyor mu? (sığmazsa font küçült)

---

## 📦 COMMIT

```
feat(rapor): kurban dosyası — her dana için tam dökme rapor

- kurbanDosyasi(no): tek dana eksiksiz dosya
- tumKurbanDosyalari(): toplu baskı
- Künye + finansal özet + hissedarlar + tüm cari hareketler
- Ön kapora (ilk ödeme) + son ödeme tarihleri
- Her ödeme: tarih/saat, yöntem ayrı, dekont, personel, not, iptal bilgisi
- Her dana 1 sayfa (page-break), imza alanları
- /raporlar/kurban-dosyasi/[no]/yazdir + /yazdir (toplu)

Sebep: Detaylı denetim + müşteri sorularına anında tam cevap

Etkilenmeyen: schema, tahsilat akışı, diğer raporlar
```

---

## 🛑 ONAY

PRE-WRITE GATE raporunu ver (helper'lar + tarih-saat formatı + personel join). "Devam et" deyince yaz.

Sıra: Backend → tek dana sayfası → toplu sayfa → erişim butonları. Her aşamada commit.

**ÖNEMLİ:** Çok ödemeli danalarda (örn 7 hisse × 3 ödeme = 21 satır) tek sayfaya sığması için cari hareket tablosu fontu küçük (9px). Eğer taşarsa font 8px'e düşür veya 2 sayfaya izin ver.
