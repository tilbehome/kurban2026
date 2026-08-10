/**
 * Standart API yardımcıları.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { UygulamaHatasi, ValidasyonHatasi } from "./hatalar";
import type { ApiYanit, ApiOzet } from "@/shared/types/api";
import {
  apiHataGovdesi,
  beklenmeyenHataYaniti,
  requestIdOlustur,
  zodHataYaniti,
} from "./api-hata";
import { HATA_KATALOGU, type HataKodu } from "./hata-katalogu";

/** Başarılı yanıt. */
export function basariliYanit<T>(
  veri: T,
  ozet?: ApiOzet,
  status = 200,
): NextResponse {
  const body: ApiYanit<T> = ozet
    ? { basarili: true, veri, ozet }
    : { basarili: true, veri };
  return NextResponse.json(body, { status });
}
/**
 * Geriye uyumlu hata yanıtı.
 *
 * Yeni hata kodları için zengin sözleşme döner; eski serbest kodlarda mevcut
 * `{ basarili:false, hata, kod, detaylar }` biçimini korur.
 */
export function hataYaniti(
  mesaj: string,
  status = 500,
  kod?: string,
  detaylar?: unknown,
): NextResponse {
  if (kod && katalogKoduMu(kod)) {
    const requestId = requestIdOlustur();
    return NextResponse.json(
      {
        ...apiHataGovdesi(kod, undefined, requestId),
        hata: mesaj,
        detaylar,
      },
      { status },
    );
  }

  const body: ApiYanit<never> = {
    basarili: false,
    hata: mesaj,
    kod,
    detaylar,
  };
  return NextResponse.json(body, { status });
}

/** try-catch içinde fırlatılan hatayı güvenli HTTP yanıtına çevirir. */
export function hataYakala(hata: unknown): NextResponse {
  if (hata instanceof z.ZodError) {
    return zodHataYaniti(hata);
  }

  if (hata instanceof ValidasyonHatasi) {
    return hataYaniti(hata.message, hata.statusCode, hata.kod, hata.detaylar);
  }

  if (hata instanceof UygulamaHatasi) {
    return hataYaniti(hata.message, hata.statusCode, hata.kod);
  }

  return beklenmeyenHataYaniti(hata);
}

function katalogKoduMu(kod: string): kod is HataKodu {
  return kod in HATA_KATALOGU;
}
