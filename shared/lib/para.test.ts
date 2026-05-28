import { describe, it, expect } from "vitest";
import {
  formatPara,
  formatSayi,
  formatParaKisa,
  parsePara,
  yuvarla,
  topla,
  cikar,
} from "./para";

/**
 * TL para formatlama testleri.
 * Tahsilat akisinin temelini olusturur — float artifact'tan kacinma kritik.
 */
describe("formatPara", () => {
  it("tamsayiyi ondalikli formata cevirir", () => {
    expect(formatPara(44000)).toBe("₺44.000,00");
  });

  it("ondalikli sayiyi korur", () => {
    expect(formatPara(44000.5)).toBe("₺44.000,50");
  });

  it("kurusa yuvarlar", () => {
    expect(formatPara(44000.123)).toBe("₺44.000,12");
    expect(formatPara(44000.129)).toBe("₺44.000,13");
  });

  it("null degerini sifir olarak isler", () => {
    expect(formatPara(null)).toBe("₺0,00");
  });

  it("undefined degerini sifir olarak isler", () => {
    expect(formatPara(undefined)).toBe("₺0,00");
  });

  it("NaN degerini sifir olarak isler", () => {
    expect(formatPara(Number.NaN)).toBe("₺0,00");
  });

  it("negatif sayiyi dogru formatlar", () => {
    expect(formatPara(-1500)).toMatch(/1\.500,00/);
  });

  it("buyuk sayilari binlik ayirici ile dondurur", () => {
    expect(formatPara(1_500_000)).toBe("₺1.500.000,00");
  });
});

describe("formatSayi", () => {
  it("para sembolu olmadan formatlar", () => {
    expect(formatSayi(44000)).toBe("44.000,00");
  });

  it("null/undefined icin 0,00 doner", () => {
    expect(formatSayi(null)).toBe("0,00");
    expect(formatSayi(undefined)).toBe("0,00");
  });
});

describe("formatParaKisa", () => {
  it("milyonlari M olarak kisaltir", () => {
    expect(formatParaKisa(25_000_000)).toBe("₺25,0M");
    expect(formatParaKisa(1_500_000)).toBe("₺1,5M");
  });

  it("100K+ degerleri K olarak kisaltir", () => {
    expect(formatParaKisa(500_000)).toBe("₺500K");
    expect(formatParaKisa(150_000)).toBe("₺150K");
  });

  it("100K alti degerleri tam formatlar", () => {
    expect(formatParaKisa(50_000)).toBe("₺50.000,00");
  });

  it("null/undefined icin sifir doner", () => {
    expect(formatParaKisa(null)).toBe("₺0,00");
    expect(formatParaKisa(undefined)).toBe("₺0,00");
  });
});

describe("parsePara — Turkce locale", () => {
  it("nokta binlik ayirici, virgul ondaliki cozer", () => {
    expect(parsePara("44.000,50")).toBe(44000.5);
  });

  it("para sembolunu temizler", () => {
    expect(parsePara("₺44.000,00")).toBe(44000);
  });

  it("bos string icin 0 doner", () => {
    expect(parsePara("")).toBe(0);
  });

  it("sadece sayi giren kullanici icin calisir", () => {
    expect(parsePara("12345")).toBe(12345);
  });

  it("ondalik virgul ile calisir", () => {
    expect(parsePara("100,50")).toBe(100.5);
  });

  it("binlik nokta + ondalik virgul kombinasyonu", () => {
    expect(parsePara("1.250.000,75")).toBe(1250000.75);
  });

  it("gecersiz metin icin 0 doner", () => {
    expect(parsePara("abc")).toBe(0);
  });
});

describe("yuvarla — float artifact yok etme", () => {
  it("float artifact'i temizler (400000.00000000006 -> 400000)", () => {
    expect(yuvarla(400000.00000000006)).toBe(400000);
  });

  it("3. ondalik basamak yukari yuvarlar", () => {
    expect(yuvarla(100.126)).toBe(100.13);
  });

  it("3. ondalik basamak asagi yuvarlar", () => {
    expect(yuvarla(100.124)).toBe(100.12);
  });

  it("tam sayiyi degistirmez", () => {
    expect(yuvarla(50000)).toBe(50000);
  });
});

describe("topla — guvenli toplama", () => {
  it("iki sayiyi toplar", () => {
    expect(topla(100, 200)).toBe(300);
  });

  it("uc+ sayiyi toplar", () => {
    expect(topla(100, 200, 300, 400)).toBe(1000);
  });

  it("float artifact uretmez (0.1 + 0.2)", () => {
    expect(topla(0.1, 0.2)).toBe(0.3);
  });

  it("bos liste icin 0 doner", () => {
    expect(topla()).toBe(0);
  });

  it("kurban senaryosu: 7 hisseli buyukbas dagilimi", () => {
    expect(topla(6428.57, 6428.57, 6428.57, 6428.57, 6428.57, 6428.57, 6428.58)).toBe(45000);
  });
});

describe("cikar — guvenli cikarma", () => {
  it("iki sayiyi cikarir", () => {
    expect(cikar(1000, 300)).toBe(700);
  });

  it("float artifact uretmez (0.3 - 0.1)", () => {
    expect(cikar(0.3, 0.1)).toBe(0.2);
  });

  it("negatif sonuc dondurebilir (borc senaryosu)", () => {
    expect(cikar(100, 300)).toBe(-200);
  });
});
