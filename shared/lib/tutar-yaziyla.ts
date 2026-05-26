/**
 * Sayıyı Türkçe okunuşa çevirir — dekont "yazıyla" satırı için.
 *
 * Örnekler:
 *   27000   → "Yirmi yedi bin Türk Lirası"
 *   1500.50 → "Bin beş yüz Türk Lirası elli kuruş"
 *   100     → "Yüz Türk Lirası"
 *   0       → "Sıfır Türk Lirası"
 */

const BIRLER = [
  "",
  "bir",
  "iki",
  "üç",
  "dört",
  "beş",
  "altı",
  "yedi",
  "sekiz",
  "dokuz",
];

const ONLAR = [
  "",
  "on",
  "yirmi",
  "otuz",
  "kırk",
  "elli",
  "altmış",
  "yetmiş",
  "seksen",
  "doksan",
];

const BASAMAK = ["", "bin", "milyon", "milyar", "trilyon"];

function ucBasamak(n: number): string {
  if (n === 0) return "";
  const yuz = Math.floor(n / 100);
  const onlu = Math.floor((n % 100) / 10);
  const birli = n % 10;

  const parcalar: string[] = [];

  if (yuz === 1) parcalar.push("yüz");
  else if (yuz > 1) parcalar.push(BIRLER[yuz] + " yüz");

  if (onlu > 0) parcalar.push(ONLAR[onlu]);
  if (birli > 0) parcalar.push(BIRLER[birli]);

  return parcalar.join(" ");
}

export function tutariYaziyaCevir(tutar: number): string {
  if (tutar === 0) return "Sıfır Türk Lirası";
  if (tutar < 0) return "Eksi " + tutariYaziyaCevir(-tutar);

  // Kuruş ayrımı
  const tamSayi = Math.floor(tutar);
  const kurus = Math.round((tutar - tamSayi) * 100);

  // Tam sayıyı 3'lü gruplara böl (sondan başa)
  const gruplar: number[] = [];
  let kalan = tamSayi;
  while (kalan > 0) {
    gruplar.push(kalan % 1000);
    kalan = Math.floor(kalan / 1000);
  }

  // Her grubu Türkçe'ye çevir + basamak ekle
  const parcalar: string[] = [];
  for (let i = gruplar.length - 1; i >= 0; i--) {
    const grup = gruplar[i]!;
    if (grup === 0) continue;

    // "Bir bin" yerine sadece "bin"
    if (i === 1 && grup === 1) {
      parcalar.push("bin");
    } else if (grup === 1 && i === 0) {
      parcalar.push("bir");
    } else {
      parcalar.push(ucBasamak(grup) + (i > 0 ? " " + BASAMAK[i] : ""));
    }
  }

  let sonuc = parcalar.join(" ").trim() + " Türk Lirası";

  // İlk harfi büyük
  sonuc = sonuc.charAt(0).toUpperCase() + sonuc.slice(1);

  // Kuruş varsa ekle
  if (kurus > 0) {
    const kurusYazi = ucBasamak(kurus);
    sonuc += " " + kurusYazi + " kuruş";
  }

  return sonuc;
}
