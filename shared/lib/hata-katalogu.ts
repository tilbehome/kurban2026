import { mesajCoz } from "./i18n";

export type HataKodu =
  | "AUTH_REQUIRED"
  | "PERMISSION_DENIED"
  | "VALIDATION_INVALID"
  | "CUSTOMER_NOT_FOUND"
  | "SHARE_NOT_FOUND"
  | "SHARES_NOT_FOUND"
  | "PROXY_NOT_FOUND"
  | "REQUEST_ALREADY_PROCESSING"
  | "SHARE_ALREADY_ASSIGNED"
  | "SHARE_CONCURRENT_ASSIGNMENT"
  | "SHARE_ALREADY_EMPTY"
  | "FINANCE_DOWN_PAYMENT_EXCEEDS_SALE"
  | "FINANCE_SHARE_HAS_ACTIVE_PAYMENT"
  | "FILE_INVALID_PROXY_PATH"
  | "FILE_PROXY_NOT_FOUND"
  | "INTERNAL_UNEXPECTED"
  | "INTERNAL_SALE_FAILED";

export interface HataTanimi {
  kod: HataKodu;
  mesajAnahtari: string;
  httpStatus: number;
  kullaniciyaGosterilebilir: boolean;
}

export const HATA_KATALOGU = {
  AUTH_REQUIRED: {
    kod: "AUTH_REQUIRED",
    mesajAnahtari: "error.auth.required",
    httpStatus: 401,
    kullaniciyaGosterilebilir: true,
  },
  PERMISSION_DENIED: {
    kod: "PERMISSION_DENIED",
    mesajAnahtari: "error.permission.denied",
    httpStatus: 403,
    kullaniciyaGosterilebilir: true,
  },
  VALIDATION_INVALID: {
    kod: "VALIDATION_INVALID",
    mesajAnahtari: "error.validation.invalid",
    httpStatus: 400,
    kullaniciyaGosterilebilir: true,
  },
  CUSTOMER_NOT_FOUND: {
    kod: "CUSTOMER_NOT_FOUND",
    mesajAnahtari: "error.notFound.customer",
    httpStatus: 404,
    kullaniciyaGosterilebilir: true,
  },
  SHARE_NOT_FOUND: {
    kod: "SHARE_NOT_FOUND",
    mesajAnahtari: "error.notFound.share",
    httpStatus: 404,
    kullaniciyaGosterilebilir: true,
  },
  SHARES_NOT_FOUND: {
    kod: "SHARES_NOT_FOUND",
    mesajAnahtari: "error.notFound.shares",
    httpStatus: 404,
    kullaniciyaGosterilebilir: true,
  },
  PROXY_NOT_FOUND: {
    kod: "PROXY_NOT_FOUND",
    mesajAnahtari: "error.notFound.proxy",
    httpStatus: 404,
    kullaniciyaGosterilebilir: true,
  },
  REQUEST_ALREADY_PROCESSING: {
    kod: "REQUEST_ALREADY_PROCESSING",
    mesajAnahtari: "error.conflict.requestProcessing",
    httpStatus: 409,
    kullaniciyaGosterilebilir: true,
  },
  SHARE_ALREADY_ASSIGNED: {
    kod: "SHARE_ALREADY_ASSIGNED",
    mesajAnahtari: "error.share.alreadyAssigned",
    httpStatus: 409,
    kullaniciyaGosterilebilir: true,
  },
  SHARE_CONCURRENT_ASSIGNMENT: {
    kod: "SHARE_CONCURRENT_ASSIGNMENT",
    mesajAnahtari: "error.share.concurrentAssignment",
    httpStatus: 409,
    kullaniciyaGosterilebilir: true,
  },
  SHARE_ALREADY_EMPTY: {
    kod: "SHARE_ALREADY_EMPTY",
    mesajAnahtari: "error.share.alreadyEmpty",
    httpStatus: 400,
    kullaniciyaGosterilebilir: true,
  },
  FINANCE_DOWN_PAYMENT_EXCEEDS_SALE: {
    kod: "FINANCE_DOWN_PAYMENT_EXCEEDS_SALE",
    mesajAnahtari: "error.finance.downPaymentExceedsSale",
    httpStatus: 400,
    kullaniciyaGosterilebilir: true,
  },
  FINANCE_SHARE_HAS_ACTIVE_PAYMENT: {
    kod: "FINANCE_SHARE_HAS_ACTIVE_PAYMENT",
    mesajAnahtari: "error.finance.shareHasActivePayment",
    httpStatus: 409,
    kullaniciyaGosterilebilir: true,
  },
  FILE_INVALID_PROXY_PATH: {
    kod: "FILE_INVALID_PROXY_PATH",
    mesajAnahtari: "error.file.invalidProxyPath",
    httpStatus: 404,
    kullaniciyaGosterilebilir: true,
  },
  FILE_PROXY_NOT_FOUND: {
    kod: "FILE_PROXY_NOT_FOUND",
    mesajAnahtari: "error.file.proxyFileNotFound",
    httpStatus: 404,
    kullaniciyaGosterilebilir: true,
  },
  INTERNAL_UNEXPECTED: {
    kod: "INTERNAL_UNEXPECTED",
    mesajAnahtari: "error.internal.generic",
    httpStatus: 500,
    kullaniciyaGosterilebilir: true,
  },
  INTERNAL_SALE_FAILED: {
    kod: "INTERNAL_SALE_FAILED",
    mesajAnahtari: "error.internal.saleCouldNotComplete",
    httpStatus: 500,
    kullaniciyaGosterilebilir: true,
  },
} as const satisfies Record<HataKodu, HataTanimi>;

export function hataTanimi(kod: HataKodu): HataTanimi {
  return HATA_KATALOGU[kod];
}

export function hataMesaji(
  kod: HataKodu,
  parametreler?: Record<string, string | number | boolean | null | undefined>,
  locale?: string | null,
): string {
  return mesajCoz(hataTanimi(kod).mesajAnahtari, locale, parametreler);
}
