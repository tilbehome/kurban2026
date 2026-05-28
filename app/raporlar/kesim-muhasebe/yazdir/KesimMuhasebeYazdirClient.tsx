"use client";

/**
 * A4 detaylı muhasebe yazdırma client'ı.
 *
 * Otomatik print() açar. Her kurban bloğu `page-break-inside: avoid`
 * sayesinde sayfa ortasında bölünmez (büyük kurbanlar tek sayfada olmasa
 * bile satır kesilmeden taşar).
 */

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
      <style>{`
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
        .muhasebe-tablo td { padding: 3px 5px; border: 1px solid #ddd; vertical-align: top; }
        .text-right { text-align: right; }
        .iptal-text { color: #c00; font-weight: 600; font-size: 8px; }
      `}</style>

      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, display: "flex", gap: 8, zIndex: 50 }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "#f97316",
            color: "white",
            padding: "8px 16px",
            borderRadius: 4,
            fontWeight: 600,
            border: 0,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Yazdır / PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: "#e5e7eb",
            padding: "8px 16px",
            borderRadius: 4,
            border: 0,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Kapat
        </button>
      </div>

      <div className="print-container">
        {/* Başlık */}
        <div
          style={{
            borderBottom: "2px solid #DE0B1E",
            paddingBottom: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{ fontSize: 18, fontWeight: 800, color: "#DE0B1E" }}
              >
                ADA BEREKET HAYVANCILIK
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>
                Kesim Sırası Muhasebe Raporu (Detaylı)
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, color: "#666" }}>
              <div>Tarih: {formatTarih(new Date())}</div>
              <div>{veri.length} kurban</div>
            </div>
          </div>
        </div>

        {/* Genel özet */}
        <div
          style={{
            marginBottom: 16,
            padding: 10,
            background: "#FFF5F5",
            borderRadius: 4,
            fontSize: 10,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          <div>
            <strong>Toplam Bedel:</strong> {formatPara(genelToplam.bedel)}
          </div>
          <div>
            <strong>Tahsil Edilen:</strong> {formatPara(genelToplam.odenen)}
          </div>
          <div>
            <strong>Kalan:</strong> {formatPara(genelToplam.kalan)}
          </div>
          <div>
            <strong>Nakit:</strong> {formatPara(genelToplam.nakit)}
          </div>
          <div>
            <strong>Havale:</strong> {formatPara(genelToplam.havale)}
          </div>
          <div>
            <strong>Kart:</strong> {formatPara(genelToplam.kart)}
          </div>
        </div>

        {/* Her kurban */}
        {veri.map((k) => (
          <div
            key={k.kesimSirasi}
            className="kurban-blok"
            style={{ marginBottom: 18 }}
          >
            <div
              style={{
                background: "#333",
                color: "white",
                padding: "5px 8px",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <span>
                DANA-{k.kesimSirasi}
                {k.kupeNo ? ` · ${k.kupeNo}` : ""} · {k.hisseSayisi} hisse
              </span>
              <span>
                Bedel: {formatPara(k.satisBedeli)} · Ödenen:{" "}
                {formatPara(k.toplamOdenen)} · Kalan:{" "}
                <span style={{ color: k.kalan > 0 ? "#fbbf24" : "#86efac" }}>
                  {formatPara(k.kalan)}
                </span>
              </span>
            </div>

            <table className="muhasebe-tablo">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>No</th>
                  <th style={{ width: "20%" }}>Hissedar</th>
                  <th style={{ width: "12%" }}>Telefon</th>
                  <th style={{ width: "10%" }}>Tarih</th>
                  <th style={{ width: "13%" }}>Dekont</th>
                  <th className="text-right" style={{ width: "8%" }}>
                    Nakit
                  </th>
                  <th className="text-right" style={{ width: "8%" }}>
                    Havale
                  </th>
                  <th className="text-right" style={{ width: "8%" }}>
                    Kart
                  </th>
                  <th className="text-right" style={{ width: "8%" }}>
                    Fiyat
                  </th>
                  <th className="text-right" style={{ width: "8%" }}>
                    Kalan
                  </th>
                </tr>
              </thead>
              <tbody>
                {k.hisseler.map((h) => {
                  const gecerli = h.odemeler.filter((o) => !o.iptal);
                  // Ödeme yoksa tek satır
                  if (gecerli.length === 0) {
                    return (
                      <tr key={h.hisseNo}>
                        <td>
                          {k.kesimSirasi}.{h.hisseNo}
                        </td>
                        <td>
                          {h.musteriAdi ?? (
                            <span style={{ fontStyle: "italic", color: "#999" }}>
                              — Boş —
                            </span>
                          )}
                        </td>
                        <td>{h.telefon ?? "—"}</td>
                        <td
                          colSpan={5}
                          style={{
                            fontStyle: "italic",
                            color: "#999",
                            textAlign: "center",
                          }}
                        >
                          Ödeme yok
                        </td>
                        <td className="text-right">
                          {formatPara(h.hisseFiyati)}
                        </td>
                        <td
                          className="text-right"
                          style={{ color: "#c00", fontWeight: 600 }}
                        >
                          {formatPara(h.kalan)}
                        </td>
                      </tr>
                    );
                  }
                  // Geçerli ödeme(ler) varsa her ödeme bir satır, ilk satırda
                  // hissedar bilgisi rowspan ile genişler
                  return gecerli.map((o, i) => (
                    <tr key={`${h.hisseNo}-${o.dekontNo}-${i}`}>
                      {i === 0 && (
                        <>
                          <td rowSpan={gecerli.length}>
                            {k.kesimSirasi}.{h.hisseNo}
                          </td>
                          <td rowSpan={gecerli.length}>
                            {h.musteriAdi ?? (
                              <span
                                style={{ fontStyle: "italic", color: "#999" }}
                              >
                                — Boş —
                              </span>
                            )}
                          </td>
                          <td rowSpan={gecerli.length}>{h.telefon ?? "—"}</td>
                        </>
                      )}
                      <td>{formatTarih(new Date(o.tarih))}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 8 }}>
                        {o.dekontNo}
                      </td>
                      <td className="text-right">
                        {o.nakit > 0 ? formatPara(o.nakit) : "—"}
                      </td>
                      <td className="text-right">
                        {o.havale > 0 ? formatPara(o.havale) : "—"}
                      </td>
                      <td className="text-right">
                        {o.kart > 0 ? formatPara(o.kart) : "—"}
                      </td>
                      {i === 0 && (
                        <>
                          <td rowSpan={gecerli.length} className="text-right">
                            {formatPara(h.hisseFiyati)}
                          </td>
                          <td
                            rowSpan={gecerli.length}
                            className="text-right"
                            style={{
                              color: h.kalan > 0 ? "#c00" : "#080",
                              fontWeight: 600,
                            }}
                          >
                            {formatPara(h.kalan)}
                          </td>
                        </>
                      )}
                    </tr>
                  ));
                })}
                {/* İptal edilen ödemeler — küçük not olarak */}
                {k.hisseler.some((h) => h.odemeler.some((o) => o.iptal)) && (
                  <tr>
                    <td colSpan={10} className="iptal-text">
                      Not: Bu kurbanda iptal edilmiş ödeme(ler) bulunmaktadır;
                      hisse toplamlarına dahil edilmemiştir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 8,
            borderTop: "1px solid #ccc",
            fontSize: 9,
            color: "#666",
            textAlign: "center",
          }}
        >
          TilbeCore Kurban Yönetim Sistemi · {formatTarih(new Date())}
        </div>
      </div>
    </>
  );
}
