import { describe, expect, it, vi } from "vitest";
import {
  eksikMesajAnahtarlari,
  localeCoz,
  localeYon,
  mesajCoz,
  paraBicimlendir,
  rtlMi,
} from "@/shared/lib/i18n";
import { apiHataMesajiCoz } from "@/shared/lib/api-mesaj";

describe("i18n temeli", () => {
  it("desteklenmeyen locale icin tr fallback kullanir", () => {
    expect(localeCoz("de")).toBe("tr");
    expect(mesajCoz("error.auth.required", "en")).toBe("Önce giriş yapmalısınız.");
  });

  it("turkce karakterleri ve parametreleri bozmadan cozer", () => {
    expect(mesajCoz("error.notFound.proxy", "tr")).toBe("Vekâlet bulunamadı.");
    expect(
      mesajCoz("error.share.alreadyAssigned", "tr", { shareLabel: "7.1" }),
    ).toBe("Hisse #7.1 zaten dolu.");
  });

  it("eksik mesaj anahtarini guvenli placeholder ile gosterir", () => {
    expect(mesajCoz("error.missing.example", "tr")).toBe(
      "[missing:error.missing.example]",
    );
    expect(eksikMesajAnahtarlari("en")).toContain("error.auth.required");
  });

  it("production ortaminda eksik mesaj anahtarini teknik key olarak gostermez", () => {
    const onceki = process.env.NODE_ENV ?? "test";
    vi.stubEnv("NODE_ENV", "production");

    expect(mesajCoz("error.missing.example", "tr")).toBe(
      "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
    );

    vi.stubEnv("NODE_ENV", onceki);
  });

  it("arapca icin rtl yon bilgisini verir", () => {
    expect(rtlMi("ar")).toBe(true);
    expect(localeYon("ar")).toBe("rtl");
    expect(localeYon("tr")).toBe("ltr");
  });

  it("TRY para formatini locale ile uretir", () => {
    expect(paraBicimlendir(1234.5, "tr")).toContain("₺");
    expect(paraBicimlendir(1234.5, "tr")).toContain("1.234,50");
  });

  it("api hata mesajini mesajAnahtari oncelikli cozer", () => {
    expect(
      apiHataMesajiCoz({
        hata: "Eski mesaj",
        mesajAnahtari: "error.share.alreadyAssigned",
        parametreler: { shareLabel: "2" },
      }),
    ).toBe("Hisse #2 zaten dolu.");
  });
});
