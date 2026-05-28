"use client";

/**
 * Master Muhasebe Denetim Defteri — A4 yazdırma client'ı.
 *
 * 3 Bölüm:
 *   1. Genel Özet + uyarı sayacı
 *   2. Kesim Defteri (her kurban, hisseler, ödemeler; uyarılı satırlar
 *      kırmızı/sarı)
 *   3. Uyarılar Eki (yeni sayfadan, kategori gruplu)
 *
 * İkonlar: AlertTriangle, CheckCircle, XCircle, Printer, FileText — sadece
 * temel lucide-react set (versiyon uyumluluğu).
 */

import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Printer,
  XCircle,
} from "lucide-react";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import type {
  DefterKurban,
  DenetimUyari,
  MuhasebeDefteri,
} from "@/modules/raporlar/lib/rapor.service";

interface Props {
  defter: MuhasebeDefteri;
}

export function MuhasebeDefteriYazdirClient({ defter }: Props) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  // Bölüm 3 için kategori bazlı gruplama
  const kategoriGruplari = useMemo(() => {
    const map = new Map<string, DenetimUyari[]>();
    for (const u of defter.tumUyarilar) {
      const liste = map.get(u.kategori) ?? [];
      liste.push(u);
      map.set(u.kategori, liste);
    }
    // Kritikler önce
    return Array.from(map.entries()).sort((a, b) => {
      const aKritik = a[1].some((u) => u.seviye === "kritik");
      const bKritik = b[1].some((u) => u.seviye === "kritik");
      if (aKritik && !bKritik) return -1;
      if (!aKritik && bKritik) return 1;
      return a[0].localeCompare(b[0], "tr");
    });
  }, [defter.tumUyarilar]);

  const { ozet, uyariSayisi } = defter;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm 0.7cm; }
          body { font-family: Arial, sans-serif; background: white; font-size: 9.5px; }
          .no-print { display: none !important; }
          .kurban-blok { page-break-inside: avoid; }
          .yeni-sayfa { page-break-before: always; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          body { background: #f5f5f5; padding: 20px; }
          .print-container { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 1cm; }
        }
        .print-container { max-width: 21cm; margin: 0 auto; }
        .muhasebe-tablo { width: 100%; border-collapse: collapse; font-size: 9px; }
        .muhasebe-tablo th { background: #f0f0f0; padding: 3px 4px; text-align: left; border: 1px solid #ccc; font-weight: 700; }
        .muhasebe-tablo td { padding: 3px 4px; border: 1px solid #ddd; vertical-align: top; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .uyari-kritik { background: #ffebee !important; color: #c00; }
        .uyari-bilgi { background: #fff8e1 !important; color: #b8860b; }
        .iptal { opacity: 0.4; text-decoration: line-through; }
        .baslik-kritik { background: #c00 !important; color: white !important; }
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

      <div className="print-container">
        {/* =================================================================
            BÖLÜM 1 — GENEL ÖZET
        ================================================================= */}
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
              <div style={{ fontSize: 20, fontWeight: 800, color: "#DE0B1E" }}>
                ADA BEREKET HAYVANCILIK
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#333",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                Master Muhasebe Denetim Defteri
              </div>
              <div style={{ fontSize: 10, color: "#666" }}>
                Otomatik tutarsızlık tespiti · 14 kontrol noktası
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, color: "#666" }}>
              <div>
                <FileText
                  size={10}
                  style={{ display: "inline", marginRight: 4 }}
                />
                Tarih: {formatTarih(new Date())}
              </div>
              <div>{ozet.kurbanSayisi} kurban</div>
            </div>
          </div>
        </div>

        {/* Uyarı kutusu — büyük */}
        {uyariSayisi.kritik === 0 && uyariSayisi.bilgi === 0 ? (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#e8f5e9",
              border: "2px solid #4caf50",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <CheckCircle size={28} color="#2e7d32" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2e7d32" }}>
                TUTARSIZLIK TESPİT EDİLMEDİ
              </div>
              <div style={{ fontSize: 10, color: "#1b5e20", marginTop: 2 }}>
                Tüm 14 kontrol noktası temiz, hesaplar uyumlu.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: uyariSayisi.kritik > 0 ? "#ffebee" : "#fff8e1",
              border: `2px solid ${uyariSayisi.kritik > 0 ? "#c00" : "#f9a825"}`,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertTriangle
              size={28}
              color={uyariSayisi.kritik > 0 ? "#c00" : "#f9a825"}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: uyariSayisi.kritik > 0 ? "#c00" : "#b8860b",
                }}
              >
                {uyariSayisi.kritik > 0 && `${uyariSayisi.kritik} KRİTİK`}
                {uyariSayisi.kritik > 0 && uyariSayisi.bilgi > 0 && " · "}
                {uyariSayisi.bilgi > 0 && `${uyariSayisi.bilgi} BİLGİ`} UYARISI
                TESPİT EDİLDİ
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                Detaylar son sayfada (Bölüm 3 — Uyarılar Eki). Kritik
                tutarsızlıklar kırmızı, bilgi amaçlı uyarılar sarı işaretlidir.
              </div>
            </div>
          </div>
        )}

        {/* 2 kolon özet */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Sol — Finansal */}
          <div
            style={{
              padding: 10,
              background: "#fafafa",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 6,
                color: "#333",
                borderBottom: "1px solid #ccc",
                paddingBottom: 3,
              }}
            >
              FİNANSAL ÖZET
            </div>
            <OzetSatir label="Toplam Satış Bedeli" deger={formatPara(ozet.toplamBedel)} />
            <OzetSatir
              label="Tahsil Edilen"
              deger={formatPara(ozet.toplamOdenen)}
              renk="#080"
            />
            <OzetSatir
              label="Kalan Borç"
              deger={formatPara(ozet.toplamKalan)}
              renk="#c00"
            />
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px dashed #ccc",
              }}
            >
              <OzetSatir label="Nakit" deger={formatPara(ozet.toplamNakit)} />
              <OzetSatir label="Havale" deger={formatPara(ozet.toplamHavale)} />
              <OzetSatir label="Kart" deger={formatPara(ozet.toplamKart)} />
            </div>
          </div>

          {/* Sağ — Operasyonel */}
          <div
            style={{
              padding: 10,
              background: "#fafafa",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 6,
                color: "#333",
                borderBottom: "1px solid #ccc",
                paddingBottom: 3,
              }}
            >
              OPERASYONEL DURUM
            </div>
            <OzetSatir label="Kurban Sayısı" deger={String(ozet.kurbanSayisi)} />
            <OzetSatir label="Toplam Hisse" deger={String(ozet.hisseSayisi)} />
            <OzetSatir
              label="Dolu Hisse"
              deger={String(ozet.doluHisse)}
              renk="#080"
            />
            <OzetSatir
              label="Boş Hisse"
              deger={String(ozet.bosHisse)}
              renk={ozet.bosHisse > 0 ? "#b8860b" : undefined}
            />
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px dashed #ccc",
              }}
            >
              <OzetSatir
                label="Vekalet Alınan"
                deger={String(ozet.vekaletAlinan)}
                renk="#080"
              />
              <OzetSatir
                label="Vekalet Bekleyen"
                deger={String(ozet.vekaletBekleyen)}
                renk={ozet.vekaletBekleyen > 0 ? "#c00" : undefined}
              />
            </div>
          </div>
        </div>

        {/* =================================================================
            BÖLÜM 2 — KESİM DEFTERİ
        ================================================================= */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#333",
            marginTop: 16,
            marginBottom: 10,
            paddingBottom: 4,
            borderBottom: "1px solid #ccc",
          }}
        >
          BÖLÜM 2 — KESİM DEFTERİ
        </div>

        {defter.kurbanlar.map((k) => (
          <KurbanBloku key={k.kesimSirasi} k={k} />
        ))}

        {/* =================================================================
            BÖLÜM 3 — UYARILAR EKİ
        ================================================================= */}
        {defter.tumUyarilar.length > 0 && (
          <div className="yeni-sayfa">
            <div
              style={{
                borderBottom: "2px solid #c00",
                paddingBottom: 8,
                marginBottom: 14,
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: "#c00" }}>
                DENETİM UYARILARI
              </div>
              <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                Otomatik tutarsızlık tespiti — kategori bazlı liste
              </div>
            </div>

            {kategoriGruplari.map(([kategori, uyarilar]) => {
              const ilkSeviye = uyarilar[0]!.seviye;
              return (
                <div
                  key={kategori}
                  style={{ marginBottom: 14 }}
                  className="kurban-blok"
                >
                  <div
                    style={{
                      background: ilkSeviye === "kritik" ? "#c00" : "#f9a825",
                      color: "white",
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {ilkSeviye === "kritik" ? (
                        <XCircle size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                      {kategori}
                    </span>
                    <span>{uyarilar.length} kayıt</span>
                  </div>
                  <table className="muhasebe-tablo">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Konum</th>
                        <th>Açıklama</th>
                        <th style={{ width: 110 }}>Beklenen</th>
                        <th style={{ width: 110 }}>Gerçek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uyarilar.map((u, i) => (
                        <tr
                          key={i}
                          className={
                            u.seviye === "kritik"
                              ? "uyari-kritik"
                              : "uyari-bilgi"
                          }
                        >
                          <td style={{ fontWeight: 700 }}>
                            {u.kesimSirasi > 0
                              ? `DANA-${u.kesimSirasi}${u.hisseNo !== null ? `.${u.hisseNo}` : ""}`
                              : "SİSTEM"}
                          </td>
                          <td>{u.mesaj}</td>
                          <td className="text-right">{u.beklenen ?? "—"}</td>
                          <td className="text-right">{u.gercek ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

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
          TilbeCore Kurban Yönetim Sistemi · Master Muhasebe Denetim Defteri ·{" "}
          {formatTarih(new Date())}
        </div>
      </div>
    </>
  );
}

function OzetSatir({
  label,
  deger,
  renk,
}: {
  label: string;
  deger: string;
  renk?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "2px 0",
        fontSize: 10,
      }}
    >
      <span style={{ color: "#555" }}>{label}</span>
      <span style={{ fontWeight: 700, color: renk ?? "#000", fontVariantNumeric: "tabular-nums" }}>
        {deger}
      </span>
    </div>
  );
}

function KurbanBloku({ k }: { k: DefterKurban }) {
  const hayvanKritik = k.uyarilar.some((u) => u.seviye === "kritik");
  const herhangiBirHisseKritik = k.hisseler.some(
    (h) =>
      h.uyarilar.some((u) => u.seviye === "kritik") ||
      h.odemeler.some((o) => o.uyarilar.some((u) => u.seviye === "kritik")),
  );
  const kritikBaslik = hayvanKritik || herhangiBirHisseKritik;

  return (
    <div className="kurban-blok" style={{ marginBottom: 14 }}>
      <div
        className={kritikBaslik ? "baslik-kritik" : ""}
        style={{
          background: kritikBaslik ? undefined : "#333",
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {kritikBaslik && <AlertTriangle size={12} />}
          DANA-{k.kesimSirasi}
          {k.kupeNo ? ` · ${k.kupeNo}` : ""} · {k.hisseSayisi} hisse · Vekalet:{" "}
          {k.vekaletAlinan}/{k.hisseSayisi}
        </span>
        <span>
          Bedel: {formatPara(k.satisBedeli)} · Ödenen:{" "}
          {formatPara(k.toplamOdenen)} · Kalan:{" "}
          <span style={{ color: k.kalan > 0 ? "#fbbf24" : "#86efac" }}>
            {formatPara(k.kalan)}
          </span>
        </span>
      </div>

      {/* Hayvan seviyesi uyarılar (varsa hemen başlık altında) */}
      {k.uyarilar.length > 0 && (
        <div
          style={{
            padding: "4px 8px",
            background: "#ffebee",
            color: "#c00",
            fontSize: 9.5,
            borderLeft: "3px solid #c00",
          }}
        >
          {k.uyarilar.map((u, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 0",
              }}
            >
              <AlertTriangle size={10} />
              <strong>{u.kategori}:</strong>
              <span>{u.mesaj}</span>
              {u.beklenen && (
                <span style={{ marginLeft: 4 }}>
                  (beklenen: {u.beklenen} · gerçek: {u.gercek})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

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
            const hisseKritik = h.uyarilar.some((u) => u.seviye === "kritik");
            const hisseBilgi =
              !hisseKritik && h.uyarilar.some((u) => u.seviye === "bilgi");
            const satirClass = hisseKritik
              ? "uyari-kritik"
              : hisseBilgi
                ? "uyari-bilgi"
                : "";

            const gecerli = h.odemeler.filter((o) => !o.iptal);

            // Hisse uyarısı varsa açıklayıcı satır eklenecek
            const uyariYazisi = h.uyarilar
              .map((u) => `${u.kategori}: ${u.mesaj}`)
              .join(" · ");

            if (gecerli.length === 0) {
              // Ödeme yok — tek satır
              return (
                <Fragment key={h.hisseNo}>
                  <tr className={satirClass}>
                    <td style={{ fontWeight: 600 }}>
                      {hisseKritik && (
                        <AlertTriangle
                          size={9}
                          style={{ display: "inline", marginRight: 2 }}
                        />
                      )}
                      {k.kesimSirasi}.{h.hisseNo}
                    </td>
                    <td>
                      {h.musteriAdi ?? (
                        <span style={{ fontStyle: "italic", color: "#999" }}>
                          — Boş —
                        </span>
                      )}
                      {h.vekaletAlindi && (
                        <span style={{ marginLeft: 4, color: "#080", fontSize: 8 }}>
                          ✓V
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
                    <td className="text-right">{formatPara(h.hisseFiyati)}</td>
                    <td
                      className="text-right"
                      style={{
                        color: h.kalan > 0 ? "#c00" : "#080",
                        fontWeight: 600,
                      }}
                    >
                      {formatPara(h.kalan)}
                    </td>
                  </tr>
                  {uyariYazisi && (
                    <tr className={satirClass}>
                      <td colSpan={10} style={{ fontSize: 8, fontStyle: "italic" }}>
                        ⚠ {uyariYazisi}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            }

            // Ödemeli — rowspan ile birden fazla satır
            const tumOdemeler = h.odemeler;
            const odemeRowSayisi = tumOdemeler.length;
            return (
              <Fragment key={h.hisseNo}>
                {tumOdemeler.map((o, i) => {
                  const odemeKritik = o.uyarilar.some(
                    (u) => u.seviye === "kritik",
                  );
                  const odemeSatirClass = o.iptal
                    ? "iptal"
                    : odemeKritik
                      ? "uyari-kritik"
                      : satirClass;

                  return (
                    <tr
                      key={`${h.hisseNo}-${o.dekontNo}-${i}`}
                      className={odemeSatirClass}
                    >
                      {i === 0 && (
                        <>
                          <td rowSpan={odemeRowSayisi} style={{ fontWeight: 600 }}>
                            {hisseKritik && (
                              <AlertTriangle
                                size={9}
                                style={{ display: "inline", marginRight: 2 }}
                              />
                            )}
                            {k.kesimSirasi}.{h.hisseNo}
                          </td>
                          <td rowSpan={odemeRowSayisi}>
                            {h.musteriAdi ?? (
                              <span
                                style={{ fontStyle: "italic", color: "#999" }}
                              >
                                — Boş —
                              </span>
                            )}
                            {h.vekaletAlindi && (
                              <span
                                style={{
                                  marginLeft: 4,
                                  color: "#080",
                                  fontSize: 8,
                                }}
                              >
                                ✓V
                              </span>
                            )}
                          </td>
                          <td rowSpan={odemeRowSayisi}>{h.telefon ?? "—"}</td>
                        </>
                      )}
                      <td>{formatTarih(new Date(o.tarih))}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 8 }}>
                        {o.dekontNo}
                        {o.iptal && (
                          <span style={{ color: "#c00", marginLeft: 4 }}>
                            (İPTAL)
                          </span>
                        )}
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
                          <td rowSpan={odemeRowSayisi} className="text-right">
                            {formatPara(h.hisseFiyati)}
                          </td>
                          <td
                            rowSpan={odemeRowSayisi}
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
                  );
                })}
                {uyariYazisi && (
                  <tr className={satirClass}>
                    <td colSpan={10} style={{ fontSize: 8, fontStyle: "italic" }}>
                      ⚠ {uyariYazisi}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {/* Hayvan altı yöntem toplamı */}
          <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
            <td colSpan={5} className="text-right">
              Hayvan Toplamı:
            </td>
            <td className="text-right">{formatPara(k.toplamNakit)}</td>
            <td className="text-right">{formatPara(k.toplamHavale)}</td>
            <td className="text-right">{formatPara(k.toplamKart)}</td>
            <td className="text-right">{formatPara(k.toplamOdenen)}</td>
            <td
              className="text-right"
              style={{ color: k.kalan > 0 ? "#c00" : "#080" }}
            >
              {formatPara(k.kalan)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Fragment helper — React.Fragment alias
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
