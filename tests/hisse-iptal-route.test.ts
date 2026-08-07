import { describe, expect, it, vi } from "vitest";

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/hisseler/hisse-1/iptal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/hisseler/[id]/iptal", () => {
  it("odemesi olan hisse dogrudan bosaltilamaz", async () => {
    vi.resetModules();

    const prisma = {
      hisse: {
        findFirst: vi.fn().mockResolvedValue({
          id: "hisse-1",
          musteriId: "musteri-1",
          odemeler: [{ toplamTutar: 1000 }],
        }),
        update: vi.fn(),
      },
      vekalet: {
        updateMany: vi.fn(),
      },
    };

    vi.doMock("@/shared/lib/prisma", () => ({ prisma }));
    vi.doMock("@/shared/lib/session", () => ({
      aktifOturum: vi.fn().mockResolvedValue({ kullaniciId: "user-1", rol: "kasiyer" }),
    }));
    vi.doMock("@/shared/lib/izinler", () => ({
      izinKontrol: vi.fn(() => true),
    }));
    vi.doMock("@/shared/lib/audit", () => ({
      auditLog: vi.fn(),
      ipCikar: vi.fn(() => "127.0.0.1"),
    }));

    const { POST } = await import("@/app/api/hisseler/[id]/iptal/route");
    const res = await POST(jsonReq({ sebep: "yanlis kayit" }), {
      params: Promise.resolve({ id: "hisse-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.basarili).toBe(false);
    expect(body.veri.odenenToplam).toBe(1000);
    expect(prisma.hisse.update).not.toHaveBeenCalled();
    expect(prisma.vekalet.updateMany).not.toHaveBeenCalled();
  });
});
