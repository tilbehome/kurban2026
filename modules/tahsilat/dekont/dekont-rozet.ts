/**
 * 4 değer rozeti — Güvenilir / Sağlıklı / Helal / Memnuniyet.
 *
 * Image 2 stilinde altta yatay 4 sütun, küçük ikon + tek kelime.
 * Toner-tasarruflu: sadece ikon outline + gri metin.
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
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>`,
  },
  {
    baslik: "SAĞLIKLI",
    altMetin: "Veteriner kontrol",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>`,
  },
  {
    baslik: "HELAL",
    altMetin: "Dini usul",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
      <path d="M16 12a4 4 0 0 1-7.06 2.56A4.5 4.5 0 1 0 16 8.5" />
    </svg>`,
  },
  {
    baslik: "MEMNUNİYET",
    altMetin: "Garantili hizmet",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
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

  return `<div class="dk-rozetler">${rozetler}</div>`;
}

export const DEKONT_ROZET_CSS = `
.dk-rozetler {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid ${DEKONT_RENKLERI.accent};
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
  margin: 18px 0;
}
.dk-rozet {
  text-align: center;
}
.dk-rozet-ikon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 4px;
}
.dk-rozet-ikon svg {
  width: 100%;
  height: 100%;
}
.dk-rozet-baslik {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: ${DEKONT_RENKLERI.primary};
  margin-bottom: 1px;
}
.dk-rozet-alt {
  font-size: 9px;
  color: ${DEKONT_RENKLERI.tertiary};
  line-height: 1.2;
}
`;
