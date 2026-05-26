/**
 * Footer — üstte teşekkür altyazısı, altta WhatsApp + Instagram + branding.
 *
 * SPRINT-DEKONT-V2: sosyal linkler ikonlu, sağda yazılım imzası.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface FooterVerisi {
  altYazi: string;
  firmaWhatsapp: string;
  firmaInstagram: string;
  yazilimBranding: string;
}

export function dekontFooterHtml(f: FooterVerisi): string {
  const e = escapeHtml;

  const whatsappBlok = f.firmaWhatsapp
    ? `<span class="dk-footer-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24z"/></svg>
        <span>WhatsApp: ${e(f.firmaWhatsapp)}</span>
      </span>`
    : "";

  const instagramBlok = f.firmaInstagram
    ? `<span class="dk-footer-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
        <span>IG: ${e(f.firmaInstagram)}</span>
      </span>`
    : "";

  return `
  <footer class="dk-footer">
    ${f.altYazi ? `<div class="dk-footer-altYazi">${e(f.altYazi)}</div>` : ""}
    <div class="dk-footer-alt">
      <div class="dk-footer-sosyal">
        ${whatsappBlok}
        ${instagramBlok}
      </div>
      ${f.yazilimBranding ? `<div class="dk-footer-branding">${e(f.yazilimBranding)}</div>` : ""}
    </div>
  </footer>
  `;
}

export const DEKONT_FOOTER_CSS = `
.dk-footer {
  margin-top: 16px;
}
.dk-footer-altYazi {
  text-align: center;
  font-size: 10.5px;
  font-style: italic;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 10px;
}
.dk-footer-alt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid ${DEKONT_RENKLERI.accent};
  font-size: 9.5px;
  color: ${DEKONT_RENKLERI.tertiary};
}
.dk-footer-sosyal {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.dk-footer-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.dk-footer-link svg {
  color: ${DEKONT_RENKLERI.tertiary};
  flex-shrink: 0;
}
.dk-footer-branding {
  font-style: italic;
  text-align: right;
}
`;
