import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hataMesaji, hataTanimi, type HataKodu } from "./hata-katalogu";
import { log } from "./log";

export type GuvenliHataParametreleri = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ApiHataGovdesi {
  basarili: false;
  hata: string;
  kod: HataKodu;
  mesajAnahtari: string;
  parametreler?: GuvenliHataParametreleri;
  requestId?: string;
}

export class KatalogHatasi extends Error {
  constructor(
    public kod: HataKodu,
    public parametreler?: GuvenliHataParametreleri,
  ) {
    super(kod);
    this.name = "KatalogHatasi";
  }
}

export function requestIdOlustur(): string {
  return randomUUID();
}

function hataParametreleriniGuvenliYap(
  parametreler?: GuvenliHataParametreleri,
): GuvenliHataParametreleri | undefined {
  if (!parametreler) return undefined;

  const guvenli: GuvenliHataParametreleri = {};
  for (const [anahtar, deger] of Object.entries(parametreler)) {
    if (deger === null || deger === undefined) {
      guvenli[anahtar] = deger;
      continue;
    }
    if (typeof deger === "string") {
      guvenli[anahtar] = deger.replace(/[\r\n\t]/g, " ").slice(0, 200);
      continue;
    }
    guvenli[anahtar] = deger;
  }
  return guvenli;
}

export function apiHataGovdesi(
  kod: HataKodu,
  parametreler?: GuvenliHataParametreleri,
  requestId?: string,
): ApiHataGovdesi {
  const tanim = hataTanimi(kod);
  const guvenliParametreler = hataParametreleriniGuvenliYap(parametreler);
  return {
    basarili: false,
    hata: hataMesaji(kod, guvenliParametreler),
    kod,
    mesajAnahtari: tanim.mesajAnahtari,
    ...(guvenliParametreler ? { parametreler: guvenliParametreler } : {}),
    requestId: requestId ?? requestIdOlustur(),
  };
}

export function apiHataYaniti(
  kod: HataKodu,
  parametreler?: GuvenliHataParametreleri,
  status?: number,
): NextResponse {
  const tanim = hataTanimi(kod);
  const requestId = requestIdOlustur();
  return NextResponse.json(apiHataGovdesi(kod, parametreler, requestId), {
    status: status ?? tanim.httpStatus,
  });
}

export function zodHataYaniti(hata: z.ZodError): NextResponse {
  const ilk = hata.issues[0];
  return apiHataYaniti("VALIDATION_INVALID", {
    alan: ilk?.path.join(".") || "govde",
    sebep: ilk?.message ?? "Geçersiz veri",
  });
}

export function guvenliLogHatasi(hata: unknown): Record<string, unknown> {
  if (hata instanceof KatalogHatasi) {
    return { hataTipi: hata.name, kod: hata.kod };
  }

  if (hata instanceof Error) {
    return { hataTipi: hata.name };
  }

  return { hataTipi: typeof hata };
}

export function beklenmeyenHataYaniti(
  hata: unknown,
  kod: HataKodu = "INTERNAL_UNEXPECTED",
  logMesaji = "Beklenmeyen API hatası",
): NextResponse {
  log.hata(logMesaji, undefined, guvenliLogHatasi(hata));
  return apiHataYaniti(kod);
}
