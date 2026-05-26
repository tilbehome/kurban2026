/**
 * 3 sütun meta şerit — Kesim Tarihi | Kesim Alanı | Lokasyon.
 *
 * SPRINT-DEKONT-V2: 4 küçük öğeden 3 büyük karta dönüştü; her bir kartta
 * ikon + büyük etiket + değer. Public API (MetaSeritVerisi) korunur,
 * sadece `saat` alanı artık `tarih` ile birleştirilmiş gösterilir.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface MetaSeritVerisi {
  tarih: string; // "26.05.2026"
  saat: string; // "13:15" — tarih ile birleştirilir
  sube: string; // "Merkez Kesim Alanı"
  alan: string; // "Sakarya / Adapazarı"
}

export function dekontMetaSeritHtml(m: MetaSeritVerisi): string {
  const e = escapeHtml;
  const tarihSaat = m.saat ? `${m.tarih} · ${m.saat}` : m.tarih;

  return `
  <div class="dk-meta-serit">
    <div class="dk-meta-kart">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="dk-meta-ikon">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <div class="dk-meta-icerik">
        <div class="dk-meta-baslik">KESİM TARİHİ</div>
        <div class="dk-meta-deger">${e(tarihSaat)}</div>
      </div>
    </div>
    <div class="dk-meta-kart">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="dk-meta-ikon">
        <path d="M3 21h18"/>
        <path d="M5 21V7l7-4 7 4v14"/>
        <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>
      </svg>
      <div class="dk-meta-icerik">
        <div class="dk-meta-baslik">KESİM ALANI</div>
        <div class="dk-meta-deger">${e(m.sube)}</div>
      </div>
    </div>
    <div class="dk-meta-kart">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="dk-meta-ikon">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <div class="dk-meta-icerik">
        <div class="dk-meta-baslik">LOKASYON</div>
        <div class="dk-meta-deger">${e(m.alan)}</div>
      </div>
    </div>
  </div>
  `;
}

export const DEKONT_META_SERIT_CSS = `
.dk-meta-serit {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
  border: 1px solid ${DEKONT_RENKLERI.kartCerceve};
  border-radius: 10px;
  padding: 12px;
  background: ${DEKONT_RENKLERI.kartArka};
}
.dk-meta-kart {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  min-width: 0;
}
.dk-meta-kart + .dk-meta-kart {
  border-left: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-meta-ikon {
  color: ${DEKONT_RENKLERI.secondary};
  flex-shrink: 0;
}
.dk-meta-icerik {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dk-meta-baslik {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${DEKONT_RENKLERI.tertiary};
}
.dk-meta-deger {
  font-size: 12px;
  font-weight: 600;
  color: ${DEKONT_RENKLERI.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;
