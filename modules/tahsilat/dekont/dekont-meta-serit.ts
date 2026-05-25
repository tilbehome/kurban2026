/**
 * 4 meta bilgi şerit — Tarih / Saat / Şube / Alan, ikonlu.
 *
 * Image 2 stilinde gri ikon + küçük metin, üst başlık altında yatay.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface MetaSeritVerisi {
  tarih: string;
  saat: string;
  sube: string;
  alan: string;
}

export function dekontMetaSeritHtml(m: MetaSeritVerisi): string {
  const e = escapeHtml;

  return `
  <div class="dk-meta-serit">
    <div class="dk-meta-oge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span class="dk-meta-deger">${e(m.tarih)}</span>
    </div>
    <div class="dk-meta-oge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span class="dk-meta-deger">${e(m.saat)}</span>
    </div>
    <div class="dk-meta-oge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
      </svg>
      <span class="dk-meta-deger">${e(m.sube)}</span>
    </div>
    <div class="dk-meta-oge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span class="dk-meta-deger">${e(m.alan)}</span>
    </div>
  </div>
  `;
}

export const DEKONT_META_SERIT_CSS = `
.dk-meta-serit {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 14px;
  background: ${DEKONT_RENKLERI.surface};
  border: 1px solid ${DEKONT_RENKLERI.accent};
  border-radius: 6px;
  margin-bottom: 18px;
  font-size: 10.5px;
}
.dk-meta-oge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${DEKONT_RENKLERI.secondary};
}
.dk-meta-oge svg {
  flex-shrink: 0;
  color: ${DEKONT_RENKLERI.tertiary};
}
.dk-meta-deger {
  font-weight: 600;
  color: ${DEKONT_RENKLERI.primary};
}
`;
