/**
 * Müşteri/İşlem kartı — sol bölüm.
 *
 * Müşteri adı, telefon, kurban no/hisse no, dekont no.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface MusteriKartVerisi {
  musteriAdi: string;
  musteriTel: string;
  kurbanNo: number;
  hisseNo: number;
  dekontNo: string;
  kasiyer: string;
}

export function dekontMusteriKartHtml(m: MusteriKartVerisi): string {
  const e = escapeHtml;

  return `
  <div class="dk-kart dk-musteri-kart">
    <div class="dk-kart-baslik">MÜŞTERİ / İŞLEM</div>
    <dl class="dk-kart-bilgi">
      <dt>Müşteri</dt>
      <dd class="dk-vurgulu">${e(m.musteriAdi)}</dd>
      ${m.musteriTel ? `<dt>Telefon</dt><dd>${e(m.musteriTel)}</dd>` : ""}
      <dt>Kurban</dt>
      <dd>#${m.kurbanNo} · ${m.hisseNo}. hisse</dd>
      <dt>Dekont No</dt>
      <dd class="dk-mono">${e(m.dekontNo)}</dd>
      <dt>İşlemi Yapan</dt>
      <dd>${e(m.kasiyer)}</dd>
    </dl>
  </div>
  `;
}

export const DEKONT_MUSTERI_KART_CSS = `
.dk-kart {
  background: ${DEKONT_RENKLERI.background};
  border: 1px solid ${DEKONT_RENKLERI.accent};
  border-radius: 8px;
  padding: 14px 16px;
}
.dk-kart-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${DEKONT_RENKLERI.tertiary};
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-kart-bilgi {
  margin: 0;
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 5px 10px;
  font-size: 12px;
}
.dk-kart-bilgi dt {
  color: ${DEKONT_RENKLERI.secondary};
  font-weight: 500;
}
.dk-kart-bilgi dd {
  margin: 0;
  color: ${DEKONT_RENKLERI.primary};
  font-weight: 600;
}
.dk-vurgulu {
  font-size: 13px;
  font-weight: 700 !important;
}
.dk-mono {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
}
`;
