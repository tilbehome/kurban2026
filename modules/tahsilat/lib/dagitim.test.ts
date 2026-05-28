import { describe, it, expect } from "vitest";
import {
  belirleYontem,
  hisselereDagit,
  type DagitimHisseGirdisi,
} from "./dagitim";

/**
 * TAHSILAT DAGITIM ALGORITMASI — KUTSAL TESTLER
 *
 * Bu testler musteri parasinin hisse'ye dogru tahsis edilmesini garanti eder.
 * Yesil kalmadan deploy YOK.
 */

function girdi(
  partials: Array<Partial<DagitimHisseGirdisi> & { id: string; kalan: number }>,
): DagitimHisseGirdisi[] {
  return partials.map((p, i) => ({ no: i + 1, ...p }));
}

describe("belirleYontem", () => {
  it("sadece nakit varsa 'nakit' doner", () => {
    expect(belirleYontem(1000, 0, 0)).toBe("nakit");
  });

  it("sadece havale varsa 'havale' doner", () => {
    expect(belirleYontem(0, 1000, 0)).toBe("havale");
  });

  it("sadece kart varsa 'kart' doner", () => {
    expect(belirleYontem(0, 0, 1000)).toBe("kart");
  });

  it("iki kanal aktif ise 'karisik' doner (nakit+havale)", () => {
    expect(belirleYontem(500, 500, 0)).toBe("karisik");
  });

  it("iki kanal aktif ise 'karisik' doner (havale+kart)", () => {
    expect(belirleYontem(0, 500, 500)).toBe("karisik");
  });

  it("uc kanal aktif ise 'karisik' doner", () => {
    expect(belirleYontem(100, 200, 300)).toBe("karisik");
  });

  it("hicbir kanal yoksa 'nakit' default", () => {
    expect(belirleYontem(0, 0, 0)).toBe("nakit");
  });

  it("negatif degerleri sayma (kanal aktif degil)", () => {
    expect(belirleYontem(-100, 1000, 0)).toBe("havale");
  });
});

describe("hisselereDagit — esit (default)", () => {
  it("tek hisseye tutarin tamamini verir", () => {
    const sonuc = hisselereDagit(
      6428.57,
      girdi([{ id: "h1", kalan: 6428.57 }]),
      "esit",
    );
    expect(sonuc).toEqual([{ hisseId: "h1", tutar: 6428.57 }]);
  });

  it("2 hisseye esit boler", () => {
    const sonuc = hisselereDagit(
      10000,
      girdi([
        { id: "h1", kalan: 50000 },
        { id: "h2", kalan: 50000 },
      ]),
      "esit",
    );
    expect(sonuc).toEqual([
      { hisseId: "h1", tutar: 5000 },
      { hisseId: "h2", tutar: 5000 },
    ]);
  });

  it("7 hisseye boluyor — son hisseye yuvarlama farki gider", () => {
    const sonuc = hisselereDagit(
      45000,
      girdi([
        { id: "h1", kalan: 6428.57 },
        { id: "h2", kalan: 6428.57 },
        { id: "h3", kalan: 6428.57 },
        { id: "h4", kalan: 6428.57 },
        { id: "h5", kalan: 6428.57 },
        { id: "h6", kalan: 6428.57 },
        { id: "h7", kalan: 6428.58 },
      ]),
      "esit",
    );
    const toplamDagilan = sonuc.reduce((a, b) => a + b.tutar, 0);
    expect(Math.round(toplamDagilan * 100) / 100).toBe(45000);
  });

  it("hisse kalani esit dagitimi karsilamiyorsa hata firlatir", () => {
    expect(() =>
      hisselereDagit(
        20000,
        girdi([
          { id: "h1", kalan: 5000 },
          { id: "h2", kalan: 50000 },
        ]),
        "esit",
      ),
    ).toThrow(/Esit dağitim|Hisse 1 kalanını aşıyor/i);
  });
});

