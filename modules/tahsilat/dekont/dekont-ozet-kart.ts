/**
 * Ödeme Özeti kartı — sağ bölüm.
 *
 * Hisse bedeli, önceki ödemeler, bu ödeme detayı (nakit/havale/kart),
 * toplam, kalan bakiye.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";
import { formatPara } from "@/shared/lib/para";
import { tutariYaziyaCevir } from "@/shared/lib/tutar-yaziyla";

export interface OzetKartVerisi {
  hisseBedeli: number;
  oncekiOdemeler: number;
  nakit: number;
  havale: number;
  kart: number;
  toplam: number;
  kalan: number;
  notlar: string;
  /** Ödeme yöntemi: "nakit" | "havale" | "kart" | "karisik" — Odeme.yontem DB alanı */
  yontem: string;
  /** Bu batch'te ödenen hisseler. 2+ eleman varsa kartta detay tablosu
   * gösterilir; tek hissede gizlenir (mevcut görünüm korunur). */
  odenenHisseler: ReadonlyArray<{
    kurbanNo: number;
    hisseNo: number;
    fiyat: number;
  }>;
}

function yontemEtiket(y: string): string {
  switch (y.toLowerCase()) {
    case "nakit":
      return "NAKİT";
    case "havale":
      return "HAVALE / EFT";
    case "kart":
      return "KREDİ / BANKA KARTI";
    case "karisik":
      return "KARIŞIK ÖDEME";
    default:
      return y.toUpperCase();
  }
}

export function dekontOzetKartHtml(o: OzetKartVerisi): string {
  const e = escapeHtml;
  const tamamiOdendi = o.kalan <= 0;
  const cokluHisse = o.odenenHisseler.length > 1;

  return `
  <div class="dk-kart dk-ozet-kart">
    <div class="dk-kart-baslik">ÖDEME ÖZETİ</div>
    ${
      cokluHisse
        ? `<div class="dk-ozet-hisseler">
            <div class="dk-ozet-hisseler-baslik">Ödenen Hisseler (${o.odenenHisseler.length})</div>
            ${o.odenenHisseler
              .map(
                (h) => `<div class="dk-ozet-hisseler-satir">
                  <span>· ${h.kurbanNo}.${h.hisseNo}</span>
                  <span>${formatPara(h.fiyat)}</span>
                </div>`,
              )
              .join("")}
          </div>`
        : ""
    }
    <div class="dk-ozet-satir">
      <span>Toplam Bakiye</span>
      <span>${formatPara(o.hisseBedeli)}</span>
    </div>

    <div class="dk-ozet-alt-baslik">Bu Ödeme</div>
    ${
      o.nakit > 0
        ? `<div class="dk-ozet-satir dk-ozet-alt">
            <span>· Nakit</span>
            <span>${formatPara(o.nakit)}</span>
          </div>`
        : ""
    }
    ${
      o.havale > 0
        ? `<div class="dk-ozet-satir dk-ozet-alt">
            <span>· Havale</span>
            <span>${formatPara(o.havale)}</span>
          </div>`
        : ""
    }
    ${
      o.kart > 0
        ? `<div class="dk-ozet-satir dk-ozet-alt">
            <span>· Kart</span>
            <span>${formatPara(o.kart)}</span>
          </div>`
        : ""
    }

    <div class="dk-ozet-toplam">
      <span>BU ÖDEME TOPLAM</span>
      <span>${formatPara(o.toplam)}</span>
    </div>

    <div class="dk-ozet-yontem">
      <span>ÖDEME YÖNTEMİ</span>
      <span>${e(yontemEtiket(o.yontem))}</span>
    </div>

    <div class="dk-ozet-yaziyla">
      <span class="dk-ozet-yaziyla-baslik">YAZIYLA:</span>
      <span class="dk-ozet-yaziyla-deger">${e(tutariYaziyaCevir(o.toplam))}</span>
    </div>

    <div class="dk-ozet-kalan ${tamamiOdendi ? "dk-odendi" : "dk-borc"}">
      <span>${tamamiOdendi ? "Bakiye Durumu" : "Kalan Bakiye"}</span>
      <span>${
        tamamiOdendi
          ? `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:-2px;margin-right:4px">
              <polyline points="20 6 9 17 4 12" />
            </svg>TAMAMI ÖDENDİ`
          : formatPara(o.kalan)
      }</span>
    </div>

    ${
      o.notlar
        ? `<div class="dk-ozet-not"><strong>Not:</strong> ${e(o.notlar)}</div>`
        : ""
    }
  </div>
  `;
}

export const DEKONT_OZET_KART_CSS = `
.dk-ozet-satir {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 12px;
  color: ${DEKONT_RENKLERI.secondary};
  border-bottom: 1px dashed ${DEKONT_RENKLERI.accent};
}
.dk-ozet-satir:last-of-type {
  border-bottom: none;
}
.dk-ozet-soluk {
  color: ${DEKONT_RENKLERI.tertiary};
}
.dk-ozet-alt {
  padding-left: 8px;
  font-size: 11px;
  color: ${DEKONT_RENKLERI.secondary};
}
.dk-ozet-alt-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${DEKONT_RENKLERI.tertiary};
  margin: 12px 0 4px;
}
.dk-ozet-toplam {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  margin: 8px 0;
  border-top: 1.5px solid ${DEKONT_RENKLERI.primary};
  border-bottom: 1.5px solid ${DEKONT_RENKLERI.primary};
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${DEKONT_RENKLERI.primary};
}
.dk-ozet-yontem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${DEKONT_RENKLERI.primary};
  border-bottom: 1px dashed ${DEKONT_RENKLERI.accent};
}
.dk-ozet-yaziyla {
  padding: 8px 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: ${DEKONT_RENKLERI.secondary};
  border-bottom: 1px dashed ${DEKONT_RENKLERI.accent};
}
.dk-ozet-yaziyla-baslik {
  display: inline;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${DEKONT_RENKLERI.tertiary};
  margin-right: 6px;
}
.dk-ozet-yaziyla-deger {
  font-style: italic;
}
.dk-ozet-kalan {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 4px;
  font-size: 14px;
  font-weight: 800;
}
.dk-ozet-kalan.dk-odendi {
  color: ${DEKONT_RENKLERI.yesil};
}
.dk-ozet-kalan.dk-borc {
  color: ${DEKONT_RENKLERI.primary};
}
.dk-ozet-not {
  margin-top: 12px;
  padding: 8px 10px;
  background: ${DEKONT_RENKLERI.surface};
  border-left: 2px solid ${DEKONT_RENKLERI.tertiary};
  border-radius: 4px;
  font-size: 10.5px;
  color: ${DEKONT_RENKLERI.secondary};
  line-height: 1.5;
}
.dk-ozet-not strong {
  color: ${DEKONT_RENKLERI.primary};
}
.dk-ozet-hisseler {
  margin-bottom: 10px;
  padding: 8px 10px;
  background: ${DEKONT_RENKLERI.surface};
  border-radius: 6px;
  border: 1px dashed ${DEKONT_RENKLERI.accent};
}
.dk-ozet-hisseler-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: ${DEKONT_RENKLERI.tertiary};
  margin-bottom: 4px;
}
.dk-ozet-hisseler-satir {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
  color: ${DEKONT_RENKLERI.secondary};
  font-variant-numeric: tabular-nums;
}
.dk-ozet-hisseler-satir + .dk-ozet-hisseler-satir {
  border-top: 1px solid ${DEKONT_RENKLERI.accent};
}
`;
