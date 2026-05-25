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
  if (t.length === 10)
    return `(${t.slice(0, 3)}) ${t.slice(3, 6)} ${t.slice(6, 8)} ${t.slice(8)}`;
  if (t.length === 11)
    return `(${t.slice(1, 4)}) ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}`;
  return tel;
}

function hisseToplam(hisseler: Hisse[]) {
  const bedel = hisseler.reduce((a, h) => a + h.hisseFiyati, 0);
  const odenen = hisseler.reduce(
    (acc, h) =>
      acc + h.odemeler.reduce((a, o) => a + o.toplamTutar, 0),
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
        <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
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
              <div className="text-[10px] tracking-wide text-gray-600 uppercase">
                {firmaAdi}
              </div>
              <div className="text-base font-semibold tracking-wider">
                KURBAN KESİM LİSTESİ
              </div>
              <div className="text-right text-[10px] text-gray-600">
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
                    <div className="kurban-bilgi-hucre">
                      <div className="kbh-baslik">KURBAN</div>
                      <div className="kbh-icerik">
                        <div className="text-[8px] text-gray-600">SIRA NO</div>
                        <div className="text-2xl leading-none font-bold">
                          {kurban.kesimSirasi}
                        </div>
                        <div className="mt-1 text-[7px] text-gray-600">KÜPE</div>
                        <div className="text-[9px]">{kurban.kupeNo || "—"}</div>
                        {kurban.hisseGrubu && (
                          <div className="mt-1 text-[8px] font-medium text-orange-700">
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
                            const hisse = kurban.hisseler.find(
                              (h) => h.no === idx + 1,
                            );
                            return (
                              <tr key={idx}>
                                <td className="td-sira">{idx + 1}</td>
                                <td className="td-isim">
                                  {hisse?.musteri
                                    ? hisse.musteri.adSoyad.toUpperCase()
                                    : ""}
                                  {hisse?.musteri && !hisse.vekaletAlindi && (
                                    <span className="td-vekalet-eksik">
                                      ✕ V
                                    </span>
                                  )}
                                </td>
                                <td className="td-tel">
                                  {hisse?.musteri
                                    ? telefonFormat(hisse.musteri.telefon)
                                    : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="td-toplam">
                            <td colSpan={3} className="td-toplam-etiket">
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
                                <td className="td-para">
                                  {hisse
                                    ? "₺ " + paraFormat(hisse.hisseFiyati)
                                    : ""}
                                </td>
                                <td className="td-para">
                                  {hisse ? "₺ " + paraFormat(odenen) : ""}
                                </td>
                                <td
                                  className={`td-para ${
                                    kalan > 0.01 ? "td-borc" : "td-tamam"
                                  }`}
                                >
                                  {hisse ? "₺ " + paraFormat(kalan) : ""}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="td-toplam">
                            <td className="td-para">
                              ₺ {paraFormat(toplam.bedel)}
                            </td>
                            <td className="td-para">
                              ₺ {paraFormat(toplam.odenen)}
                            </td>
                            <td
                              className={`td-para ${
                                toplam.kalan > 0.01 ? "td-borc" : "td-tamam"
                              }`}
                            >
                              ₺ {paraFormat(toplam.kalan)}
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
              <div>{firmaWeb}</div>
              <div>✕ V = Vekalet eksik</div>
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
        .kesim-listesi-sayfa {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm 10mm 8mm 10mm;
          box-sizing: border-box;
          color: #000;
          font-family: "Inter", system-ui, sans-serif;
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
        .sayfa-baslik > div:first-child {
          text-align: left;
        }
        .sayfa-baslik > div:nth-child(2) {
          text-align: center;
        }

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
          font-weight: 600;
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

        .musteri-hucre {
          border-right: 0.75pt solid #000;
        }
        .hucre-baslik {
          background: #e8f1f8;
          border-bottom: 0.75pt solid #000;
          font-size: 7pt;
          font-weight: 600;
          padding: 1mm;
          text-align: center;
        }

        .musteri-tablo,
        .bakiye-tablo {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          table-layout: fixed;
        }
        .musteri-tablo th,
        .bakiye-tablo th {
          background: #f5f5f5;
          font-size: 7pt;
          font-weight: 600;
          padding: 0.5mm 1mm;
          border-bottom: 0.5pt solid #000;
          text-align: center;
        }
        .musteri-tablo td,
        .bakiye-tablo td {
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
        .td-vekalet-eksik {
          margin-left: 3px;
          font-size: 7pt;
          color: #c00;
          font-weight: 700;
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
        .bakiye-tablo td {
          border-right: 0.5pt solid #000;
        }
        .bakiye-tablo td:last-child {
          border-right: none;
        }
        .td-borc {
          color: #c00;
          font-weight: 600;
        }
        .td-tamam {
          color: #060;
        }
        .td-toplam td {
          background: #fafafa;
          border-top: 0.75pt solid #000 !important;
          font-weight: 600;
          font-size: 7.5pt;
        }
        .td-toplam-etiket {
          text-align: right;
          padding-right: 2mm !important;
          font-size: 7pt;
          letter-spacing: 0.5px;
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
          body {
            background: white !important;
          }
          .kesim-listesi-sayfa {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
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
