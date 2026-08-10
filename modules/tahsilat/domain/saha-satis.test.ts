import { describe, expect, it } from "vitest";
import {
  SahaSatisKuraliHatasi,
  eszamanliAtamaBasariliOlmali,
  hisseKalanlariHesapla,
  hisselerBosOlmali,
  kaporaSatisBedeliniAsamaz,
  kaporaYetkisiniDogrula,
  odemeKanaliTutarlari,
  sahaSatisTutarlariHesapla,
  type SahaSatisKomutu,
} from "./saha-satis";

const komut: SahaSatisKomutu = {
  musteriId: "musteri-1",
  hisseIds: ["hisse-1", "hisse-2"],
  hisseFiyati: 45_000,
  nakit: 3_000,
  havale: 2_000,
  kart: 1_000,
  clientRequestId: "11111111-1111-4111-8111-111111111111",
};

describe("saha satis domain kurallari", () => {
  it("toplam kapora, satis bedeli ve kanal tutarlarini yuvarlar", () => {
    expect(sahaSatisTutarlariHesapla(komut)).toMatchObject({
      toplamKapora: 6_000,
      toplamBedel: 90_000,
      hisseFiyati: 45_000,
    });

    expect(odemeKanaliTutarlari(3_000, 6_000, komut)).toEqual({
      nakit: 1_500,
      havale: 1_000,
      kart: 500,
    });
  });

  it("pozitif kaporada tahsilat yetkisini ve satis bedeli limitini zorunlu tutar", () => {
    expect(() => kaporaYetkisiniDogrula(0, false)).not.toThrow();
    expect(() => kaporaYetkisiniDogrula(100, false)).toThrow(
      SahaSatisKuraliHatasi,
    );
    expect(() => kaporaSatisBedeliniAsamaz(90_000.01, 90_000)).not.toThrow();
    expect(() => kaporaSatisBedeliniAsamaz(90_000.02, 90_000)).toThrow(
      SahaSatisKuraliHatasi,
    );
  });

  it("dolu veya eszamanli atanmis hisseyi katalog hatasina cevirir", () => {
    expect(() =>
      hisselerBosOlmali([
        {
          id: "hisse-1",
          no: 1,
          musteriId: "musteri-2",
          hisseFiyati: 45_000,
          kurban: {
            kesimSirasi: 7,
            durum: "aktif",
            kesimDurumu: "beklemede",
            silindiMi: false,
          },
          odemeler: [],
        },
      ]),
    ).toThrow(SahaSatisKuraliHatasi);

    expect(() => eszamanliAtamaBasariliOlmali(1, 2)).toThrow(
      SahaSatisKuraliHatasi,
    );
  });

  it("hisse kalanlarini mevcut odemeleri duserek hesaplar", () => {
    expect(
      hisseKalanlariHesapla(
        [
          {
            id: "hisse-1",
            no: 1,
            musteriId: null,
            hisseFiyati: 45_000,
            kurban: {
              kesimSirasi: 7,
              durum: "aktif",
              kesimDurumu: "beklemede",
              silindiMi: false,
            },
            odemeler: [{ toplamTutar: 10_000.125 }],
          },
        ],
        45_000,
      ),
    ).toEqual([{ id: "hisse-1", no: 1, kalan: 34_999.88 }]);
  });
});
