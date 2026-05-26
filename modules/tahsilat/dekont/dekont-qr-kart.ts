/**
 * QR + Canlı Yayın bloku — iki sütun.
 *
 * Sol: "CANLI KESİM TAKİBİ" başlık + QR resmi + telefon ipucu.
 * Sağ: "CANLI YAYIN AKTİF" rozet + inek illüstrasyonu + doğrulama kodu.
 *
 * SPRINT-DEKONT-V2. Public API (QrKartVerisi) korunur.
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
  <div class="dk-qr-blok">
    <div class="dk-qr-sol">
      <div class="dk-qr-baslik">CANLI KESİM TAKİBİ</div>
      <div class="dk-qr-aciklama">Kurban kesim sürecinizi canlı izleyin.</div>
      <div class="dk-qr-resim-konteyner">
        <img src="${e(q.qrDataUrl)}" alt="Kesim takip QR" class="dk-qr-resim" />
      </div>
      <div class="dk-qr-alt">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        <span>Telefonunuzla okutun, kurbanınızın aşamalarını anlık takip edin.</span>
      </div>
    </div>
    <div class="dk-qr-sag">
      <div class="dk-canli-rozet">
        <span class="dk-canli-nokta"></span>
        CANLI YAYIN AKTİF
      </div>
      <div class="dk-inek-cizim">
        <svg viewBox="0 0 200 140" fill="none" stroke="${DEKONT_RENKLERI.secondary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="110" cy="80" rx="55" ry="30"/>
          <ellipse cx="55" cy="65" rx="22" ry="20"/>
          <ellipse cx="38" cy="72" rx="9" ry="6"/>
          <circle cx="34" cy="70" r="1.4" fill="currentColor"/>
          <circle cx="42" cy="70" r="1.4" fill="currentColor"/>
          <circle cx="52" cy="56" r="2" fill="currentColor"/>
          <ellipse cx="45" cy="48" rx="6" ry="4" transform="rotate(-30 45 48)"/>
          <ellipse cx="67" cy="50" rx="6" ry="4" transform="rotate(20 67 50)"/>
          <path d="M49 42 L45 32 M63 44 L67 34"/>
          <line x1="80" y1="105" x2="78" y2="125"/>
          <line x1="95" y1="108" x2="93" y2="128"/>
          <line x1="125" y1="108" x2="127" y2="128"/>
          <line x1="145" y1="105" x2="148" y2="125"/>
          <path d="M165 75 Q180 78 178 95"/>
          <circle cx="115" cy="80" r="14" fill="${DEKONT_RENKLERI.background}" stroke="${DEKONT_RENKLERI.primary}" stroke-width="1.5"/>
          <polygon points="111,73 111,87 123,80" fill="${DEKONT_RENKLERI.primary}" stroke="none"/>
        </svg>
      </div>
      <div class="dk-dogrulama-bolge">
        <div class="dk-dogrulama-baslik">Doğrulama Kodu</div>
        <div class="dk-dogrulama-kod">${e(q.dogrulamaKodu)}</div>
        <div class="dk-dogrulama-aciklama">Bu kod ile sitemiz üzerinden kesim sürecini doğrulayabilirsiniz.</div>
      </div>
    </div>
  </div>
  `;
}

export const DEKONT_QR_KART_CSS = `
.dk-qr-blok {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid ${DEKONT_RENKLERI.kartCerceve};
  border-radius: 12px;
  background: ${DEKONT_RENKLERI.kartArka};
}
.dk-qr-sol,
.dk-qr-sag {
  display: flex;
  flex-direction: column;
}
.dk-qr-sol {
  padding-right: 16px;
  border-right: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-qr-baslik {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: ${DEKONT_RENKLERI.primary};
  margin-bottom: 4px;
}
.dk-qr-aciklama {
  font-size: 10.5px;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 10px;
}
.dk-qr-resim-konteyner {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.dk-qr-resim {
  width: 110px;
  height: 110px;
  display: block;
  background: ${DEKONT_RENKLERI.background};
  padding: 4px;
  border-radius: 4px;
}
.dk-qr-alt {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 9.5px;
  color: ${DEKONT_RENKLERI.secondary};
  line-height: 1.4;
}
.dk-qr-alt svg {
  color: ${DEKONT_RENKLERI.tertiary};
  flex-shrink: 0;
  margin-top: 1px;
}
.dk-canli-rozet {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: ${DEKONT_RENKLERI.primary};
  margin-bottom: 8px;
  align-self: center;
}
.dk-canli-nokta {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${DEKONT_RENKLERI.primary};
}
.dk-inek-cizim {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  margin-bottom: 8px;
}
.dk-inek-cizim svg {
  max-width: 180px;
  width: 100%;
  height: auto;
}
.dk-dogrulama-bolge {
  text-align: center;
  padding-top: 4px;
}
.dk-dogrulama-baslik {
  font-size: 10px;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 4px;
}
.dk-dogrulama-kod {
  display: inline-block;
  padding: 5px 12px;
  border: 1.5px solid ${DEKONT_RENKLERI.primary};
  border-radius: 4px;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${DEKONT_RENKLERI.primary};
  margin-bottom: 6px;
}
.dk-dogrulama-aciklama {
  font-size: 9px;
  color: ${DEKONT_RENKLERI.tertiary};
  line-height: 1.4;
}
`;
