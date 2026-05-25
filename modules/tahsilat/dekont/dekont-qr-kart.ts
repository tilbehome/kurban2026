/**
 * QR kart — sağ üst köşede, müşterinin telefonla okutarak
 * kendi kurbanının TV ekranına gitmesini sağlar.
 *
 * QR + doğrulama kodu + kısa açıklama.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface QrKartVerisi {
  qrDataUrl: string;
  dogrulamaKodu: string;
  hedefUrl: string;
}

export function dekontQrKartHtml(q: QrKartVerisi): string {
  const e = escapeHtml;

  return `
  <div class="dk-qr-kart">
    <img src="${e(q.qrDataUrl)}" alt="Kesim takip QR" class="dk-qr-img" />
    <div class="dk-qr-bilgi">
      <div class="dk-qr-baslik">CANLI KESİM TAKİBİ</div>
      <div class="dk-qr-aciklama">Telefonunuzla okutun, kurbanınızın aşamalarını canlı izleyin.</div>
      <div class="dk-qr-dogrulama">
        <span class="dk-qr-dogrulama-etiket">Doğrulama:</span>
        <span class="dk-qr-dogrulama-kod">${e(q.dogrulamaKodu)}</span>
      </div>
    </div>
  </div>
  `;
}

export const DEKONT_QR_KART_CSS = `
.dk-qr-kart {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: ${DEKONT_RENKLERI.surface};
  border: 1px solid ${DEKONT_RENKLERI.accent};
  border-radius: 8px;
}
.dk-qr-img {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  background: ${DEKONT_RENKLERI.background};
  padding: 4px;
  border-radius: 4px;
}
.dk-qr-bilgi {
  flex: 1;
  min-width: 0;
}
.dk-qr-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${DEKONT_RENKLERI.primary};
  margin-bottom: 4px;
}
.dk-qr-aciklama {
  font-size: 10.5px;
  color: ${DEKONT_RENKLERI.secondary};
  line-height: 1.45;
  margin-bottom: 8px;
}
.dk-qr-dogrulama {
  font-size: 10px;
}
.dk-qr-dogrulama-etiket {
  color: ${DEKONT_RENKLERI.tertiary};
  margin-right: 4px;
}
.dk-qr-dogrulama-kod {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-weight: 700;
  color: ${DEKONT_RENKLERI.primary};
  letter-spacing: 0.04em;
}
`;
