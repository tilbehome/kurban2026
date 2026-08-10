import { beforeEach, describe, expect, it, vi } from "vitest";

const payload = {
  musteriId: "musteri-1",
  hisseIds: ["hisse-1"],
  hisseFiyati: 45_000,
  nakit: 5_000,
  havale: 0,
  kart: 0,
  clientRequestId: "11111111-1111-4111-8111-111111111111",
};

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/saha-satis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function setup(opts?: {
  oturum?: { kullaniciId: string; rol: "admin" | "kasiyer" | "izleyici" } | null;
  izinler?: string[];
  onceki?: { sonucJson?: string | null } | null;
  musteriVar?: boolean;
  hisseler?: Array<{
    id: string;
    no: number;
    musteriId: string | null;
    hisseFiyati: number;
    kurban: { kesimSirasi: number; durum: string; kesimDurumu: string; silindiMi: boolean };
    odemeler: Array<{ toplamTutar: number }>;
  }>;
  updateCount?: number;
  odemeHatasi?: boolean;
}) {
  vi.resetModules();

  const oturum =
    opts && "oturum" in opts
      ? opts.oturum
      : { kullaniciId: "user-1", rol: "kasiyer" as const };
  const izinler = new Set(opts?.izinler ?? ["hisseler.ata", "tahsilat.olustur"]);

  const tx = {
    islemAnahtari: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    musteri: {
      findFirst: vi
        .fn()
        .mockResolvedValue(opts?.musteriVar === false ? null : { id: "musteri-1" }),
    },
    hisse: {
      findMany: vi.fn().mockResolvedValue(
        opts?.hisseler ?? [
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
            odemeler: [],
          },
        ],
      ),
      updateMany: vi.fn().mockResolvedValue({ count: opts?.updateCount ?? 1 }),
    },
    odeme: {
      create: vi.fn().mockImplementation(async () => {
        if (opts?.odemeHatasi) throw new Error("GIZLI_DEGER=ornek");
        return { id: "odeme-1" };
      }),
    },
    kasaHareketi: {
      create: vi.fn().mockResolvedValue({ id: "kasa-1" }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" }),
    },
  };

  const prisma = {
    islemAnahtari: {
      findUnique: vi.fn().mockResolvedValue(opts?.onceki ?? null),
    },
    $transaction: vi.fn(async (cb: (txClient: unknown) => Promise<unknown>) =>
      cb(tx),
    ),
  };

  vi.doMock("@/shared/lib/prisma", () => ({ prisma }));
  vi.doMock("@/shared/lib/session", () => ({
    aktifOturum: vi.fn().mockResolvedValue(oturum),
  }));
  vi.doMock("@/shared/lib/izinler", () => ({
    izinKontrol: vi.fn((_oturum, izin: string) => izinler.has(izin)),
  }));
  vi.doMock("@/shared/lib/audit", () => ({
    auditLog: vi.fn(async (veri) => {
      await veri.tx.auditLog.create({ data: veri });
    }),
    ipCikar: vi.fn(() => "127.0.0.1"),
  }));
  vi.doMock("@/shared/lib/events", () => ({ yayinla: vi.fn() }));
  vi.doMock("@/modules/tahsilat/lib/tahsilat.service", () => ({
    sonrakiDekontNo: vi.fn().mockResolvedValue("TKR-2026-000001"),
  }));

  const route = await import("@/app/api/saha-satis/route");
  return { POST: route.POST, prisma, tx };
}

