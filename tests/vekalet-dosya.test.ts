import { describe, expect, it } from "vitest";
import {
  guvenliVekaletDosyaAdi,
  vekaletDosyaApiUrl,
  vekaletDosyaYoluBul,
} from "@/shared/lib/vekalet-dosya";

describe("vekalet dosya guvenligi", () => {
  it("api linkini vekalet id uzerinden uretir, fiziksel yolu sizdirmaz", () => {
    expect(vekaletDosyaApiUrl("abc123")).toBe("/api/vekaletler/abc123");
  });

  it("path traversal ve tehlikeli uzantilari reddeder", () => {
    expect(guvenliVekaletDosyaAdi("../secret.pdf")).toBeNull();
    expect(guvenliVekaletDosyaAdi("a/secret.pdf")).toBeNull();
    expect(guvenliVekaletDosyaAdi("secret.exe")).toBeNull();
    expect(guvenliVekaletDosyaAdi("secret.pdf")).toBe("secret.pdf");
    expect(guvenliVekaletDosyaAdi("secret.png")).toBe("secret.png");
  });

  it("yalniz yeni depo veya legacy public vekalet yolunu cozer", () => {
    expect(vekaletDosyaYoluBul("vekalet://dosya.pdf")).toContain("data");
    expect(vekaletDosyaYoluBul("/uploads/vekalet/dosya.jpg")).toContain(
      "public",
    );
    expect(vekaletDosyaYoluBul("/uploads/vekalet/../secret.jpg")).toBeNull();
    expect(vekaletDosyaYoluBul("/uploads/baska/dosya.jpg")).toBeNull();
  });
});
