import { describe, expect, it, vi } from "vitest";

function req(): Request {
  return new Request("http://localhost/api/hisseler/toplu-ata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      atamalar: [
        { hisseId: "hisse-1", musteriId: "musteri-1", hisseFiyati: 45000 },
        { hisseId: "hisse-2", musteriId: "musteri-2", hisseFiyati: 45000 },
      ],
    }),
  });
}

describe("POST /api/hisseler/toplu-ata", () => {
  it("hisselerden biri doluysa hicbir atama yazmaz", async () => {
    vi.resetModules();

    const tx = {
      hisse: {
        findMany: vi.fn().mockResolvedValue([
          { id: "hisse-1", musteriId: null, no: 1 },
          { id: "hisse-2", musteriId: "musteri-eski", no: 2 },
        ]),
        updateMany: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(async (cb: (txClient: unknown) => Promise<unknown>) =>
        cb(tx),
      ),
    };

    vi.doMock("@/shared/lib/prisma", () => ({ prisma }));
    vi.doMock("@/shared/lib/session", () => ({
      aktifOturum: vi.fn().mockResolvedValue({ kullaniciId: "user-1", rol: "kasiyer" }),
    }));
    vi.doMock("@/shared/lib/izinler", () => ({
      izinKontrol: vi.fn(() => true),
    }));
    vi.doMock("@/shared/lib/audit", () => ({
      auditLog: vi.fn(async (veri) => {
        await veri.tx.auditLog.create({ data: veri });
      }),
      ipCikar: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/shared/lib/events", () => ({ yayinla: vi.fn() }));

    const { POST } = await import("@/app/api/hisseler/toplu-ata/route");
    const res = await POST(req());

    expect(res.status).toBe(409);
    expect(tx.hisse.updateMany).not.toHaveBeenCalled();
  });
});
