/**
 * Footer — sol: iletişim özeti + sosyal, sağ: TilbeCore yazılım imzası.
 *
 * Çok küçük tek satırlı, gri tonlu.
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
  const sosyal = [
    f.firmaWhatsapp ? `WhatsApp: ${f.firmaWhatsapp}` : "",
    f.firmaInstagram ? `IG: ${f.firmaInstagram}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  return `
  <footer class="dk-footer">
    ${f.altYazi ? `<div class="dk-tesekkur">${e(f.altYazi)}</div>` : ""}
    <div class="dk-footer-alt">
      ${sosyal ? `<div class="dk-footer-sosyal">${e(sosyal)}</div>` : ""}
      <div class="dk-footer-yazilim">${e(f.yazilimBranding)}</div>
    </div>
  </footer>
  `;
}

export const DEKONT_FOOTER_CSS = `
.dk-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid ${DEKONT_RENKLERI.accent};
  text-align: center;
}
.dk-tesekkur {
  font-size: 11px;
  font-style: italic;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 8px;
}
.dk-footer-alt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 9px;
  color: ${DEKONT_RENKLERI.tertiary};
  letter-spacing: 0.02em;
}
.dk-footer-sosyal {
  text-align: left;
}
.dk-footer-yazilim {
  text-align: right;
  font-style: italic;
}
`;
