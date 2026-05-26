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
import { dekontFooterHtml, DEKONT_FOOTER_CSS } from "./dekont-footer";
// SPRINT-DEKONT-V3: QR / İmza / Rozet kaldırıldı (privacy + sade tasarım).
// Dosyalar duruyor — backend HMAC üretmeye devam ediyor, sadece HTML'de
// gösterilmiyor.

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
  /** Müşterinin sahip olduğu toplam aktif hisse sayısı (tüm kurbanlar dahil) */
  musteriHisseAdedi: number;
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
    musteriHisseAdedi: d.musteriHisseAdedi,
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
  <style>${ANA_CSS}${DEKONT_HEADER_CSS}${DEKONT_META_SERIT_CSS}${DEKONT_MUSTERI_KART_CSS}${DEKONT_OZET_KART_CSS}${DEKONT_FOOTER_CSS}${KOPYA_CSS}${YAZDIRMA_CSS}</style>
</head>
<body>
  <div class="dk-toolbar">
    <button class="dk-btn dk-btn-primary" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Yazdır / PDF
    </button>
    <a class="dk-btn" href="javascript:window.close()">Kapat</a>
  </div>

  <!-- 1. KOPYA: MÜŞTERİ -->
  <div class="dk-dekont dk-kopya-1">
    <div class="dk-kopya-etiket">MÜŞTERİ KOPYASI</div>
    ${header}
    ${metaSerit}
    <div class="dk-ana-grid">
      ${musteriKart}
      ${ozetKart}
    </div>
    ${footer}
  </div>

  <!-- KESİK ÇİZGİ -->
  <div class="dk-kesik-cizgi">
    <span class="dk-kesik-ikon">✂</span>
    <span class="dk-kesik-yazi">Kesip ayırın</span>
  </div>

  <!-- 2. KOPYA: ŞİRKET -->
  <div class="dk-dekont dk-kopya-2">
    <div class="dk-kopya-etiket">ŞİRKET KOPYASI</div>
    ${header}
    ${metaSerit}
    <div class="dk-ana-grid">
      ${musteriKart}
      ${ozetKart}
    </div>
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
  background: #f0f0f0;
  color: ${DEKONT_RENKLERI.primary};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.dk-toolbar {
  max-width: 800px;
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
  max-width: 800px;
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
  gap: 16px;
  align-items: stretch;
}
.dk-ana-grid > .dk-kart {
  display: flex;
  flex-direction: column;
}
`;

const KOPYA_CSS = `
.dk-kopya-etiket {
  position: absolute;
  top: 0;
  right: 0;
  background: ${DEKONT_RENKLERI.primary};
  color: ${DEKONT_RENKLERI.background};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding: 4px 10px;
  border-radius: 0 4px 0 8px;
}
.dk-dekont {
  position: relative;
}
.dk-kesik-cizgi {
  max-width: 800px;
  margin: 8mm auto;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 2px dashed ${DEKONT_RENKLERI.tertiary};
  padding-top: 6px;
  justify-content: center;
  color: ${DEKONT_RENKLERI.tertiary};
  font-size: 10px;
  letter-spacing: 0.08em;
}
.dk-kesik-ikon {
  font-size: 14px;
}
.dk-kesik-yazi {
  font-weight: 600;
}
`;

const YAZDIRMA_CSS = `
/* Ekran: iki A5 form üst-alt görünür */
.dk-dekont {
  max-width: 800px;
  width: 100%;
  margin: 0 auto 8mm;
  box-sizing: border-box;
}

/* YAZDIRMA: A4 dikey içinde 2 A5 form (üst+alt) */
@media print {
  body {
    background: white;
    padding: 0;
    margin: 0;
  }
  .dk-toolbar { display: none; }
  .dk-dekont {
    box-shadow: none;
    border: 0;
    padding: 8mm 10mm;
    max-width: none;
    margin: 0;
    border-radius: 0;
    height: 144mm; /* A5 ~148mm, kesik çizgi için 4mm pay */
    box-sizing: border-box;
    overflow: hidden;
  }
  .dk-kopya-etiket {
    font-size: 8px;
    padding: 3px 8px;
  }
  .dk-kesik-cizgi {
    margin: 1mm 0;
    max-width: none;
    padding: 2px 0;
  }
  /* Kart boyutları A5'e sığacak şekilde */
  .dk-meta-serit {
    padding: 6px 8px;
    margin-bottom: 8px;
    gap: 6px;
  }
  .dk-meta-kart { padding: 2px 4px; }
  .dk-meta-baslik { font-size: 8px; }
  .dk-meta-deger { font-size: 10px; }
  .dk-meta-ikon { width: 14px; height: 14px; }
  .dk-kart {
    padding: 10px;
  }
  .dk-kart-baslik {
    font-size: 9px;
    margin-bottom: 8px;
  }
  .dk-musteri-satir {
    padding: 4px 0;
    font-size: 9px;
    grid-template-columns: 14px 75px 1fr;
    gap: 6px;
  }
  .dk-musteri-etiket { font-size: 8px; }
  .dk-musteri-deger { font-size: 10px; }
  .dk-kurban-sira-blok {
    margin: 6px 0;
    padding: 6px 4px;
    grid-template-columns: 28px 1fr 28px;
  }
  .dk-defne-sol, .dk-defne-sag { height: 40px; }
  .dk-kurban-sira-baslik { font-size: 8px; }
  .dk-kurban-sira-numara { font-size: 36px; }
  .dk-kurban-sira-hisse { font-size: 8px; }
  .dk-ozet-satir {
    padding: 4px 0;
    font-size: 10px;
  }
  .dk-ozet-toplam {
    padding: 6px 0;
    margin: 4px 0;
    font-size: 11px;
  }
  .dk-ozet-yontem {
    padding: 5px 0;
    font-size: 10px;
  }
  .dk-ozet-yaziyla {
    padding: 4px 0;
    font-size: 9px;
  }
  .dk-ozet-kalan {
    padding: 6px 0 2px;
    font-size: 12px;
  }
  .dk-ana-grid { gap: 8px; }
  @page {
    size: A4 portrait;
    margin: 8mm 0;
  }
}

@media (max-width: 640px) {
  .dk-ana-grid { grid-template-columns: 1fr; }
  .dk-meta-serit { grid-template-columns: repeat(2, 1fr); }
  .dk-header-icerik { flex-direction: column; }
  .dk-header-sag { text-align: left; }
  .dk-dekont { padding: 20px; }
}
`;
