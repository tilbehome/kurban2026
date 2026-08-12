---
id: ARCH-9700C2E8EB23
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 🔧 SPRINT-FIX-KESIM-LISTESI — A4 düzen ve görsel düzeltme

**Problem:** Yeni eklenen `/raporlar/kesim-listesi` sayfasında 3 sorun var:

1. **Sayfa başına 6 kart koymak istemişsin** ama bayram günü A4'e sığmıyor → **4 kart olacak**
2. **"× v" garip karakterleri** isim yanında çıkıyor → kaldırılacak
3. **Müşteri ad sütunu çok geniş, bakiye sütunları daralmış** → tutarlar alt satıra düşüyor, dengesiz

**Hedef:** Tek A4'e 4 kurban düzgün otursun, sütunlar dengeli olsun, ekranda gereksiz karakter olmasın.

---

## ⛔ DOKUNMA
- `app/raporlar/kesim-listesi/page.tsx` (server data sorgu doğru)
- API'ler
- Schema
- Diğer sayfalar

**Sadece:** `modules/raporlar/components/KesimListesiClient.tsx` dosyası değişecek.

---

## 📋 YAPILACAK — `KesimListesiClient.tsx` REWRITE

Dosyayı **komple aşağıdaki içerikle değiştir**:

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

// A4 başına KART SAYISI — 4 olarak sabitlendi
const KART_SAYFA_BASI = 4;

function paraFormat(deger: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(deger);
}

