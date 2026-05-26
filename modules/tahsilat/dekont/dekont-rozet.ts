/**
 * 4 değer rozeti — Güvenilir / Sağlıklı / Helal / Memnuniyet.
 *
 * SPRINT-DEKONT-V2: alt + üst çizgili bant, 4 sütun yatay, ikon + büyük
 * caps başlık + küçük alt etiket. Toner-tasarruflu (sadece outline ikon).
 */

import { DEKONT_RENKLERI } from "./dekont-tema";

interface Rozet {
  baslik: string;
  altMetin: string;
  svg: string;
}

const ROZETLER: Rozet[] = [
  {
    baslik: "GÜVENİLİR",
    altMetin: "Şeffaf kayıt",
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`,
  },
  {
    baslik: "SAĞLIKLI",
    altMetin: "Veteriner kontrol",
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`,
  },
  {
    baslik: "HELAL",
    altMetin: "Dini usul",
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>`,
  },
  {
    baslik: "MEMNUNİYET",
    altMetin: "Garantili hizmet",
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,
  },
];

export function dekontRozetHtml(): string {
  const rozetler = ROZETLER.map(
    (r) => `
    <div class="dk-rozet">
      <div class="dk-rozet-ikon">${r.svg}</div>
      <div class="dk-rozet-baslik">${r.baslik}</div>
      <div class="dk-rozet-alt">${r.altMetin}</div>
    </div>
  `,
  ).join("");

  return `<div class="dk-rozet-blok">${rozetler}</div>`;
}

export const DEKONT_ROZET_CSS = `
.dk-rozet-blok {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 24px;
  padding: 18px 0;
  border-top: 1px solid ${DEKONT_RENKLERI.accent};
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-rozet {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.dk-rozet-ikon {
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 2px;
}
.dk-rozet-baslik {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: ${DEKONT_RENKLERI.primary};
}
.dk-rozet-alt {
  font-size: 9.5px;
  color: ${DEKONT_RENKLERI.tertiary};
}
`;
