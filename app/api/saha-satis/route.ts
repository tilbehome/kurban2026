import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { ipCikar } from "@/shared/lib/audit";
import { yayinla } from "@/shared/lib/events";
import { masterDataMode, tenantActiveSeasonId, tenantSalesFinanceService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import {
  apiHataYaniti,
  beklenmeyenHataYaniti,
  zodHataYaniti,
} from "@/shared/lib/api-hata";
import {
  sahaSatisTamamla,
  SahaSatisIslemSuruyorHatasi,
} from "@/modules/tahsilat/application/saha-satis.use-case";
import {
  SahaSatisKuraliHatasi,
  type SahaSatisSonucu,
} from "@/modules/tahsilat/domain/saha-satis";
import { TenantSalesFinanceError } from "@/packages/tenant-core/src";
import type { HataKodu } from "@/shared/lib/hata-katalogu";

const SahaSatisSchema = z.object({
  musteriId: z.string().min(1),
  hisseIds: z.array(z.string().min(1)).min(1).max(7),
  hisseFiyati: z.number().positive("Fiyat 0'dan büyük olmalı"),
  nakit: z.number().min(0).default(0),
  havale: z.number().min(0).default(0),
  kart: z.number().min(0).default(0),
  notlar: z.string().trim().max(500).optional(),
  clientRequestId: z.string().uuid(),
});

type SahaSatisBody =
  | SahaSatisSonucu
  | {
      basarili: false;
      hata: string;
      kod?: string;
      mesajAnahtari?: string;
      parametreler?: Record<string, string | number | boolean | null>;
      requestId?: string;
    };

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return apiHataYaniti("AUTH_REQUIRED");
  }
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return apiHataYaniti("PERMISSION_DENIED");
  }

  let veri: z.infer<typeof SahaSatisSchema>;
  try {
    veri = SahaSatisSchema.parse((await req.json()) as unknown);
  } catch (e) {
    if (e instanceof z.ZodError) return zodHataYaniti(e);
    return apiHataYaniti("VALIDATION_INVALID");
  }

  try {
    if (masterDataMode() === "postgres") {
      const nakit = moneyString(veri.nakit);
      const havale = moneyString(veri.havale);
      const kart = moneyString(veri.kart);
      const methodSplits = [
        veri.nakit > 0 ? { id: `split_cash_${veri.clientRequestId}`, method: "cash" as const, amount: nakit } : null,
        veri.havale > 0 ? { id: `split_bank_${veri.clientRequestId}`, method: "bank_transfer" as const, amount: havale } : null,
        veri.kart > 0 ? { id: `split_pos_${veri.clientRequestId}`, method: "pos" as const, amount: kart } : null,
      ].filter((item): item is NonNullable<typeof item> => item !== null);
      const service = tenantSalesFinanceService();
      const seasonId = tenantActiveSeasonId();
      const result = await service.confirmSale(tenantUseCaseContext(oturum, { request: req, payload: veri, idempotencyKey: veri.clientRequestId }), {
        id: `sale_${veri.clientRequestId}`,
        seasonId,
        customerId: veri.musteriId,
        shareIds: veri.hisseIds,
        listPricePerShare: moneyString(veri.hisseFiyati),
        discountPerShare: "0",
        downPayment: {
          receiptId: `receipt_${veri.clientRequestId}`,
          receiptNo: `SFS-${veri.clientRequestId.slice(0, 8)}`,
          methodSplits,
        },
      });
      return NextResponse.json({ basarili: true, musteriId: veri.musteriId, hisseIds: veri.hisseIds, odemeIds: [result.receiptId] } satisfies SahaSatisSonucu);
    }

    const body: SahaSatisBody = await sahaSatisTamamla(
      {
        komut: veri,
        kullaniciId: oturum.kullaniciId,
        ip: ipCikar(req),
        tahsilatYetkisiVar: izinKontrol(oturum, "tahsilat.olustur"),
      },
      { prisma, yayinla },
    );

    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof TenantSalesFinanceError) {
      return apiHataYaniti(e.code as HataKodu);
    }
    if (e instanceof SahaSatisKuraliHatasi) {
      return apiHataYaniti(e.kod, e.parametreler);
    }
    if (e instanceof SahaSatisIslemSuruyorHatasi) {
      return apiHataYaniti("REQUEST_ALREADY_PROCESSING");
    }
    return beklenmeyenHataYaniti(e, "INTERNAL_SALE_FAILED", "Saha satış tamamlanamadı");
  }
}

function moneyString(value: number): string {
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
