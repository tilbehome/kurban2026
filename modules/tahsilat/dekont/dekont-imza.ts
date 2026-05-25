/**
 * İmza alanı — sol: kasiyer (yazıcı imzalı), sağ: müşteri imzası.
 *
 * İnce çizgi + altında etiket.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface ImzaVerisi {
  kasiyerAdi: string;
  firmaKisaAd: string;
}

export function dekontImzaHtml(i: ImzaVerisi): string {
  const e = escapeHtml;

  return `
  <div class="dk-imza">
    <div class="dk-imza-blok">
      <div class="dk-imza-cizgi"></div>
      <div class="dk-imza-etiket">${e(i.firmaKisaAd)} Yetkilisi</div>
      <div class="dk-imza-isim">${e(i.kasiyerAdi)}</div>
    </div>
    <div class="dk-imza-blok">
      <div class="dk-imza-cizgi"></div>
      <div class="dk-imza-etiket">Müşteri İmzası</div>
      <div class="dk-imza-isim">&nbsp;</div>
    </div>
  </div>
  `;
}

export const DEKONT_IMZA_CSS = `
.dk-imza {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 24px;
  margin-bottom: 18px;
}
.dk-imza-blok {
  text-align: center;
}
.dk-imza-cizgi {
  height: 1px;
  background: ${DEKONT_RENKLERI.primary};
  margin-bottom: 6px;
  margin-top: 30px;
}
.dk-imza-etiket {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: ${DEKONT_RENKLERI.tertiary};
  text-transform: uppercase;
}
.dk-imza-isim {
  font-size: 11px;
  color: ${DEKONT_RENKLERI.secondary};
  margin-top: 2px;
  font-weight: 600;
}
`;
