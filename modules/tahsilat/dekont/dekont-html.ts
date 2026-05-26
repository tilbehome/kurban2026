/**
 * Ana dekont HTML üretici — tüm modüler parçaları birleştirir.
 *
 * A4 yazdırılabilir, gri tonlu, kurumsal görünüm.
 * Üst kenar şeritinde marka rengi (#DE0B1E), gerisi gri tonlama.
 */

import { DEKONT_RENKLERI, DEKONT_FONT } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";
import { dekontHeaderHtml, DEKONT_HEADER_CSS } from "./dekont-header";
import {
  dekontMetaSeritHtml,
  DEKONT_META_SERIT_CSS,
} from "./dekont-meta-serit";
import {
  dekontMusteriKartHtml,
  DEKONT_MUSTERI_KART_CSS,
} from "./dekont-musteri-kart";
import { dekontOzetKartHtml, DEKONT_OZET_KART_CSS } from "./dekont-ozet-kart";
import { dekontQrKartHtml, DEKONT_QR_KART_CSS } from "./dekont-qr-kart";
import { dekontImzaHtml, DEKONT_IMZA_CSS } from "./dekont-imza";
import { dekontRozetHtml, DEKONT_ROZET_CSS } from "./dekont-rozet";
import { dekontFooterHtml, DEKONT_FOOTER_CSS } from "./dekont-footer";

export interface DekontHtmlGirdisi {
  // Firma
  firmaAdi: string;
  firmaKisaAd: string;
  firmaSlogan: string;
  firmaTel: string;
  firmaEmail: string;
  firmaWeb: string;
  firmaAdres: string;
  firmaIl: string;
  firmaIlce: string;
  firmaWhatsapp: string;
  firmaInstagram: string;
  firmaSubeAktif: string;
  logoUrl: string;
  altYazi: string;
  yazilimBranding: string;

  // Meta
  tarih: string;
  saat: string;

  // Dekont
  dekontNo: string;
  dogrulamaKodu: string;

  // Müşteri / işlem
  musteriAdi: string;
  musteriTel: string;
  kurbanNo: number;
  hisseNo: number;
  kasiyer: string;

  // Tutarlar
  hisseBedeli: number;
  oncekiOdemeler: number;
  nakit: number;
  havale: number;
  kart: number;
  toplam: number;
  kalan: number;
  notlar: string;
  /** Ödeme yöntemi: nakit | havale | kart | karisik (Odeme.yontem DB alanı) */
  yontem: string;

  // QR
  qrDataUrl: string;
  qrHedefUrl: string;
}

export function dekontHtmlUret(d: DekontHtmlGirdisi): string {
  const e = escapeHtml;

  const header = dekontHeaderHtml({
    firmaAdi: d.firmaAdi,
    firmaKisaAd: d.firmaKisaAd,
    firmaSlogan: d.firmaSlogan,
    firmaTel: d.firmaTel,
    firmaEmail: d.firmaEmail,
    firmaWeb: d.firmaWeb,
    firmaAdres: d.firmaAdres,
    firmaIl: d.firmaIl,
    firmaIlce: d.firmaIlce,
    logoUrl: d.logoUrl,
  });

  const metaSerit = dekontMetaSeritHtml({
    tarih: d.tarih,
    saat: d.saat,
    sube: d.firmaSubeAktif,
    alan: d.firmaIlce || d.firmaIl || "—",
  });

  const musteriKart = dekontMusteriKartHtml({
    musteriAdi: d.musteriAdi,
    musteriTel: d.musteriTel,
    kurbanNo: d.kurbanNo,
    hisseNo: d.hisseNo,
    dekontNo: d.dekontNo,
    kasiyer: d.kasiyer,
  });

  const ozetKart = dekontOzetKartHtml({
    hisseBedeli: d.hisseBedeli,
    oncekiOdemeler: d.oncekiOdemeler,
    nakit: d.nakit,
    havale: d.havale,
    kart: d.kart,
    toplam: d.toplam,
    kalan: d.kalan,
    notlar: d.notlar,
    yontem: d.yontem,
  });

  const qrKart = dekontQrKartHtml({
    qrDataUrl: d.qrDataUrl,
    dogrulamaKodu: d.dogrulamaKodu,
    hedefUrl: d.qrHedefUrl,
  });

  const imza = dekontImzaHtml({
    kasiyerAdi: d.kasiyer,
    firmaKisaAd: d.firmaKisaAd,
  });

  const rozetler = dekontRozetHtml();

  const footer = dekontFooterHtml({
    altYazi: d.altYazi,
    firmaWhatsapp: d.firmaWhatsapp,
    firmaInstagram: d.firmaInstagram,
    yazilimBranding: d.yazilimBranding,
  });

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dekont ${e(d.dekontNo)} — ${e(d.musteriAdi)}</title>
  <style>${ANA_CSS}${DEKONT_HEADER_CSS}${DEKONT_META_SERIT_CSS}${DEKONT_MUSTERI_KART_CSS}${DEKONT_OZET_KART_CSS}${DEKONT_QR_KART_CSS}${DEKONT_IMZA_CSS}${DEKONT_ROZET_CSS}${DEKONT_FOOTER_CSS}${YAZDIRMA_CSS}</style>
</head>
<body>
  <div class="dk-toolbar">
    <button class="dk-btn dk-btn-primary" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Yazdır / PDF
    </button>
    <a class="dk-btn" href="javascript:window.close()">Kapat</a>
  </div>

  <div class="dk-dekont">
    ${header}
    ${metaSerit}

    <div class="dk-ana-grid">
      ${musteriKart}
      ${ozetKart}
    </div>

    <div style="margin-top: 16px;">
      ${qrKart}
    </div>

    ${imza}
    ${rozetler}
    ${footer}
  </div>
</body>
</html>`;
}

const ANA_CSS = `
* { box-sizing: border-box; }
body {
  font-family: ${DEKONT_FONT};
  margin: 0;
  padding: 24px 16px;
  background: #eeeeee;
  color: ${DEKONT_RENKLERI.primary};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.dk-toolbar {
  max-width: 760px;
  margin: 0 auto 14px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.dk-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid ${DEKONT_RENKLERI.accent};
  background: ${DEKONT_RENKLERI.background};
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  color: ${DEKONT_RENKLERI.primary};
  font-family: inherit;
}
.dk-btn-primary {
  background: ${DEKONT_RENKLERI.primary};
  color: ${DEKONT_RENKLERI.background};
  border-color: ${DEKONT_RENKLERI.primary};
}
.dk-dekont {
  max-width: 760px;
  margin: 0 auto;
  background: ${DEKONT_RENKLERI.background};
  padding: 32px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
}
.dk-ana-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
`;

const YAZDIRMA_CSS = `
@media print {
  body {
    background: white;
    padding: 0;
  }
  .dk-toolbar { display: none; }
  .dk-dekont {
    box-shadow: none;
    border: 0;
    padding: 16mm;
    max-width: none;
    margin: 0;
    border-radius: 0;
  }
  @page {
    size: A4;
    margin: 0;
  }
}
@media (max-width: 640px) {
  .dk-ana-grid {
    grid-template-columns: 1fr;
  }
  .dk-meta-serit {
    grid-template-columns: repeat(2, 1fr);
  }
  .dk-header-icerik {
    flex-direction: column;
  }
  .dk-header-sag {
    text-align: left;
  }
  .dk-dekont {
    padding: 20px;
  }
}
`;
