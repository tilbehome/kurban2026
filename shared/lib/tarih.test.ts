import { describe, it, expect } from "vitest";
import {
  formatTarih,
  formatTarihSaat,
  formatSaat,
  dosyaTarihi,
} from "./tarih";

describe("formatTarih", () => {
  it("Date nesnesini Turkce kisa formata cevirir", () => {
    const t = new Date(2026, 4, 23);
    expect(formatTarih(t)).toBe("23.05.2026");
  });

  it("ISO string'i Turkce kisa formata cevirir", () => {
    expect(formatTarih("2026-05-23T10:00:00.000Z")).toMatch(/^23\.05\.2026$/);
  });

  it("null icin bos string doner", () => {
    expect(formatTarih(null)).toBe("");
  });

  it("undefined icin bos string doner", () => {
    expect(formatTarih(undefined)).toBe("");
  });

  it("bos string icin bos string doner", () => {
    expect(formatTarih("")).toBe("");
  });

  it("aydan tek haneli gunler iki haneli formatlanir", () => {
    const t = new Date(2026, 0, 5);
    expect(formatTarih(t)).toBe("05.01.2026");
  });
});

describe("formatTarihSaat", () => {
  it("tarih + saat doner", () => {
    const t = new Date(2026, 4, 23, 14, 32);
    expect(formatTarihSaat(t)).toBe("23.05.2026 14:32");
  });

  it("null icin bos string doner", () => {
    expect(formatTarihSaat(null)).toBe("");
  });

  it("saat ondalik dakika tek hane ise 2 hane padding alir", () => {
    const t = new Date(2026, 4, 23, 9, 5);
    expect(formatTarihSaat(t)).toBe("23.05.2026 09:05");
  });
});

describe("formatSaat", () => {
  it("sadece saat:dakika doner", () => {
    const t = new Date(2026, 4, 23, 14, 32);
    expect(formatSaat(t)).toBe("14:32");
  });

  it("00:00 dogru formatlanir", () => {
    const t = new Date(2026, 4, 23, 0, 0);
    expect(formatSaat(t)).toBe("00:00");
  });

  it("null icin bos string doner", () => {
    expect(formatSaat(null)).toBe("");
  });
});

describe("dosyaTarihi", () => {
  it("verilen tarihi yedek isimlendirme formatina cevirir", () => {
    const t = new Date(2026, 4, 23, 14, 32, 15);
    expect(dosyaTarihi(t)).toBe("2026-05-23_14-32-15");
  });

  it("argumansiz cagrilirsa simdi/now kullanir", () => {
    const sonuc = dosyaTarihi();
    expect(sonuc).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
  });
});
