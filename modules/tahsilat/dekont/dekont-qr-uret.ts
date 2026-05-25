/**
 * QR kod üretici — dekont için.
 *
 * Hedef URL: `${publicUrl}/tv/m/k/${kesimSirasi}` (canlı kesim takip)
 * Müşteri telefonla QR'ı okuttuğunda kendi kurbanının TV ekranına yönlendirilir.
 *
 * Çıktı: data:image/png;base64,... formatında base64 PNG.
 */

import QRCode from "qrcode";

export interface QrGirdisi {
  publicUrl: string;
  kesimSirasi: number;
}

export function dekontQrUrlOlustur(g: QrGirdisi): string {
  const base = g.publicUrl.replace(/\/+$/, "");
  return `${base}/tv/m/k/${g.kesimSirasi}`;
}

export async function dekontQrPngUret(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: {
      dark: "#1a1a1a",
      light: "#ffffff",
    },
  });
}
