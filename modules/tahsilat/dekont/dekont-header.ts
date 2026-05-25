/**
 * Dekont üst başlık — sol: logo + firma adı/slogan, sağ: firma iletişim.
 *
 * Image 2 stilinde toner-tasarruflu gri tonlar, marka aksanı sadece
 * üst kenar şeritinde.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface HeaderVerisi {
  firmaAdi: string;
  firmaKisaAd: string;
  firmaSlogan: string;
  firmaTel: string;
  firmaEmail: string;
  firmaWeb: string;
  firmaAdres: string;
  firmaIl: string;
  firmaIlce: string;
  logoUrl: string;
}

export function dekontHeaderHtml(h: HeaderVerisi): string {
  const e = escapeHtml;
  const adres = [h.firmaAdres, h.firmaIlce, h.firmaIl]
    .filter((s) => s && s.trim().length > 0)
    .join(", ");

  return `
  <header class="dk-header">
    <div class="dk-header-marka-serit"></div>
    <div class="dk-header-icerik">
      <div class="dk-header-sol">
        <img src="${e(h.logoUrl)}" alt="${e(h.firmaKisaAd)}" class="dk-logo" />
        <div class="dk-header-firma">
          <h1 class="dk-firma-adi">${e(h.firmaAdi)}</h1>
          ${h.firmaSlogan ? `<p class="dk-firma-slogan">${e(h.firmaSlogan)}</p>` : ""}
        </div>
      </div>
      <div class="dk-header-sag">
        ${adres ? `<div class="dk-iletisim-satir">${e(adres)}</div>` : ""}
        ${h.firmaTel ? `<div class="dk-iletisim-satir"><strong>T:</strong> ${e(h.firmaTel)}</div>` : ""}
        ${h.firmaEmail ? `<div class="dk-iletisim-satir"><strong>E:</strong> ${e(h.firmaEmail)}</div>` : ""}
        ${h.firmaWeb ? `<div class="dk-iletisim-satir"><strong>W:</strong> ${e(h.firmaWeb)}</div>` : ""}
      </div>
    </div>
  </header>
  `;
}

export const DEKONT_HEADER_CSS = `
.dk-header {
  position: relative;
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
  padding-bottom: 16px;
  margin-bottom: 18px;
}
.dk-header-marka-serit {
  position: absolute;
  top: -32px;
  left: -32px;
  right: -32px;
  height: 4px;
  background: ${DEKONT_RENKLERI.marka};
}
.dk-header-icerik {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.dk-header-sol {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.dk-logo {
  height: 56px;
  width: auto;
  object-fit: contain;
}
.dk-firma-adi {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${DEKONT_RENKLERI.primary};
}
.dk-firma-slogan {
  margin: 2px 0 0;
  font-size: 11px;
  color: ${DEKONT_RENKLERI.secondary};
  font-style: italic;
}
.dk-header-sag {
  text-align: right;
  font-size: 10.5px;
  color: ${DEKONT_RENKLERI.secondary};
  line-height: 1.5;
}
.dk-iletisim-satir strong {
  color: ${DEKONT_RENKLERI.primary};
  font-weight: 600;
}
`;
