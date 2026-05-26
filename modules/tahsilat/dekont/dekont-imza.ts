/**
 * İmza alanı — sol: yetkili (isim altta), sağ: müşteri imzası (boş çizgi).
 *
 * SPRINT-DEKONT-V2: ikonlu, etiketler büyük caps + isim altta.
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
  <div class="dk-imza-blok">
    <div class="dk-imza-sol">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <line x1="2" y1="2" x2="11" y2="11"/>
      </svg>
      <div class="dk-imza-icerik">
        <div class="dk-imza-baslik">${e(i.firmaKisaAd.toUpperCase())} YETKİLİSİ</div>
        <div class="dk-imza-ad">${e(i.kasiyerAdi)}</div>
      </div>
    </div>
    <div class="dk-imza-sag">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <div class="dk-imza-icerik">
        <div class="dk-imza-baslik">MÜŞTERİ İMZASI</div>
        <div class="dk-imza-cizgi"></div>
      </div>
    </div>
  </div>
  `;
}

export const DEKONT_IMZA_CSS = `
.dk-imza-blok {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-imza-sol,
.dk-imza-sag {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 4px 0;
}
.dk-imza-sol svg,
.dk-imza-sag svg {
  color: ${DEKONT_RENKLERI.tertiary};
  margin-top: 2px;
  flex-shrink: 0;
}
.dk-imza-icerik {
  flex: 1;
  min-width: 0;
}
.dk-imza-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 6px;
}
.dk-imza-ad {
  font-size: 13px;
  font-weight: 700;
  color: ${DEKONT_RENKLERI.primary};
}
.dk-imza-cizgi {
  height: 18px;
  border-bottom: 1px solid ${DEKONT_RENKLERI.tertiary};
  margin-top: 4px;
}
`;
