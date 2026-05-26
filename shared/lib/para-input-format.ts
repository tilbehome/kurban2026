/**
 * Ödeme/tutar input'unda KULLANICI YAZARKEN format uygular.
 *
 * Özellikleri:
 * - Türkçe locale: `.` binlik ayırıcı, `,` ondalık ayırıcı
 * - Sadece rakam + 1 virgül kabul eder
 * - Maksimum 2 ondalık basamak
 * - Boş string'i kabul eder
 *
 * parsePara() bu formatı zaten doğru parse ediyor (Türkçe locale):
 *   parsePara("1.000.000,50") === 1000000.5
 *
 * Örnekler:
 *   ""           → ""
 *   "1000"       → "1.000"
 *   "1000000"    → "1.000.000"
 *   "1000,50"    → "1.000,50"
 *   "1000,505"   → "1.000,50"   (3. ondalık atılır)
 *   "abc1000"    → "1.000"
 *   ",50"        → "0,50"
 */
export function paraInputFormatla(girdi: string): string {
  if (!girdi) return "";

  // 1) Sadece rakam ve virgül bırak
  let temiz = girdi.replace(/[^\d,]/g, "");

  // 2) Birden fazla virgül varsa sadece ilk virgülü tut
  const virgulIndex = temiz.indexOf(",");
  if (virgulIndex !== -1) {
    const oncesi = temiz.slice(0, virgulIndex);
    const sonrasi = temiz.slice(virgulIndex + 1).replace(/,/g, "");
    temiz = oncesi + "," + sonrasi;
  }

  // 3) Virgülden öncesi ve sonrasını ayır
  const [tamKismi = "", ondalikKismi] = temiz.split(",");

  // 4) Ondalık maksimum 2 karakter
  const ondalikKesik =
    ondalikKismi !== undefined ? ondalikKismi.slice(0, 2) : undefined;

  // 5) Başındaki sıfırları temizle
  let tamTemiz =
    tamKismi.replace(/^0+/, "") || (tamKismi.length > 0 ? "0" : "");

  // 6) ",50" → "0,50"
  if (girdi.startsWith(",") && tamTemiz === "") {
    tamTemiz = "0";
  }

  // 7) Binlik ayraç (3'lü gruplara böl, sağdan)
  let formatTam = "";
  if (tamTemiz.length > 0) {
    for (let i = tamTemiz.length; i > 0; i -= 3) {
      const baslangic = Math.max(0, i - 3);
      const parca = tamTemiz.slice(baslangic, i);
      formatTam = parca + (formatTam ? "." + formatTam : "");
    }
  }

  // 8) Birleştir
  if (ondalikKesik !== undefined) {
    return formatTam + "," + ondalikKesik;
  }
  return formatTam;
}
