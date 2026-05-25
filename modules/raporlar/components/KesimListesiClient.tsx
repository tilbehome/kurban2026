"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  firmaWeb: string;
}

type FiltreDurum = "hepsi" | "borclu" | "odenmis";

// A4 başına KART SAYISI — 4 olarak sabitlendi (taşmasın)
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
  if (t.length === 10)
    return `0${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6, 8)} ${t.slice(8)}`;
  if (t.length === 11)
    return `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}`;
  return tel;
}

function hisseToplam(hisseler: Hisse[]) {
  const bedel = hisseler.reduce((a, h) => a + h.hisseFiyati, 0);
  const odenen = hisseler.reduce(
    (acc, h) => acc + h.odemeler.reduce((a, o) => a + o.toplamTutar, 0),
    0,
  );
  return { bedel, odenen, kalan: bedel - odenen };
}

export function KesimListesiClient({
  kurbanlar,
  firmaAdi,
  firmaWeb,
}: Props) {
  const [filtreDurum, setFiltreDurum] = useState<FiltreDurum>("hepsi");

  const filtreliKurbanlar = useMemo(() => {
    if (filtreDurum === "hepsi") return kurbanlar;
    return kurbanlar.filter((k) => {
      const { kalan } = hisseToplam(k.hisseler);
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
    <div className="bg-muted/30 min-h-screen">
      <div className="bg-background sticky top-0 z-10 border-b shadow-sm print:hidden">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/raporlar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 size-4" />
                Raporlar
              </Button>
            </Link>
            <div className="h-6 border-l" />
            <h1 className="text-lg font-semibold">Kurban Kesim Listesi</h1>
            <span className="text-muted-foreground text-sm">
              {filtreliKurbanlar.length} kurban · {sayfaSayisi} sayfa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border p-0.5">
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
              <Printer className="size-4" />
              Sayfayı Yazdır
            </Button>
          </div>
        </div>
      </div>

      <div className="kesim-baski-alan container mx-auto max-w-[210mm] py-4 print:max-w-none print:py-0">
        {sayfalar.map((sayfaKurbanlari, sayfaIndex) => (
          <div
            key={sayfaIndex}
            className="kesim-listesi-sayfa mx-auto mb-4 bg-white shadow-md print:mb-0 print:shadow-none"
          >
            <div className="sayfa-baslik">
              <div className="baslik-sol">{firmaAdi}</div>
              <div className="baslik-orta">KURBAN KESİM LİSTESİ</div>
              <div className="baslik-sag">
                <div>TARİH: {bugun}</div>
                <div>
                  SAYFA: {sayfaIndex + 1} / {sayfaSayisi}
                </div>
              </div>
            </div>

            <div className="kurban-listesi">
              {sayfaKurbanlari.map((kurban) => {
                const toplam = hisseToplam(kurban.hisseler);
                return (
                  <div key={kurban.id} className="kurban-karti">
                    <div className="kb-kurban">
                      <div className="kb-baslik">KURBAN</div>
                      <div className="kb-icerik">
                        <div className="kb-label">SIRA NO</div>
                        <div className="kb-sira">{kurban.kesimSirasi}</div>
                        <div className="kb-label kb-label-alt">KÜPE</div>
                        <div className="kb-kupe">{kurban.kupeNo || "—"}</div>
                        {kurban.hisseGrubu && (
                          <div className="kb-grup">
                            {kurban.hisseGrubu} KG
                          </div>
                        )}
                      </div>
                    </div>

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
                            const hisse = kurban.hisseler.find(
                              (h) => h.no === idx + 1,
                            );
                            return (
                              <tr key={idx}>
                                <td className="m-sira">{idx + 1}</td>
                                <td className="m-isim">
                                  {hisse?.musteri
                                    ? hisse.musteri.adSoyad.toUpperCase()
                                    : ""}
                                </td>
                                <td className="m-tel">
                                  {hisse?.musteri
                                    ? telefonFormat(hisse.musteri.telefon)
                                    : ""}
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
                            const hisse = kurban.hisseler.find(
                              (h) => h.no === idx + 1,
                            );
                            const odenen =
                              hisse?.odemeler.reduce(
                                (a, o) => a + o.toplamTutar,
                                0,
                              ) || 0;
                            const kalan = hisse
                              ? hisse.hisseFiyati - odenen
                              : 0;
                            return (
                              <tr key={idx}>
                                <td className="b-para">
                                  {hisse ? paraFormat(hisse.hisseFiyati) : ""}
                                </td>
                                <td className="b-para">
                                  {hisse ? paraFormat(odenen) : ""}
                                </td>
                                <td
                                  className={`b-para ${
                                    kalan > 0.01 ? "b-borc" : "b-tamam"
                                  }`}
                                >
                                  {hisse ? paraFormat(kalan) : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="b-toplam">
                            <td className="b-para">
                              {paraFormat(toplam.bedel)}
                            </td>
                            <td className="b-para">
                              {paraFormat(toplam.odenen)}
                            </td>
                            <td
                              className={`b-para ${
                                toplam.kalan > 0.01 ? "b-borc" : "b-tamam"
                              }`}
                            >
                              {paraFormat(toplam.kalan)}
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
              <span>{firmaWeb}</span>
              <span>{firmaAdi} · Kurban 2026</span>
            </div>
          </div>
        ))}

        {filtreliKurbanlar.length === 0 && (
          <Card className="text-muted-foreground p-12 text-center">
            Filtreye uyan kurban bulunamadı
          </Card>
        )}
      </div>

      <style jsx global>{`
        /* =========================================
           A4 SAYFASI — 210mm x 297mm
           Padding: 8mm
           İçerik: 4 kart eşit + başlık + footer
           ========================================= */
        .kesim-listesi-sayfa {
          width: 210mm;
          height: 297mm;
          padding: 8mm;
          box-sizing: border-box;
          color: #000;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        .kesim-listesi-sayfa:last-child {
          page-break-after: auto;
        }

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

        .kurban-listesi {
          flex: 1;
          display: grid;
          grid-template-rows: repeat(4, 1fr);
          gap: 2mm;
          min-height: 0;
        }

        .kurban-karti {
          display: grid;
          grid-template-columns: 22mm 1fr 60mm;
          border: 0.75pt solid #000;
          overflow: hidden;
        }

        .kb-baslik {
          background: #e8f1f8;
          border-bottom: 0.75pt solid #000;
          font-size: 6.5pt;
          font-weight: 600;
          padding: 0.8mm;
          text-align: center;
          letter-spacing: 0.5px;
        }

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
          .kesim-baski-alan {
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
