"use client";

/**
 * A4 yazdırma listesi (Sahaya Çıkış / Telefon / Kapı Kapı).
 *
 * Sayfa açılınca 500ms sonra otomatik window.print() — kullanıcı PDF
 * olarak da kaydedebilir. Print CSS:
 *   - Renk arka planları: -webkit-print-color-adjust: exact
 *   - 30 kişi/sayfa, otomatik page-break-after
 */

import { useEffect, useMemo } from "react";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import type { BorcluSatir } from "@/modules/raporlar/lib/rapor.service";

interface Props {
  liste: BorcluSatir[];
  profil: "saha" | "telefon" | "kapi";
}

const PROFIL_BASLIKLARI: Record<Props["profil"], string> = {
  saha: "Sahaya Çıkış Listesi",
  telefon: "Telefon Arama Listesi",
  kapi: "Kapı Kapı Ziyaret Listesi",
};

const KISI_PER_SAYFA = 30;

export function BorclularYazdirClient({ liste, profil }: Props) {
  const yazilacak = useMemo<BorcluSatir[]>(() => {
    const filtreli = [...liste];
    if (profil === "telefon") {
      return filtreli
        .filter((b) => b.telefon && b.telefon.trim().length > 0)
        .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));
    }
    if (profil === "kapi") {
      return filtreli
        .filter((b) => !b.telefon || b.telefon.trim().length === 0)
        .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));
    }
    // saha — telefonlu + öncelik skoru sıralı
    return filtreli
      .filter((b) => b.telefon && b.telefon.trim().length > 0)
      .sort((a, b) => b.oncelikSkoru - a.oncelikSkoru);
  }, [liste, profil]);

  useEffect(() => {
    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, []);

  const toplamBorc = yazilacak.reduce((s, b) => s + b.kalan, 0);

  // Sayfalara böl
  const sayfalar: BorcluSatir[][] = [];
  for (let i = 0; i < yazilacak.length; i += KISI_PER_SAYFA) {
    sayfalar.push(yazilacak.slice(i, i + KISI_PER_SAYFA));
  }
  if (sayfalar.length === 0) sayfalar.push([]);

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm 0.8cm; }
          body { font-family: Arial, sans-serif; background: white; margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        @media screen {
          body { background: #f5f5f5; padding: 20px; }
          .print-container {
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 1cm;
            margin: 0 auto 20px;
          }
        }

        .print-container {
          max-width: 21cm;
          margin: 0 auto;
        }

        .borc-row {
          display: grid;
          grid-template-columns: 28px 1fr 110px 95px 75px;
          gap: 6px;
          padding: 5px 4px;
          border-bottom: 1px dotted #ccc;
          font-size: 10.5px;
          align-items: center;
        }

        .row-zero { background: #ffebee; }
        .row-kismi { background: #fff8e1; }
        .row-yakin { background: #e8f5e9; }

        .header-bar {
          border-bottom: 2px solid #DE0B1E;
          padding-bottom: 8px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .firma-adi {
          font-size: 18px;
          font-weight: 800;
          color: #DE0B1E;
          letter-spacing: -0.3px;
        }

        .alt-baslik {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }

        .sayfa-meta {
          text-align: right;
          font-size: 10px;
          color: #666;
        }

        .ozet-kutu {
          margin-bottom: 12px;
          padding: 8px;
          background: #FFF5F5;
          border-radius: 4px;
          font-size: 11px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .baslik-row {
          font-weight: 700;
          border-bottom: 1.5px solid #333;
          padding-bottom: 5px;
          background: #f5f5f5;
        }

        .sayfa-alt {
          margin-top: 14px;
          padding-top: 6px;
          border-top: 1px solid #ccc;
          font-size: 9px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
      `}</style>

      {/* Ekran kontrol butonları */}
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
          type="button"
          onClick={() => window.print()}
          style={{
            background: "#f97316",
            color: "white",
            padding: "8px 16px",
            borderRadius: 6,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          🖨️ Yazdır / PDF
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          style={{
            background: "#e5e5e5",
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          Kapat
        </button>
      </div>

      <div className="print-container">
        {sayfalar.map((sayfa, sayfaIdx) => (
          <div
            key={sayfaIdx}
            className={sayfaIdx < sayfalar.length - 1 ? "page-break" : ""}
          >
            {/* Sayfa başlığı (her sayfada) */}
            <div className="header-bar">
              <div>
                <div className="firma-adi">ADA BEREKET HAYVANCILIK</div>
                <div className="alt-baslik">
                  Borçlular Listesi · {PROFIL_BASLIKLARI[profil]}
                </div>
              </div>
              <div className="sayfa-meta">
                <div>Tarih: {formatTarih(new Date())}</div>
                <div>
                  Sayfa: {sayfaIdx + 1} / {sayfalar.length}
                </div>
              </div>
            </div>

            {/* İlk sayfada özet */}
            {sayfaIdx === 0 && (
              <div className="ozet-kutu">
                <span>
                  <strong>Toplam:</strong> {yazilacak.length} borçlu
                </span>
                <span>
                  <strong>Borç:</strong> {formatPara(toplamBorc)}
                </span>
                <span>
                  <strong>Ortalama:</strong>{" "}
                  {formatPara(toplamBorc / Math.max(yazilacak.length, 1))}
                </span>
              </div>
            )}

            {/* Tablo başlığı */}
            <div className="borc-row baslik-row">
              <span>#</span>
              <span>Ad Soyad / Kurban / Durum</span>
              <span>Telefon</span>
              <span style={{ textAlign: "right" }}>Borç (TL)</span>
              <span style={{ textAlign: "center" }}>Not</span>
            </div>

            {/* Veri satırları */}
            {sayfa.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                Bu profil için kayıt yok.
              </div>
            ) : (
              sayfa.map((b, i) => {
                const sira = sayfaIdx * KISI_PER_SAYFA + i + 1;
                const rowClass =
                  b.borcDurumu === "hic-odeme"
                    ? "row-zero"
                    : b.borcDurumu === "kismi"
                      ? "row-kismi"
                      : "row-yakin";

                return (
                  <div
                    key={b.musteriId}
                    className={`borc-row ${rowClass}`}
                  >
                    <span style={{ fontWeight: 600 }}>{sira}</span>
                    <span>
                      <strong>{b.adSoyad}</strong>
                      <div
                        style={{
                          fontSize: 9,
                          color: "#666",
                          marginTop: 1,
                        }}
                      >
                        {b.kurbanlar.length > 0
                          ? b.kurbanlar.join(", ")
                          : "—"}{" "}
                        · %{b.odenmeYuzdesi} ödendi
                        {b.gunlukYaslandirma < 9999 &&
                        b.gunlukYaslandirma > 30 ? (
                          <span> · {b.gunlukYaslandirma}g</span>
                        ) : b.gunlukYaslandirma >= 9999 ? (
                          <span> · hiç ödeme</span>
                        ) : null}
                      </div>
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                    >
                      {b.telefon ?? "—"}
                    </span>
                    <span
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#c00",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatPara(b.kalan)}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        borderBottom: "1px solid #999",
                        minHeight: 14,
                      }}
                    >
                      &nbsp;
                    </span>
                  </div>
                );
              })
            )}

            {/* Sayfa altı */}
            <div className="sayfa-alt">
              <span>TilbeCore Kurban Yönetim Sistemi · ada-bereket.com</span>
              <span>
                Sayfa toplamı:{" "}
                <strong>
                  {formatPara(sayfa.reduce((s, b) => s + b.kalan, 0))}
                </strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
