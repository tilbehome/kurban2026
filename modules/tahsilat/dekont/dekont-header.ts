/**
 * Dekont üst başlık — sol: logo, sağ: ikonlu iletişim satırları.
 *
 * SPRINT-DEKONT-V2 yeniden tasarım: firma adı/slogan logoda görünüyor,
 * sağda 3 ikonlu satır (konum, telefon, web). Üst kenar marka şeridi korunur.
 *
 * Public API (HeaderVerisi) korunur — endpoint dokunulmadan render değişiyor.
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
  const adresTam = [h.firmaAdres, h.firmaIlce, h.firmaIl]
    .filter((s) => s && s.trim().length > 0)
    .join(", ");

  const konumSatir = adresTam
    ? `<div class="dk-iletisim-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>${e(adresTam)}</span>
      </div>`
    : "";

  const telSatir = h.firmaTel
    ? `<div class="dk-iletisim-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <span>${e(h.firmaTel)}</span>
      </div>`
    : "";

  const webSatir = h.firmaWeb
    ? `<div class="dk-iletisim-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>${e(h.firmaWeb)}</span>
      </div>`
    : "";

  return `
  <header class="dk-header">
    <div class="dk-header-marka-serit"></div>
    <div class="dk-header-icerik">
      <div class="dk-header-sol">
        <img src="${e(h.logoUrl)}" alt="${e(h.firmaKisaAd)}" class="dk-logo" />
      </div>
      <div class="dk-header-sag">
        ${konumSatir}
        ${telSatir}
        ${webSatir}
      </div>
    </div>
  </header>
  `;
}

export const DEKONT_HEADER_CSS = `
.dk-header {
  position: relative;
  margin-bottom: 16px;
}
.dk-header-marka-serit {
  position: absolute;
  top: -32px;
  left: -32px;
  right: -32px;
  height: 5px;
  background: ${DEKONT_RENKLERI.marka};
}
.dk-header-icerik {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 10px 0 16px;
}
.dk-header-sol {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}
.dk-logo {
  height: 72px;
  width: auto;
  object-fit: contain;
}
.dk-header-sag {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: right;
  font-size: 11px;
  color: ${DEKONT_RENKLERI.secondary};
  line-height: 1.5;
}
.dk-iletisim-satir {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}
.dk-iletisim-satir svg {
  color: ${DEKONT_RENKLERI.tertiary};
  flex-shrink: 0;
}
`;
