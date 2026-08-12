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
  | "TENANT_RESERVATION_EXPIRY_FAILED"
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
  | "TENANT_OPERATIONS_FAILED"
  | "PROTECTED_DOCUMENT_STORAGE_REQUIRED"
  | "PROXY_SHARE_COUNT_INVALID"
  | "PROXY_SHARE_SCOPE_INVALID"
  | "QR_TOKEN_NOT_FOUND"
  | "QR_TOKEN_REVOKED"
  | "QR_TOKEN_EXPIRED"
  | "SLAUGHTER_SHARE_CARD_INVALID"
  | "SLAUGHTER_REQUIRES_SEVEN_SHARES"
  | "SLAUGHTER_REQUIRES_SEVEN_VALID_PROXY_DOCUMENTS"
  | "RELIGIOUS_ELIGIBILITY_OPEN_DECISION_REQUIRED"
  | "ANIMAL_QURBAN_ELIGIBILITY_BLOCKED"
  | "SLAUGHTER_JOB_NOT_FOUND"
  | "SLAUGHTER_TRANSITION_NOT_ALLOWED"
  | "WEIGHT_PRECISION_INVALID"
  | "PACKAGE_WEIGHT_PRECISION_INVALID"
  | "WEIGHING_ANIMAL_SCOPE_INVALID"
  | "PACKAGE_SHARE_SCOPE_INVALID"
  | "DELIVERY_SHARE_SCOPE_INVALID"
  | "DELIVERY_CUSTOMER_MISMATCH"
  | "DELIVERY_REQUIRES_SOLD_SHARE"
  | "DELIVERY_REQUIRES_READY_PACKAGE"
  | "SHARE_ALREADY_DELIVERED"
  | "DELIVERY_NOT_FOUND"
  | "DELIVERY_NOT_REVERSIBLE"
  | "DELIVERY_DEBT_OVERRIDE_APPROVAL_REQUIRED"
  | "LOADING_LIST_EMPTY"
  | "ANIMAL_CLOSE_REQUIRES_SEVEN_DELIVERIES"
  | "OFFLINE_QUEUE_SECRET_FORBIDDEN"
  | "CRITICAL_OPERATION_OFFLINE_FORBIDDEN"
  | "IDEMPOTENCY_CONFLICT"
  | "TENANT_MANAGEMENT_ANALYTICS_FAILED"
  | "SEARCH_QUERY_TOO_SHORT"
  | "DEMO_DATA_PRODUCTION_FORBIDDEN"
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
  TENANT_RESERVATION_EXPIRY_FAILED: { kod: "TENANT_RESERVATION_EXPIRY_FAILED", mesajAnahtari: "error.internal.saleCouldNotComplete", httpStatus: 500, kullaniciyaGosterilebilir: true },
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
  TENANT_OPERATIONS_FAILED: { kod: "TENANT_OPERATIONS_FAILED", mesajAnahtari: "error.internal.operationCouldNotComplete", httpStatus: 500, kullaniciyaGosterilebilir: true },
  PROTECTED_DOCUMENT_STORAGE_REQUIRED: { kod: "PROTECTED_DOCUMENT_STORAGE_REQUIRED", mesajAnahtari: "error.operations.protectedDocumentStorageRequired", httpStatus: 400, kullaniciyaGosterilebilir: true },
  PROXY_SHARE_COUNT_INVALID: { kod: "PROXY_SHARE_COUNT_INVALID", mesajAnahtari: "error.operations.proxyShareCountInvalid", httpStatus: 400, kullaniciyaGosterilebilir: true },
  PROXY_SHARE_SCOPE_INVALID: { kod: "PROXY_SHARE_SCOPE_INVALID", mesajAnahtari: "error.operations.proxyShareScopeInvalid", httpStatus: 409, kullaniciyaGosterilebilir: true },
  QR_TOKEN_NOT_FOUND: { kod: "QR_TOKEN_NOT_FOUND", mesajAnahtari: "error.operations.qrTokenInvalid", httpStatus: 404, kullaniciyaGosterilebilir: true },
  QR_TOKEN_REVOKED: { kod: "QR_TOKEN_REVOKED", mesajAnahtari: "error.operations.qrTokenInvalid", httpStatus: 409, kullaniciyaGosterilebilir: true },
  QR_TOKEN_EXPIRED: { kod: "QR_TOKEN_EXPIRED", mesajAnahtari: "error.operations.qrTokenExpired", httpStatus: 410, kullaniciyaGosterilebilir: true },
  SLAUGHTER_SHARE_CARD_INVALID: { kod: "SLAUGHTER_SHARE_CARD_INVALID", mesajAnahtari: "error.operations.slaughterShareCardInvalid", httpStatus: 404, kullaniciyaGosterilebilir: true },
  SLAUGHTER_REQUIRES_SEVEN_SHARES: { kod: "SLAUGHTER_REQUIRES_SEVEN_SHARES", mesajAnahtari: "error.operations.slaughterRequiresSevenShares", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SLAUGHTER_REQUIRES_SEVEN_VALID_PROXY_DOCUMENTS: { kod: "SLAUGHTER_REQUIRES_SEVEN_VALID_PROXY_DOCUMENTS", mesajAnahtari: "error.operations.slaughterRequiresSevenProxyDocuments", httpStatus: 409, kullaniciyaGosterilebilir: true },
  RELIGIOUS_ELIGIBILITY_OPEN_DECISION_REQUIRED: { kod: "RELIGIOUS_ELIGIBILITY_OPEN_DECISION_REQUIRED", mesajAnahtari: "error.operations.religiousEligibilityOpenDecisionRequired", httpStatus: 409, kullaniciyaGosterilebilir: true },
  ANIMAL_QURBAN_ELIGIBILITY_BLOCKED: { kod: "ANIMAL_QURBAN_ELIGIBILITY_BLOCKED", mesajAnahtari: "error.operations.animalQurbanEligibilityBlocked", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SLAUGHTER_JOB_NOT_FOUND: { kod: "SLAUGHTER_JOB_NOT_FOUND", mesajAnahtari: "error.operations.slaughterJobNotFound", httpStatus: 404, kullaniciyaGosterilebilir: true },
  SLAUGHTER_TRANSITION_NOT_ALLOWED: { kod: "SLAUGHTER_TRANSITION_NOT_ALLOWED", mesajAnahtari: "error.operations.slaughterTransitionNotAllowed", httpStatus: 409, kullaniciyaGosterilebilir: true },
  WEIGHT_PRECISION_INVALID: { kod: "WEIGHT_PRECISION_INVALID", mesajAnahtari: "error.operations.weightPrecisionInvalid", httpStatus: 400, kullaniciyaGosterilebilir: true },
  PACKAGE_WEIGHT_PRECISION_INVALID: { kod: "PACKAGE_WEIGHT_PRECISION_INVALID", mesajAnahtari: "error.operations.weightPrecisionInvalid", httpStatus: 400, kullaniciyaGosterilebilir: true },
  WEIGHING_ANIMAL_SCOPE_INVALID: { kod: "WEIGHING_ANIMAL_SCOPE_INVALID", mesajAnahtari: "error.operations.weighingAnimalScopeInvalid", httpStatus: 409, kullaniciyaGosterilebilir: true },
  PACKAGE_SHARE_SCOPE_INVALID: { kod: "PACKAGE_SHARE_SCOPE_INVALID", mesajAnahtari: "error.operations.packageShareScopeInvalid", httpStatus: 409, kullaniciyaGosterilebilir: true },
  DELIVERY_SHARE_SCOPE_INVALID: { kod: "DELIVERY_SHARE_SCOPE_INVALID", mesajAnahtari: "error.operations.deliveryShareScopeInvalid", httpStatus: 409, kullaniciyaGosterilebilir: true },
  DELIVERY_CUSTOMER_MISMATCH: { kod: "DELIVERY_CUSTOMER_MISMATCH", mesajAnahtari: "error.operations.deliveryCustomerMismatch", httpStatus: 409, kullaniciyaGosterilebilir: true },
  DELIVERY_REQUIRES_SOLD_SHARE: { kod: "DELIVERY_REQUIRES_SOLD_SHARE", mesajAnahtari: "error.operations.deliveryRequiresSoldShare", httpStatus: 409, kullaniciyaGosterilebilir: true },
  DELIVERY_REQUIRES_READY_PACKAGE: { kod: "DELIVERY_REQUIRES_READY_PACKAGE", mesajAnahtari: "error.operations.deliveryRequiresReadyPackage", httpStatus: 409, kullaniciyaGosterilebilir: true },
  SHARE_ALREADY_DELIVERED: { kod: "SHARE_ALREADY_DELIVERED", mesajAnahtari: "error.operations.shareAlreadyDelivered", httpStatus: 409, kullaniciyaGosterilebilir: true },
  DELIVERY_NOT_FOUND: { kod: "DELIVERY_NOT_FOUND", mesajAnahtari: "error.operations.deliveryNotFound", httpStatus: 404, kullaniciyaGosterilebilir: true },
  DELIVERY_NOT_REVERSIBLE: { kod: "DELIVERY_NOT_REVERSIBLE", mesajAnahtari: "error.operations.deliveryNotReversible", httpStatus: 409, kullaniciyaGosterilebilir: true },
  DELIVERY_DEBT_OVERRIDE_APPROVAL_REQUIRED: { kod: "DELIVERY_DEBT_OVERRIDE_APPROVAL_REQUIRED", mesajAnahtari: "error.operations.deliveryDebtOverrideApprovalRequired", httpStatus: 409, kullaniciyaGosterilebilir: true },
  LOADING_LIST_EMPTY: { kod: "LOADING_LIST_EMPTY", mesajAnahtari: "error.operations.loadingListEmpty", httpStatus: 400, kullaniciyaGosterilebilir: true },
  ANIMAL_CLOSE_REQUIRES_SEVEN_DELIVERIES: { kod: "ANIMAL_CLOSE_REQUIRES_SEVEN_DELIVERIES", mesajAnahtari: "error.operations.animalCloseRequiresSevenDeliveries", httpStatus: 409, kullaniciyaGosterilebilir: true },
  OFFLINE_QUEUE_SECRET_FORBIDDEN: { kod: "OFFLINE_QUEUE_SECRET_FORBIDDEN", mesajAnahtari: "error.operations.offlineSecretForbidden", httpStatus: 400, kullaniciyaGosterilebilir: true },
  CRITICAL_OPERATION_OFFLINE_FORBIDDEN: { kod: "CRITICAL_OPERATION_OFFLINE_FORBIDDEN", mesajAnahtari: "error.operations.criticalOperationOfflineForbidden", httpStatus: 409, kullaniciyaGosterilebilir: true },
  IDEMPOTENCY_CONFLICT: { kod: "IDEMPOTENCY_CONFLICT", mesajAnahtari: "error.idempotency.conflict", httpStatus: 409, kullaniciyaGosterilebilir: true },
  TENANT_MANAGEMENT_ANALYTICS_FAILED: { kod: "TENANT_MANAGEMENT_ANALYTICS_FAILED", mesajAnahtari: "error.internal.managementAnalyticsCouldNotComplete", httpStatus: 500, kullaniciyaGosterilebilir: true },
  SEARCH_QUERY_TOO_SHORT: { kod: "SEARCH_QUERY_TOO_SHORT", mesajAnahtari: "error.management.searchQueryTooShort", httpStatus: 400, kullaniciyaGosterilebilir: true },
  DEMO_DATA_PRODUCTION_FORBIDDEN: { kod: "DEMO_DATA_PRODUCTION_FORBIDDEN", mesajAnahtari: "error.demoData.productionForbidden", httpStatus: 403, kullaniciyaGosterilebilir: true },
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