function telefonFormat(tel: string | null): string {
  if (!tel) return "";
  const t = tel.replace(/\D/g, "");
  if (t.length === 10) return `0${t.slice(0,3)} ${t.slice(3,6)} ${t.slice(6,8)} ${t.slice(8)}`;
  if (t.length === 11) return `${t.slice(0,4)} ${t.slice(4,7)} ${t.slice(7,9)} ${t.slice(9)}`;
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
            {/* Sayfa başlığı */}
            <div className="sayfa-baslik">
              <div className="baslik-sol">{firmaAdi}</div>
              <div className="baslik-orta">KURBAN KESİM LİSTESİ</div>
              <div className="baslik-sag">
                <div>TARİH: {bugun}</div>
                <div>SAYFA: {sayfaIndex + 1} / {sayfaSayisi}</div>
              </div>
            </div>

            {/* Kurban kartları — 4 adet */}
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
                    {/* SOL: Kurban no + küpe */}
                    <div className="kb-kurban">
                      <div className="kb-baslik">KURBAN</div>
                      <div className="kb-icerik">
                        <div className="kb-label">SIRA NO</div>
                        <div className="kb-sira">{kurban.kesimSirasi}</div>
                        <div className="kb-label kb-label-alt">KÜPE</div>
                        <div className="kb-kupe">{kurban.kupeNo || "—"}</div>
                        {kurban.hisseGrubu && (
                          <div className="kb-grup">{kurban.hisseGrubu} KG</div>
                        )}
                      </div>
                    </div>

                    {/* ORTA: Müşteri tablosu */}
                    <div className="kb-musteri">
                      <div className="kb-baslik">MÜŞTERİ BİLGİLERİ</div>
                      <table className="m-tablo">
                        <colgroup>
                          <col style={{ width: "5%" }} />
                          <col style={{ width: "65%" }} />
                          <col style={{ width: "30%" }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>ADI SOYADI</th>
                            <th>TELEFON</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 7 }).map((_, idx) => {
                            const hisse = kurban.hisseler.find((h) => h.no === idx + 1);
                            return (
                              <tr key={idx}>
                                <td className="m-sira">{idx + 1}</td>
                                <td className="m-isim">
                                  {hisse?.musteri ? hisse.musteri.adSoyad.toUpperCase() : ""}
                                </td>
                                <td className="m-tel">
                                  {hisse?.musteri ? telefonFormat(hisse.musteri.telefon) : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="m-toplam">
                            <td colSpan={3}>TOPLAM TUTARLAR</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* SAĞ: Bakiye */}
                    <div className="kb-bakiye">
                      <div className="kb-baslik">BAKİYE DETAYLARI</div>
                      <table className="b-tablo">
                        <colgroup>
                          <col style={{ width: "34%" }} />
                          <col style={{ width: "33%" }} />
                          <col style={{ width: "33%" }} />
                        </colgroup>
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
                                <td className="b-para">
                                  {hisse ? paraFormat(hisse.hisseFiyati) : ""}
                                </td>
                                <td className="b-para">
                                  {hisse ? paraFormat(odenen) : ""}
                                </td>
                                <td className={`b-para ${kalan > 0.01 ? "b-borc" : "b-tamam"}`}>
                                  {hisse ? paraFormat(kalan) : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="b-toplam">
                            <td className="b-para">{paraFormat(toplamBedel)}</td>
                            <td className="b-para">{paraFormat(toplamOdenen)}</td>
                            <td className={`b-para ${toplamKalan > 0.01 ? "b-borc" : "b-tamam"}`}>
                              {paraFormat(toplamKalan)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sayfa altı */}
            <div className="sayfa-alt">
              <span>www.adaberekethayvancilik.com.tr</span>
              <span>Ada Bereket Hayvancılık · Kurban 2026</span>
            </div>
          </div>
        ))}

        {filtreliKurbanlar.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            Filtreye uyan kurban bulunamadı
          </Card>
        )}
      </div>

      {/* YAZDIRMA CSS — yeniden hesaplanmış */}
      <style jsx global>{`
        /* =========================================
           A4 SAYFASI — 210mm x 297mm
           Padding: 8mm her yönde
           Kullanılabilir: 194mm x 281mm

           İçerik dağılımı:
           - Başlık: 10mm
           - 4 kart × ~62mm = 248mm
           - 3 gap × 2mm = 6mm
           - Footer: 6mm
           - Margin: 8mm + 8mm
           Toplam: 297mm ✅
           ========================================= */

        .kesim-listesi-sayfa {
          width: 210mm;
          height: 297mm;
          padding: 8mm;
          box-sizing: border-box;
          color: #000;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        .kesim-listesi-sayfa:last-child {
          page-break-after: auto;
        }

        /* Başlık şeridi */
        .sayfa-baslik {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          align-items: center;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
          border-bottom: 1.5pt solid #000;
          flex-shrink: 0;
        }
        .baslik-sol {
          font-size: 8pt;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        .baslik-orta {
          font-size: 13pt;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-align: center;
        }
        .baslik-sag {
          font-size: 8pt;
          color: #555;
          text-align: right;
          line-height: 1.4;
        }

        /* Kart listesi — 4 kart eşit dağılır */
        .kurban-listesi {
          flex: 1;
          display: grid;
          grid-template-rows: repeat(4, 1fr);
          gap: 2mm;
          min-height: 0;
        }

        /* Bir kurban kartı — kesin oranlar */
        .kurban-karti {
          display: grid;
          grid-template-columns: 22mm 1fr 60mm;
          border: 0.75pt solid #000;
          overflow: hidden;
        }

        /* Hücre başlığı (üst şerit) */
        .kb-baslik {
          background: #e8f1f8;
          border-bottom: 0.75pt solid #000;
          font-size: 6.5pt;
          font-weight: 600;
          padding: 0.8mm;
          text-align: center;
          letter-spacing: 0.5px;
        }

        /* SOL — Kurban no kutusu */
        .kb-kurban {
          border-right: 0.75pt solid #000;
          background: #f8f8f8;
          display: flex;
          flex-direction: column;
        }
        .kb-icerik {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1mm;
          text-align: center;
        }
        .kb-label {
          font-size: 6pt;
          color: #777;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        .kb-label-alt {
          margin-top: 2mm;
        }
        .kb-sira {
          font-size: 22pt;
          font-weight: 700;
          line-height: 1;
          margin-top: 0.5mm;
          color: #000;
        }
        .kb-kupe {
          font-size: 8pt;
          font-weight: 500;
          font-family: 'Inter', monospace;
          margin-top: 0.5mm;
        }
        .kb-grup {
          font-size: 7pt;
          margin-top: 1.5mm;
          padding: 0.5mm 1.5mm;
          background: #fff4e6;
          border: 0.5pt solid #f59e0b;
          border-radius: 1mm;
          color: #92400e;
          font-weight: 600;
        }

        /* ORTA — Müşteri tablosu */
        .kb-musteri {
          border-right: 0.75pt solid #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .m-tablo {
          width: 100%;
          border-collapse: collapse;
          flex: 1;
          table-layout: fixed;
        }
        .m-tablo thead tr {
          background: #f5f5f5;
        }
        .m-tablo th {
          font-size: 6.5pt;
          font-weight: 600;
          padding: 0.6mm 1.2mm;
          border-bottom: 0.5pt solid #000;
          text-align: left;
          letter-spacing: 0.3px;
        }
        .m-tablo th:first-child {
          text-align: center;
        }
        .m-tablo td {
          padding: 0.4mm 1.2mm;
          border-bottom: 0.25pt solid #ddd;
          font-size: 8pt;
          line-height: 1.2;
          vertical-align: middle;
        }
        .m-sira {
          text-align: center;
          font-weight: 500;
          background: #fafafa;
          border-right: 0.4pt solid #ccc;
          font-size: 7pt !important;
          color: #555;
        }
        .m-isim {
          border-right: 0.4pt solid #ddd;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 8pt;
        }
        .m-tel {
          font-size: 7.5pt;
          color: #444;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .m-toplam td {
          background: #f0f0f0;
          border-top: 0.75pt solid #000;
          font-size: 7pt;
          font-weight: 600;
          text-align: right;
          padding-right: 3mm;
          letter-spacing: 0.5px;
        }

        /* SAĞ — Bakiye tablosu */
        .kb-bakiye {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .b-tablo {
          width: 100%;
          border-collapse: collapse;
          flex: 1;
          table-layout: fixed;
        }
        .b-tablo thead tr {
          background: #f5f5f5;
        }
        .b-tablo th {
          font-size: 6pt;
          font-weight: 600;
          padding: 0.6mm 1mm;
          border-bottom: 0.5pt solid #000;
          text-align: right;
          letter-spacing: 0.3px;
        }
        .b-tablo th:not(:last-child) {
          border-right: 0.4pt solid #ccc;
        }
        .b-tablo td {
          padding: 0.4mm 1.5mm;
          border-bottom: 0.25pt solid #ddd;
          font-size: 7.5pt;
          line-height: 1.2;
          vertical-align: middle;
        }
        .b-tablo td:not(:last-child) {
          border-right: 0.4pt solid #e5e5e5;
        }
        .b-para {
          text-align: right;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          font-weight: 500;
        }
        .b-borc {
          color: #c00;
          font-weight: 600;
        }
        .b-tamam {
          color: #060;
        }
        .b-toplam td {
          background: #f0f0f0;
          border-top: 0.75pt solid #000;
          font-size: 7.5pt;
          font-weight: 700;
        }

        /* Sayfa altı */
        .sayfa-alt {
          margin-top: 3mm;
          padding-top: 1.5mm;
          border-top: 0.5pt solid #999;
          display: flex;
          justify-content: space-between;
          font-size: 6.5pt;
          color: #666;
          flex-shrink: 0;
        }

        /* YAZDIRMA — A4 dikey, sıfır kenar */
        @media print {
          body {
            background: white !important;
          }
          .kesim-listesi-sayfa {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
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

## 🎯 ESKİDEN OLAN HATALAR — ÇÖZÜLDÜ

### Hata 1: "× v" karakter karmaşası
**Sebep:** Eski kodda `{hisse && hisse.musteri && !hisse.vekaletAlindi && <span>⚠V</span>}` vardı. Bu `⚠V` tarayıcıda yazıcıya gönderilirken yanlış render olmuş.

**Çözüm:** Vekalet işareti **TAMAMEN KALDIRILDI** kesim listesinden. Vekalet ayrı bir liste/sayfa olarak yönetilecek (gerekirse Faz 2'de). Kesim listesi temiz, sadece müşteri bilgisi.

### Hata 2: 6 kart taşıyor
**Sebep:** A4 yüksekliği 297mm, 6 kart × ~50mm = 300mm + başlık + footer = 320mm → taşıyor.

**Çözüm:** `KART_SAYFA_BASI = 4` ve `grid-template-rows: repeat(4, 1fr)` ile kartlar A4'e **kesin sığacak şekilde** eşit dağıtıldı:
- 4 kart × ~62mm = 248mm
- 3 gap × 2mm = 6mm
- Başlık + footer + padding: 35mm
- Toplam: 289mm ✅ A4'e tam oturur

### Hata 3: Sütunlar dengesiz
**Sebep:** Eski CSS'te genişlikler `width="14px"` gibi sabit pixel değerlerdi, müşteri kolonu genişledi, bakiye sıkıştı.

**Çözüm:** `<colgroup>` ile **yüzde bazlı** genişlik:
- Sol kurban kolonu: **22mm** (sabit)
- Orta müşteri tablo: **kalan alan** (5% sıra + 65% isim + 30% tel)
- Sağ bakiye tablo: **60mm** (sabit, 34% + 33% + 33% sütun)
- Toplam: 22 + ~108 + 60 = 190mm (A4 padding sonrası 194mm uyar) ✅

### Hata 4: Para ₺ ile sığmıyor
**Sebep:** Her tutarın önünde "₺" varken sütun dar olduğu için alt satıra düşmüştü.

**Çözüm:** **₺ işareti kaldırıldı** — başlıkta zaten "HİSSE BEDELİ" yazıyor, gereksiz. Sadece sayı + ondalık. Daha okunabilir, daha kompakt.

---

## ✅ TEST

```bash
pnpm dev
```

Tarayıcıda:

1. `http://localhost:3000/raporlar/kesim-listesi` aç
2. **Her sayfada 4 kart görmelisin** (önizleme + print preview)
3. Müşteri adı yanında **× v gibi karakter YOK**
4. Bakiye sütunları **dengeli ve düzgün hizalı**
5. Para tutarları **tek satırda**, ₺ işareti yok
6. **Yazdır** → tarayıcı print diyaloğu → "PDF olarak kaydet" deneyebilirsin
7. Print preview'de: Toolbar gizli, başlık her sayfada, footer her sayfada
8. Filtreler (Hepsi/Borçlu/Ödenmiş) çalışıyor → sayfa sayısı değişiyor
9. 59 kurban / 4 = **15 sayfa** olması lazım (üst toolbar'da görünmeli)

---

## 📊 RAPOR

Bittiğinde:

```
✅ Commit SHA: ...
✅ pnpm tsc --noEmit temiz
✅ pnpm build temiz
✅ /raporlar/kesim-listesi → her sayfada 4 kart
✅ × v karakteri yok
✅ Sütunlar dengeli
✅ Print preview'de A4 tam dolu (taşmıyor)
✅ Filtreler çalışıyor
✅ KUTSAL test: ABH-2026-000XXX dekont oluştu
```

**Süre tahmini: 15-20 dakika** (sadece 1 dosya değişimi).
