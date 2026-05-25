/**
 * Ödeme Özeti kartı — sağ bölüm.
 *
 * Hisse bedeli, önceki ödemeler, bu ödeme detayı (nakit/havale/kart),
 * toplam, kalan bakiye.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";
import { formatPara } from "@/shared/lib/para";

export interface OzetKartVerisi {
  hisseBedeli: number;
  oncekiOdemeler: number;
  nakit: number;
  havale: number;
  kart: number;
  toplam: number;
  kalan: number;
  notlar: string;
}

export function dekontOzetKartHtml(o: OzetKartVerisi): string {
  const e = escapeHtml;
  const tamamiOdendi = o.kalan <= 0;

  return `
  <div class="dk-kart dk-ozet-kart">
    <div class="dk-kart-baslik">ÖDEME ÖZETİ</div>
    <div class="dk-ozet-satir">
      <span>Hisse Bedeli</span>
      <span>${formatPara(o.hisseBedeli)}</span>
    </div>
    ${
      o.oncekiOdemeler > 0
        ? `<div class="dk-ozet-satir dk-ozet-soluk">
            <span>Önceki Ödemeler</span>
            <span>−${formatPara(o.oncekiOdemeler)}</span>
          </div>`
        : ""
    }

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

    <div class="dk-ozet-kalan ${tamamiOdendi ? "dk-odendi" : "dk-borc"}">
      <span>${tamamiOdendi ? "Hisse Durumu" : "Kalan Bakiye"}</span>
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
  padding: 4px 0;
  font-size: 12px;
  color: ${DEKONT_RENKLERI.primary};
}
.dk-ozet-soluk {
  color: ${DEKONT_RENKLERI.secondary};
}
.dk-ozet-alt {
  padding-left: 10px;
  font-size: 11.5px;
  color: ${DEKONT_RENKLERI.secondary};
}
.dk-ozet-alt-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${DEKONT_RENKLERI.tertiary};
  margin: 8px 0 4px;
}
.dk-ozet-toplam {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  margin-top: 6px;
  border-top: 1.5px solid ${DEKONT_RENKLERI.primary};
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${DEKONT_RENKLERI.primary};
}
.dk-ozet-kalan {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 4px;
  font-size: 13px;
  font-weight: 700;
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
`;
