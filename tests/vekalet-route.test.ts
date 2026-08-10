import { describe, expect, it, vi } from "vitest";

describe("GET /api/vekaletler/[id]", () => {
  it("oturum yoksa eski status ile merkezi 403 hata dondurur", async () => {
    vi.resetModules();

    vi.doMock("@/shared/lib/session", () => ({
      aktifOturum: vi.fn().mockResolvedValue(null),
    }));
    vi.doMock("@/shared/lib/izinler", () => ({
      izinKontrol: vi.fn(() => true),
    }));
    vi.doMock("@/shared/lib/prisma", () => ({
      prisma: { vekalet: { findFirst: vi.fn() } },
    }));
    vi.doMock("@/shared/lib/audit", () => ({
      auditLog: vi.fn(),
      ipCikar: vi.fn(() => "127.0.0.1"),
    }));

    const { GET } = await import("@/app/api/vekaletler/[id]/route");
    const res = await GET(new Request("http://localhost/api/vekaletler/vek-1"), {
      params: Promise.resolve({ id: "vek-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toMatchObject({
      basarili: false,
      kod: "PERMISSION_DENIED",
      mesajAnahtari: "error.permission.denied",
    });
  });

  it("dosya bulunamazsa fiziksel yol sizdirmeden merkezi 404 hata dondurur", async () => {
    vi.resetModules();

    vi.doMock("node:fs/promises", () => ({
      default: { readFile: vi.fn().mockRejectedValue(new Error("C:\\gizli\\dosya.pdf")) },
    }));
    vi.doMock("@/shared/lib/session", () => ({
      aktifOturum: vi.fn().mockResolvedValue({ kullaniciId: "user-1", rol: "kasiyer" }),
    }));
    vi.doMock("@/shared/lib/izinler", () => ({
      izinKontrol: vi.fn(() => true),
    }));
    vi.doMock("@/shared/lib/prisma", () => ({
      prisma: {
        vekalet: {
          findFirst: vi.fn().mockResolvedValue({
            id: "vek-1",
            hisseId: "hisse-1",
            dosyaUrl: "vekalet://dosya.pdf",
            dosyaTipi: "pdf",
          }),
        },
      },
    }));
    vi.doMock("@/shared/lib/audit", () => ({
      auditLog: vi.fn(),
      ipCikar: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/shared/lib/vekalet-dosya", () => ({
      vekaletDosyaYoluBul: vi.fn(() => "C:\\gizli\\dosya.pdf"),
      vekaletMimeTipi: vi.fn(() => "application/pdf"),
    }));

    const { GET } = await import("@/app/api/vekaletler/[id]/route");
    const res = await GET(new Request("http://localhost/api/vekaletler/vek-1"), {
      params: Promise.resolve({ id: "vek-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.kod).toBe("FILE_PROXY_NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain("gizli");
    expect(JSON.stringify(body)).not.toContain("dosya.pdf");
  });
});
