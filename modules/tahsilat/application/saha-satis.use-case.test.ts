import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  SahaSatisIslemSuruyorHatasi,
  sahaSatisTamamla,
} from "./saha-satis.use-case";

type SahaSatisBagimliliklari = Parameters<typeof sahaSatisTamamla>[1];

const komut = {
  musteriId: "musteri-1",
  hisseIds: ["hisse-1"],
  hisseFiyati: 45_000,
  nakit: 5_000,
  havale: 0,
  kart: 0,
  clientRequestId: "11111111-1111-4111-8111-111111111111",
};

function prismaMock(opts?: {
  onceki?: { sonucJson: string | null } | null;
  updateCount?: number;
}) {
  const tx = {
    islemAnahtari: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    musteri: {
      findFirst: vi.fn().mockResolvedValue({ id: "musteri-1" }),
    },
    hisse: {
      findMany: vi.fn().mockResolvedValue([
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
      ]),
      updateMany: vi.fn().mockResolvedValue({ count: opts?.updateCount ?? 1 }),
    },
    odeme: {
      create: vi.fn().mockResolvedValue({ id: "odeme-1" }),
    },
    kasaHareketi: {
      create: vi.fn().mockResolvedValue({ id: "kasa-1" }),
    },
  };

  const prisma = {
    islemAnahtari: {
      findUnique: vi.fn().mockResolvedValue(opts?.onceki ?? null),
    },
    $transaction: vi.fn(async (cb: (txClient: Prisma.TransactionClient) => Promise<unknown>) =>
      cb(tx as unknown as Prisma.TransactionClient),
    ),
  };

  return { prisma, tx };
}

describe("saha satis use-case", () => {
  it("atama, kapora, kasa, audit ve event yazimini tek transaction icinde orkestre eder", async () => {
    const { prisma, tx } = prismaMock();
    const auditLog = vi.fn().mockResolvedValue(undefined);
    const yayinla = vi.fn();

    const sonuc = await sahaSatisTamamla(
      {
        komut,
        kullaniciId: "user-1",
        ip: "127.0.0.1",
        tahsilatYetkisiVar: true,
      },
      {
        prisma: prisma as SahaSatisBagimliliklari["prisma"],
        auditLog,
        dekontNoUret: vi.fn().mockResolvedValue("TKR-2026-000001"),
        yayinla,
      },
    );

    expect(sonuc).toEqual({
      basarili: true,
      musteriId: "musteri-1",
      hisseIds: ["hisse-1"],
      odemeIds: ["odeme-1"],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.islemAnahtari.create).toHaveBeenCalledBefore(tx.hisse.updateMany);
    expect(tx.odeme.create).toHaveBeenCalledTimes(1);
    expect(tx.kasaHareketi.create).toHaveBeenCalledTimes(1);
    expect(auditLog).toHaveBeenCalledTimes(2);
    expect(yayinla).toHaveBeenCalledWith("hisse:atandi", {
      hisseIds: ["hisse-1"],
      musteriId: "musteri-1",
    });
    expect(yayinla).toHaveBeenCalledWith("tahsilat:olusturuldu", {
      musteriId: "musteri-1",
      hisseIds: ["hisse-1"],
      odemeIds: ["odeme-1"],
    });
  });

  it("onceki idempotent sonucu tekrar dondurur ve transaction baslatmaz", async () => {
    const oncekiSonuc = {
      basarili: true as const,
      musteriId: "musteri-1",
      hisseIds: ["hisse-1"],
      odemeIds: ["onceki-odeme"],
    };
    const { prisma } = prismaMock({
      onceki: { sonucJson: JSON.stringify(oncekiSonuc) },
    });

    await expect(
      sahaSatisTamamla(
        {
          komut,
          kullaniciId: "user-1",
          tahsilatYetkisiVar: true,
        },
        { prisma: prisma as SahaSatisBagimliliklari["prisma"] },
      ),
    ).resolves.toEqual(oncekiSonuc);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("sonucu henuz yazilmamis idempotency anahtarinda islem suruyor hatasi verir", async () => {
    const { prisma } = prismaMock({ onceki: { sonucJson: null } });

    await expect(
      sahaSatisTamamla(
        {
          komut,
          kullaniciId: "user-1",
          tahsilatYetkisiVar: true,
        },
        { prisma: prisma as SahaSatisBagimliliklari["prisma"] },
      ),
    ).rejects.toBeInstanceOf(SahaSatisIslemSuruyorHatasi);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
