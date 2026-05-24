/**
 * Standart API yardımcıları — MIMARI.md §6.3 + §11.2
 *
 * Tüm API route'ları bu helper'ları kullanır.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  UygulamaHatasi,
  ValidasyonHatası,
} from "./hatalar";
import { log } from "./log";
import type { ApiYanit, ApiOzet } from "@/shared/types/api";

/** Başarılı yanıt (HTTP 200) */
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

/** Hata yanıtı */
export function hataYaniti(
  mesaj: string,
  status = 500,
  kod?: string,
  detaylar?: unknown,
): NextResponse {
  const body: ApiYanit<never> = {
    basarili: false,
    hata: mesaj,
    kod,
    detaylar,
  };
  return NextResponse.json(body, { status });
}

/**
 * try-catch içinde fırlatılan herhangi bir hatayı uygun HTTP yanıtına çevirir.
 *
 * Kullanım:
 * ```ts
 * try { ... } catch (e) { return hataYakala(e); }
 * ```
 */
export function hataYakala(hata: unknown): NextResponse {
  if (hata instanceof z.ZodError) {
    return hataYaniti(
      "Geçersiz veri",
      400,
      "VALIDASYON",
      hata.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    );
  }

  if (hata instanceof ValidasyonHatası) {
    return hataYaniti(hata.message, hata.statusCode, hata.kod, hata.detaylar);
  }

  if (hata instanceof UygulamaHatasi) {
    return hataYaniti(hata.message, hata.statusCode, hata.kod);
  }

  log.hata("Beklenmeyen API hatası", hata);
  return hataYaniti(
    process.env.NODE_ENV === "development" && hata instanceof Error
      ? hata.message
      : "Sunucu hatası",
    500,
    "BEKLENMEYEN",
  );
}