describe("hisselereDagit — sirayla", () => {
  it("ilk hisseyi tamamen doldurur, kalani ikinciye gider", () => {
    const sonuc = hisselereDagit(
      8000,
      girdi([
        { id: "h1", kalan: 5000 },
        { id: "h2", kalan: 5000 },
      ]),
      "sirayla",
    );
    expect(sonuc).toEqual([
      { hisseId: "h1", tutar: 5000 },
      { hisseId: "h2", tutar: 3000 },
    ]);
  });

  it("kalan 0 olunca sonraki hisseler 0 alir", () => {
    const sonuc = hisselereDagit(
      3000,
      girdi([
        { id: "h1", kalan: 5000 },
        { id: "h2", kalan: 5000 },
      ]),
      "sirayla",
    );
    expect(sonuc).toEqual([
      { hisseId: "h1", tutar: 3000 },
      { hisseId: "h2", tutar: 0 },
    ]);
  });

  it("tum hisselerin kalani toplam tutardan azsa hata firlatir", () => {
    expect(() =>
      hisselereDagit(
        20000,
        girdi([
          { id: "h1", kalan: 5000 },
          { id: "h2", kalan: 5000 },
        ]),
        "sirayla",
      ),
    ).toThrow(/fazla.*hisselere yerlesmedi|Dağıtım hatası/i);
  });

  it("hisse kalan = 0 ise atlar", () => {
    const sonuc = hisselereDagit(
      4000,
      girdi([
        { id: "h1", kalan: 0 },
        { id: "h2", kalan: 5000 },
      ]),
      "sirayla",
    );
    expect(sonuc[0]).toEqual({ hisseId: "h1", tutar: 0 });
    expect(sonuc[1]).toEqual({ hisseId: "h2", tutar: 4000 });
  });
});

describe("hisselereDagit — manuel", () => {
  it("manuel harita tutarlarini uygular", () => {
    const sonuc = hisselereDagit(
      3500,
      girdi([
        { id: "h1", kalan: 5000 },
        { id: "h2", kalan: 5000 },
      ]),
      "manuel",
      { h1: 1500, h2: 2000 },
    );
    expect(sonuc).toEqual([
      { hisseId: "h1", tutar: 1500 },
      { hisseId: "h2", tutar: 2000 },
    ]);
  });

  it("manuel haritada olmayan hisse 0 alir", () => {
    const sonuc = hisselereDagit(
      2000,
      girdi([
        { id: "h1", kalan: 5000 },
        { id: "h2", kalan: 5000 },
      ]),
      "manuel",
      { h1: 2000 },
    );
    expect(sonuc).toEqual([
      { hisseId: "h1", tutar: 2000 },
      { hisseId: "h2", tutar: 0 },
    ]);
  });

  it("manuel tutari hisse kalanini asiyorsa hata firlatir", () => {
    expect(() =>
      hisselereDagit(
        10000,
        girdi([
          { id: "h1", kalan: 5000 },
          { id: "h2", kalan: 5000 },
        ]),
        "manuel",
        { h1: 8000, h2: 2000 },
      ),
    ).toThrow(/Hisse 1.*girildi.*kalan/i);
  });

  it("manuel modu manuel olmadan cagrilirsa esit moda dusurur", () => {
    const sonuc = hisselereDagit(
      4000,
      girdi([
        { id: "h1", kalan: 5000 },
        { id: "h2", kalan: 5000 },
      ]),
      "manuel",
      undefined,
    );
    expect(sonuc).toEqual([
      { hisseId: "h1", tutar: 2000 },
      { hisseId: "h2", tutar: 2000 },
    ]);
  });
});

describe("hisselereDagit — gercek dunya senaryolari", () => {
  it("BUYUKBAS 7 HISSE: 7000 TL kapora 49000 TL bedelden", () => {
    const sonuc = hisselereDagit(
      7000,
      girdi([
        { id: "h1", kalan: 7000 },
        { id: "h2", kalan: 7000 },
        { id: "h3", kalan: 7000 },
        { id: "h4", kalan: 7000 },
        { id: "h5", kalan: 7000 },
        { id: "h6", kalan: 7000 },
        { id: "h7", kalan: 7000 },
      ]),
      "esit",
    );
    expect(sonuc).toHaveLength(7);
    const toplam = sonuc.reduce((a, b) => a + b.tutar, 0);
    expect(Math.round(toplam * 100) / 100).toBe(7000);
  });

  it("KUCUKBAS TEK HISSE: 5500 TL kucukbas tam odeme", () => {
    const sonuc = hisselereDagit(
      5500,
      girdi([{ id: "h1", kalan: 5500 }]),
      "esit",
    );
    expect(sonuc).toEqual([{ hisseId: "h1", tutar: 5500 }]);
  });

  it("KISMI ODEME: yarisini odeyen musteri", () => {
    const sonuc = hisselereDagit(
      3500,
      girdi([{ id: "h1", kalan: 7000 }]),
      "esit",
    );
    expect(sonuc).toEqual([{ hisseId: "h1", tutar: 3500 }]);
  });

  it("FLOAT ARTIFACT: 33333.33 + 33333.33 + 33333.34 = 100000", () => {
    const sonuc = hisselereDagit(
      100000,
      girdi([
        { id: "h1", kalan: 50000 },
        { id: "h2", kalan: 50000 },
        { id: "h3", kalan: 50000 },
      ]),
      "esit",
    );
    const toplam = sonuc.reduce((a, b) => a + b.tutar, 0);
    expect(Math.round(toplam * 100) / 100).toBe(100000);
  });
});
