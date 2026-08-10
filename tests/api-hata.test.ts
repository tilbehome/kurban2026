import { describe, expect, it, vi } from "vitest";
import { apiHataGovdesi, beklenmeyenHataYaniti } from "@/shared/lib/api-hata";
import { hataTanimi } from "@/shared/lib/hata-katalogu";

describe("merkezi api hata katalogu", () => {
  it("kararli kod, mesaj anahtari ve http status eslemesi tasir", () => {
    expect(hataTanimi("SHARE_ALREADY_ASSIGNED")).toMatchObject({
      mesajAnahtari: "error.share.alreadyAssigned",
      httpStatus: 409,
      kullaniciyaGosterilebilir: true,
    });
  });

  it("geriye uyumlu hata alani ile yeni alanlari birlikte dondurur", () => {
    const govde = apiHataGovdesi("SHARE_ALREADY_ASSIGNED", { shareLabel: "7.1" }, "req-1");

    expect(govde).toMatchObject({
      basarili: false,
      hata: "Hisse #7.1 zaten dolu.",
      kod: "SHARE_ALREADY_ASSIGNED",
      mesajAnahtari: "error.share.alreadyAssigned",
      parametreler: { shareLabel: "7.1" },
      requestId: "req-1",
    });
  });

  it("requestId otomatik uretir ve mesaj parametrelerini guvenli hale getirir", () => {
    const govde = apiHataGovdesi("SHARE_ALREADY_ASSIGNED", {
      shareLabel: "7.1\r\nX-Injected: true",
    });

    expect(govde.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(govde.parametreler?.shareLabel).toBe("7.1  X-Injected: true");
    expect(govde.hata).toBe("Hisse #7.1  X-Injected: true zaten dolu.");
  });

  it("beklenmeyen hatalarda stack veya hassas deger sizdirmez", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = beklenmeyenHataYaniti(new Error("GIZLI_DEGER=ornek"), "INTERNAL_SALE_FAILED");
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.kod).toBe("INTERNAL_SALE_FAILED");
    expect(body.hata).toBe("Satış işlemi tamamlanamadı.");
    expect(JSON.stringify(body)).not.toContain("ornek");
    expect(JSON.stringify(body)).not.toContain("GIZLI_DEGER");
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain("ornek");
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain("GIZLI_DEGER");
    consoleSpy.mockRestore();
  });
});
