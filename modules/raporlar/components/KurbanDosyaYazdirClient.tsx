"use client";

/**
 * Kurban Dosyası yazdırma client'ı (tek + toplu).
 *
 * Her dana tek A4 sayfa, sayfa sonunda page-break-after: always.
 * Tek kullanıcılı modda da aynı component (tek elemanlı dizi).
 *
 * İkon: sadece Printer — versiyon güvenli.
 */

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { formatPara } from "@/shared/lib/para";
import { formatTarih, formatTarihSaat } from "@/shared/lib/tarih";
import type { KurbanDosya } from "@/modules/raporlar/lib/rapor.service";

interface Props {
  dosyalar: KurbanDosya[];
}

export function KurbanDosyaYazdirClient({ dosyalar }: Props) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
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
          .dana-sayfa {
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 1.2cm;
            margin: 0 auto 24px;
            max-width: 21cm;
          }
        }
        .kunye-tablo { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .kunye-tablo td { padding: 4px 8px; border: 1px solid #ddd; font-size: 10px; }
        .kunye-tablo .etiket { background: #f5f5f5; font-weight: 600; width: 22%; color: #555; }
        .finans-kutu { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
        .finans-item { padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
        .finans-item .label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }
        .finans-item .deger { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .detay-tablo { width: 100%; border-collapse: collapse; font-size: 8.5px; margin-bottom: 10px; }
        .detay-tablo th { background: #333; color: white; padding: 3px 4px; text-align: left; font-weight: 700; }
        .detay-tablo td { padding: 2px 4px; border: 1px solid #ddd; vertical-align: top; }
        .text-right { text-align: right; }
        .iptal-satir { opacity: 0.4; }
        .iptal-satir td { text-decoration: line-through; }
        .iptal-not { color: #c00; font-size: 7.5px; font-style: italic; text-decoration: none !important; }
        .bolum-baslik {
          font-size: 11px;
          font-weight: 700;
          color: #DE0B1E;
          border-bottom: 1px solid #DE0B1E;
          padding-bottom: 2px;
          margin: 10px 0 6px;
          letter-spacing: 0.03em;
        }
      `}</style>

      <div
        className="no-print"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          display: "flex",
          gap: 8,
          zIndex: 50,
        }}
      >
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
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Printer size={16} /> Yazdır / PDF
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

      {dosyalar.length === 0 ? (
        <div className="dana-sayfa">
          <p style={{ textAlign: "center", color: "#999", padding: 40 }}>
            Kurban bulunamadı.
          </p>
        </div>
      ) : (
        dosyalar.map((d) => <DanaSayfasi key={d.kesimSirasi} d={d} />)
      )}
    </>
  );
}

function DanaSayfasi({ d }: { d: KurbanDosya }) {
  return (
    <div className="dana-sayfa">
      {/* BAŞLIK */}
      <div
        style={{
          borderBottom: "2px solid #DE0B1E",
          paddingBottom: 8,
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#DE0B1E" }}>
            DANA-{d.kesimSirasi}
          </div>
          <div style={{ fontSize: 10, color: "#666" }}>
            ADA BEREKET HAYVANCILIK · Kurban Dosyası
          </div>
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
            <td className="etiket">Kesim Sırası</td>
            <td>DANA-{d.kesimSirasi}</td>
            <td className="etiket">Küpe No</td>
            <td>{d.kupeNo ?? "—"}</td>
          </tr>
          <tr>
            <td className="etiket">Hisse Sayısı</td>
            <td>{d.hisseSayisi}</td>
            <td className="etiket">Satış Bedeli</td>
            <td>{formatPara(d.satisBedeli)}</td>
          </tr>
          <tr>
            <td className="etiket">Canlı Ağırlık</td>
            <td>{d.canliAgirlik && d.canliAgirlik > 0 ? `${d.canliAgirlik} kg` : "—"}</td>
            <td className="etiket">Karkas Ağırlık</td>
            <td>{d.karkasAgirlik && d.karkasAgirlik > 0 ? `${d.karkasAgirlik} kg` : "—"}</td>
          </tr>
          <tr>
            <td className="etiket">Kesim Saati</td>
            <td>{d.kesimSaati ?? "—"}</td>
            <td className="etiket">Hisse Grubu</td>
            <td>{d.hisseGrubu ?? "—"}</td>
          </tr>
          <tr>
            <td className="etiket">Genel Durum</td>
            <td>{d.durum}</td>
            <td className="etiket">Kesim Durumu</td>
            <td>{d.kesimDurumu}</td>
          </tr>
          {d.notlar && (
            <tr>
              <td className="etiket">Hayvan Notu</td>
              <td colSpan={3}>{d.notlar}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* FİNANSAL ÖZET */}
      <div className="bolum-baslik">FİNANSAL ÖZET</div>
      <div className="finans-kutu">
        <div className="finans-item">
          <div className="label">Toplam Bedel</div>
          <div className="deger">{formatPara(d.satisBedeli)}</div>
        </div>
        <div className="finans-item">
          <div className="label">Tahsil Edilen</div>
          <div className="deger" style={{ color: "#080" }}>
            {formatPara(d.toplamOdenen)}
          </div>
        </div>
        <div className="finans-item">
          <div className="label">Kalan</div>
          <div
            className="deger"
            style={{ color: d.kalan > 0 ? "#c00" : "#080" }}
          >
            {formatPara(d.kalan)}
          </div>
        </div>
        <div className="finans-item">
          <div className="label">Nakit</div>
          <div className="deger">{formatPara(d.toplamNakit)}</div>
        </div>
        <div className="finans-item">
          <div className="label">Havale</div>
          <div className="deger">{formatPara(d.toplamHavale)}</div>
        </div>
        <div className="finans-item">
          <div className="label">Kart</div>
          <div className="deger">{formatPara(d.toplamKart)}</div>
        </div>
      </div>
      <div
        style={{
          fontSize: 9,
          color: "#666",
          marginBottom: 8,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <span>
          <strong>{d.odemeAdedi}</strong> ödeme işlemi
        </span>
        {d.ilkOdemeTarihi && (
          <span>
            <strong>Ön kapora:</strong> {formatTarih(new Date(d.ilkOdemeTarihi))}
          </span>
        )}
        {d.sonOdemeTarihi && d.sonOdemeTarihi !== d.ilkOdemeTarihi && (
          <span>
            <strong>Son ödeme:</strong> {formatTarih(new Date(d.sonOdemeTarihi))}
          </span>
        )}
      </div>

      {/* HİSSEDARLAR */}
      <div className="bolum-baslik">HİSSEDARLAR ({d.hisseler.length})</div>
      <table className="detay-tablo">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>No</th>
            <th style={{ width: "20%" }}>Hissedar</th>
            <th style={{ width: "12%" }}>Telefon</th>
            <th className="text-right" style={{ width: "10%" }}>
              Fiyat
            </th>
            <th className="text-right" style={{ width: "10%" }}>
              Ödenen
            </th>
            <th className="text-right" style={{ width: "10%" }}>
              Kalan
            </th>
            <th style={{ width: "13%" }}>Vekalet</th>
            <th>Not</th>
          </tr>
        </thead>
        <tbody>
          {d.hisseler.map((h) => (
            <tr key={h.hisseNo}>
              <td>
                {d.kesimSirasi}.{h.hisseNo}
              </td>
              <td>
                {h.hissedarAdi ?? (
                  <span style={{ fontStyle: "italic", color: "#999" }}>
                    — Boş —
                  </span>
                )}
              </td>
              <td>{h.telefon ?? "—"}</td>
              <td className="text-right">{formatPara(h.hisseFiyati)}</td>
              <td className="text-right">{formatPara(h.toplamOdenen)}</td>
              <td
                className="text-right"
                style={{
                  color: h.kalan > 0 ? "#c00" : "#080",
                  fontWeight: 600,
                }}
              >
                {formatPara(h.kalan)}
              </td>
              <td>
                {h.vekaletAlindi ? (
                  <span style={{ color: "#080" }}>
                    ✓{" "}
                    {h.vekaletTarihi
                      ? formatTarih(new Date(h.vekaletTarihi))
                      : ""}
                  </span>
                ) : (
                  <span style={{ color: "#c00" }}>—</span>
                )}
              </td>
              <td style={{ fontSize: 8 }}>{h.notlar ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CARİ HAREKETLER */}
      <div className="bolum-baslik">
        CARİ HAREKET DÖKÜMÜ ({d.cariHareketler.length} ödeme)
      </div>
      {d.cariHareketler.length > 0 ? (
        <table className="detay-tablo">
          <thead>
            <tr>
              <th style={{ width: "3%" }}>#</th>
              <th style={{ width: "12%" }}>Tarih/Saat</th>
              <th style={{ width: "18%" }}>Hissedar</th>
              <th className="text-right" style={{ width: "8%" }}>
                Nakit
              </th>
              <th className="text-right" style={{ width: "8%" }}>
                Havale
              </th>
              <th className="text-right" style={{ width: "8%" }}>
                Kart
              </th>
              <th className="text-right" style={{ width: "9%" }}>
                Toplam
              </th>
              <th style={{ width: "12%" }}>Dekont</th>
              <th style={{ width: "10%" }}>Personel</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody>
            {d.cariHareketler.map((o) => (
              <tr key={o.sira} className={o.iptal ? "iptal-satir" : ""}>
                <td>{o.sira}</td>
                <td>{formatTarihSaat(new Date(o.tarih))}</td>
                <td>
                  H{o.hisseNo}: {o.hissedarAdi ?? "—"}
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
                <td className="text-right" style={{ fontWeight: 600 }}>
                  {formatPara(o.toplamTutar)}
                </td>
                <td style={{ fontSize: 7.5, fontFamily: "monospace" }}>
                  {o.dekontNo}
                </td>
                <td>{o.personelAdi ?? "—"}</td>
                <td style={{ fontSize: 8 }}>
                  {o.notlar}
                  {o.iptal && (
                    <div className="iptal-not">
                      İPTAL: {o.iptalSebep ?? "—"}
                      {o.iptalTarihi &&
                        ` (${formatTarih(new Date(o.iptalTarihi))})`}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p
          style={{
            fontSize: 10,
            color: "#999",
            fontStyle: "italic",
            padding: 8,
            background: "#fafafa",
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          Henüz ödeme yapılmamış
        </p>
      )}

      {/* İMZA ALANLARI */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          gap: 40,
        }}
      >
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            style={{
              borderTop: "1px solid #333",
              paddingTop: 4,
              marginTop: 30,
              color: "#555",
            }}
          >
            Teslim Eden (Ad Soyad / İmza)
          </div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            style={{
              borderTop: "1px solid #333",
              paddingTop: 4,
              marginTop: 30,
              color: "#555",
            }}
          >
            Teslim Alan (Ad Soyad / İmza)
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 6,
          borderTop: "1px solid #ccc",
          fontSize: 8,
          color: "#999",
          textAlign: "center",
        }}
      >
        TilbeCore Kurban Yönetim Sistemi · Ada Bereket Hayvancılık ·{" "}
        {formatTarih(new Date())}
      </div>
    </div>
  );
}
