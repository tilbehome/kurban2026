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
  | "TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED"
  | "TENANT_SALES_FINANCE_FAILED"
  | "PRICE_TARIFF_ITEM_REQUIRED"
  | "RESERVATION_WINDOW_INVALID"
  | "SHARE_COUNT_INVALID"
  | "DISCOUNT_EXCEEDS_LIST_PRICE"
  | "POSITIVE_AMOUNT_REQUIRED"
  | "PAYMENT_ALLOCATION_TOTAL_MISMATCH"
  | "RECEIPT_METHOD_REQUIRED"
  | "POS_FIELDS_REQUIRE_POS_METHOD"
  | "MONEY_INVALID"
  | "QURBAN_ELIGIBILITY_BLOCKED"
  | "SHARE_NOT_SELLABLE"
  | "SEASON_ARCHIVED_READ_ONLY"
  | "SEASON_OPERATION_NOT_ALLOWED"
  | "SEASON_NOT_FOUND"
  | "SHARE_SEASON_MISMATCH"
  | "IDEMPOTENCY_KEY_REUSED"
  | "IDEMPOTENCY_REQUEST_IN_PROGRESS"
  | "FINANCIAL_ACCOUNT_NOT_FOUND"
  | "SALE_NOT_FOUND"
  | "SALE_NOT_CANCELLABLE"
  | "SALE_WITH_PAYMENT_REQUIRES_REVERSAL_FLOW"
  | "SOURCE_SHARE_NOT_TRANSFERABLE"
  | "TARGET_SHARE_NOT_AVAILABLE"
  | "SHARE_SEQUENCE_OUT_OF_RANGE"
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
  TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED: { kod: "TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED", mesajAnahtari: "error.tenant.postgresNotEnabled", httpStatus: 409, kullaniciyaGosterilebilir: true },
  TENANT_SALES_FINANCE_FAILED: { kod: "TENANT_SALES_FINANCE_FAILED", mesajAnahtari: "error.internal.saleCouldNotComplete", httpStatus: 500, kullaniciyaGosterilebilir: true },
  PRICE_TARIFF_ITEM_REQUIRED: { kod: "PRICE_TARIFF_ITEM_REQUIRED", mesajAnahtari: "error.pricing.itemRequired", httpStatus: 400, kullaniciyaGosterilebilir: true },
  RESERVATION_WINDOW_INVALID: { kod: "RESERVATION_WINDOW_INVALID", mesajAnahtari: "error.reservation.windowInvalid", httpStatus: 400, kullaniciyaGosterilebilir: true },
  SHARE_COUNT_INVALID: { kod: "SHARE_COUNT_INVALID", mesajAnahtari: "error.share.countInvalid", httpStatus: 400, kullaniciyaGosterilebilir: true },
  DISCOUNT_EXCEEDS_LIST_PRICE: { kod: "DISCOUNT_EXCEEDS_LIST_PRICE", mesajAnahtari: "error.finance.discountExceedsListPrice", httpStatus: 400, kullaniciyaGosterilebilir: true },
  POSITIVE_AMOUNT_REQUIRED: { kod: "POSITIVE_AMOUNT_REQUIRED", mesajAnahtari: "error.finance.positiveAmountRequired", httpStatus: 400, kullaniciyaGosterilebilir: true },
  PAYMENT_ALLOCATION_TOTAL_MISMATCH: { kod: "PAYMENT_ALLOCATION_TOTAL_MISMATCH", mesajAnahtari: "error.finance.allocationMismatch", httpStatus: 400, kullaniciyaGosterilebilir: true },
  RECEIPT_METHOD_REQUIRED: { kod: "RECEIPT_METHOD_REQUIRED", mesajAnahtari: "error.finance.receiptMethodRequired", httpStatus: 400, kullaniciyaGosterilebilir: true },
  POS_FIELDS_REQUIRE_POS_METHOD: { kod: "POS_FIELDS_REQUIRE_POS_METHOD", mesajAnahtari: "error.finance.posFieldsRequirePos", httpStatus: 400, kullaniciyaGosterilebilir: true },
  MONEY_INVALID: { kod: "MONEY_INVALID", mesajAnahtari: "error.finance.moneyInvalid", httpStatus: 400, kullaniciyaGosterilebilir: true },
  QURBAN_ELIGIBILITY_BLOCKED: { kod: "QURBAN_ELIGIBILITY_BLOCKED", mesajAnahtari: "error.share.qurbanEligibilityBlocked", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SHARE_NOT_SELLABLE: { kod: "SHARE_NOT_SELLABLE", mesajAnahtari: "error.share.notSellable", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SEASON_ARCHIVED_READ_ONLY: { kod: "SEASON_ARCHIVED_READ_ONLY", mesajAnahtari: "error.season.archivedReadOnly", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SEASON_OPERATION_NOT_ALLOWED: { kod: "SEASON_OPERATION_NOT_ALLOWED", mesajAnahtari: "error.season.operationNotAllowed", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SEASON_NOT_FOUND: { kod: "SEASON_NOT_FOUND", mesajAnahtari: "error.notFound.season", httpStatus: 404, kullaniciyaGosterilebilir: true },
  SHARE_SEASON_MISMATCH: { kod: "SHARE_SEASON_MISMATCH", mesajAnahtari: "error.share.seasonMismatch", httpStatus: 400, kullaniciyaGosterilebilir: true },
  IDEMPOTENCY_KEY_REUSED: { kod: "IDEMPOTENCY_KEY_REUSED", mesajAnahtari: "error.conflict.idempotencyReused", httpStatus: 409, kullaniciyaGosterilebilir: true },
  IDEMPOTENCY_REQUEST_IN_PROGRESS: { kod: "IDEMPOTENCY_REQUEST_IN_PROGRESS", mesajAnahtari: "error.conflict.requestProcessing", httpStatus: 409, kullaniciyaGosterilebilir: true },
  FINANCIAL_ACCOUNT_NOT_FOUND: { kod: "FINANCIAL_ACCOUNT_NOT_FOUND", mesajAnahtari: "error.finance.accountNotFound", httpStatus: 500, kullaniciyaGosterilebilir: true },
  SALE_NOT_FOUND: { kod: "SALE_NOT_FOUND", mesajAnahtari: "error.notFound.sale", httpStatus: 404, kullaniciyaGosterilebilir: true },
  SALE_NOT_CANCELLABLE: { kod: "SALE_NOT_CANCELLABLE", mesajAnahtari: "error.sale.notCancellable", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SALE_WITH_PAYMENT_REQUIRES_REVERSAL_FLOW: { kod: "SALE_WITH_PAYMENT_REQUIRES_REVERSAL_FLOW", mesajAnahtari: "error.sale.paymentRequiresReversal", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SOURCE_SHARE_NOT_TRANSFERABLE: { kod: "SOURCE_SHARE_NOT_TRANSFERABLE", mesajAnahtari: "error.share.sourceNotTransferable", httpStatus: 409, kullaniciyaGosterilebilir: true },
  TARGET_SHARE_NOT_AVAILABLE: { kod: "TARGET_SHARE_NOT_AVAILABLE", mesajAnahtari: "error.share.targetNotAvailable", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SHARE_SEQUENCE_OUT_OF_RANGE: { kod: "SHARE_SEQUENCE_OUT_OF_RANGE", mesajAnahtari: "error.share.sequenceOutOfRange", httpStatus: 400, kullaniciyaGosterilebilir: true },
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