describe("POST /api/saha-satis", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("yetkisiz kullanici satis yapamaz", async () => {
    const { POST, prisma } = await setup({ oturum: null });
    const res = await POST(jsonReq(payload));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toMatchObject({
      basarili: false,
      kod: "AUTH_REQUIRED",
      mesajAnahtari: "error.auth.required",
    });
    expect(body.hata).toBe("Önce giriş yapmalısınız.");
    expect(body.requestId).toBeTruthy();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("hisse atama yetkisi yoksa merkezi 403 hata dondurur", async () => {
    const { POST, prisma } = await setup({ izinler: ["tahsilat.olustur"] });
    const res = await POST(jsonReq(payload));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.kod).toBe("PERMISSION_DENIED");
    expect(body.mesajAnahtari).toBe("error.permission.denied");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("bos hisseyi atar ve kaporayi kasa/tahsilat ile ayni transaction icinde yazar", async () => {
    const { POST, prisma, tx } = await setup();
    const res = await POST(jsonReq(payload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ basarili: true, odemeIds: ["odeme-1"] });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.hisse.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["hisse-1"] }, musteriId: null }),
      }),
    );
    expect(tx.odeme.create).toHaveBeenCalledTimes(1);
    expect(tx.kasaHareketi.create).toHaveBeenCalledTimes(1);
  });

  it("ayni hisse eszamanli doldurulduysa ikinci istek reddedilir ve tahsilat yazmaz", async () => {
    const { POST, tx } = await setup({ updateCount: 0 });
    const res = await POST(jsonReq(payload));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.basarili).toBe(false);
    expect(body.kod).toBe("SHARE_CONCURRENT_ASSIGNMENT");
    expect(tx.odeme.create).not.toHaveBeenCalled();
    expect(tx.kasaHareketi.create).not.toHaveBeenCalled();
  });

  it("satilmis hisse yeniden satilamaz", async () => {
    const { POST, tx } = await setup({
      hisseler: [
        {
          id: "hisse-1",
          no: 1,
          musteriId: "baska-musteri",
          hisseFiyati: 45_000,
          kurban: { kesimSirasi: 7, durum: "aktif", kesimDurumu: "beklemede", silindiMi: false },
          odemeler: [],
        },
      ],
    });
    const res = await POST(jsonReq(payload));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toMatchObject({
      kod: "SHARE_ALREADY_ASSIGNED",
      mesajAnahtari: "error.share.alreadyAssigned",
      parametreler: { shareLabel: "7.1" },
    });
    expect(body.hata).toBe("Hisse #7.1 zaten dolu.");
    expect(tx.hisse.updateMany).not.toHaveBeenCalled();
    expect(tx.odeme.create).not.toHaveBeenCalled();
  });

  it("gecersiz musteri ve hisse reddedilir", async () => {
    const musteriYok = await setup({ musteriVar: false });
    expect((await musteriYok.POST(jsonReq(payload))).status).toBe(404);

    const hisseYok = await setup({ hisseler: [] });
    expect((await hisseYok.POST(jsonReq(payload))).status).toBe(404);
  });

  it("satis tutarini asan veya sifir/negatif fiyatli istek reddedilir", async () => {
    const { POST, prisma } = await setup();

    expect((await POST(jsonReq({ ...payload, nakit: 50_000 }))).status).toBe(400);
    const negatifFiyat = await POST(jsonReq({ ...payload, hisseFiyati: 0 }));
    expect(negatifFiyat.status).toBe(400);
    expect((await negatifFiyat.json()).kod).toBe("VALIDATION_INVALID");
    expect((await POST(jsonReq({ ...payload, nakit: -1 }))).status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("ayni clientRequestId tekrar gelirse mukerrer tahsilat olusturmaz", async () => {
    const oncekiSonuc = {
      basarili: true,
      musteriId: "musteri-1",
      hisseIds: ["hisse-1"],
      odemeIds: ["onceki-odeme"],
    };
    const { POST, prisma } = await setup({
      onceki: { sonucJson: JSON.stringify(oncekiSonuc) },
    });

    const res = await POST(jsonReq(payload));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(oncekiSonuc);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("kapora yazimi hata verirse hassas hata mesaji sizdirmaz", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { POST } = await setup({ odemeHatasi: true });
    const res = await POST(jsonReq(payload));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.hata).toBe("Satış işlemi tamamlanamadı.");
    expect(body.kod).toBe("INTERNAL_SALE_FAILED");
    expect(body.mesajAnahtari).toBe("error.internal.saleCouldNotComplete");
    expect(body.hata).not.toContain("ornek");
    expect(JSON.stringify(body)).not.toContain("GIZLI_DEGER");
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain("ornek");
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain("GIZLI_DEGER");
    consoleSpy.mockRestore();
  });
});
