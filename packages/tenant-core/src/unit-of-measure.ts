export const MEASUREMENT_UNIT_CATEGORIES = ["COUNT", "WEIGHT", "LENGTH", "AREA", "VOLUME", "TIME", "PACKAGE", "SERVICE", "CUSTOM"] as const;
export type MeasurementUnitCategory = (typeof MEASUREMENT_UNIT_CATEGORIES)[number];

export interface UnitOfMeasureRecord {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  symbol: string;
  category: MeasurementUnitCategory;
  decimalPrecision: number;
  allowsFraction: boolean;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  version: number;
  usageCount: number;
}

export interface UnitOfMeasureInput {
  id: string;
  code: string;
  name: string;
  symbol: string;
  category: MeasurementUnitCategory;
  decimalPrecision: number;
  allowsFraction: boolean;
  sortOrder?: number;
}

export interface UnitOfMeasureRepository {
  list(tenantId: string, includeInactive: boolean): Promise<readonly UnitOfMeasureRecord[]>;
  create(tenantId: string, input: UnitOfMeasureInput, actorUserId: string): Promise<{ id: string }>;
  update(tenantId: string, id: string, input: Omit<UnitOfMeasureInput, "id">, actorUserId: string): Promise<{ id: string; version: number }>;
  setActive(tenantId: string, id: string, active: boolean, actorUserId: string): Promise<{ id: string; isActive: boolean }>;
}

export interface UnitDefinitionContext {
  tenantId: string;
  actorUserId: string;
  permissions: readonly string[];
}

export interface ItemSpecificUnitConversionContract {
  subjectType: "PRODUCT" | "ANIMAL" | "SERVICE";
  subjectId: string;
  fromUnitId: string;
  toUnitId: string;
  factor: string;
  validFrom: string;
  validUntil?: string;
}

export class UnitOfMeasureService {
  constructor(private readonly repository: UnitOfMeasureRepository) {}
  list(context: UnitDefinitionContext, includeInactive = false) {
    requireUnitPermission(context, "definitions.units.read.organization");
    return this.repository.list(context.tenantId, includeInactive);
  }
  create(context: UnitDefinitionContext, input: UnitOfMeasureInput) {
    requireUnitPermission(context, "definitions.units.create.organization");
    return this.repository.create(context.tenantId, normalizeInput(input), context.actorUserId);
  }
  update(context: UnitDefinitionContext, id: string, input: Omit<UnitOfMeasureInput, "id">) {
    requireUnitPermission(context, "definitions.units.update.organization");
    return this.repository.update(context.tenantId, id, normalizeInput({ ...input, id }), context.actorUserId);
  }
  setActive(context: UnitDefinitionContext, id: string, active: boolean) {
    requireUnitPermission(context, active ? "definitions.units.activate.organization" : "definitions.units.deactivate.organization");
    return this.repository.setActive(context.tenantId, id, active, context.actorUserId);
  }
}

export function convertGeneralMeasurement(value: string, fromCode: string, toCode: string): string {
  const from = GENERAL_CONVERSION_UNITS[normalizeCode(fromCode)];
  const to = GENERAL_CONVERSION_UNITS[normalizeCode(toCode)];
  if (!from || !to || from.dimension !== to.dimension) throw new Error("UNIT_GENERAL_CONVERSION_NOT_SUPPORTED");
  const units = decimalToUnits(value, 6);
  return unitsToDecimal((units * BigInt(from.toBase)) / BigInt(to.toBase), 6);
}

const GENERAL_CONVERSION_UNITS: Readonly<Record<string, { dimension: "WEIGHT" | "VOLUME" | "LENGTH"; toBase: number }>> = {
  KG: { dimension: "WEIGHT", toBase: 1000 }, GR: { dimension: "WEIGHT", toBase: 1 },
  LT: { dimension: "VOLUME", toBase: 1000 }, ML: { dimension: "VOLUME", toBase: 1 },
  METRE: { dimension: "LENGTH", toBase: 100 }, CM: { dimension: "LENGTH", toBase: 1 },
};

function normalizeInput(input: UnitOfMeasureInput): UnitOfMeasureInput {
  const code = normalizeCode(input.code);
  const name = input.name.trim();
  const symbol = input.symbol.trim();
  if (!name || name.length > 80 || !symbol || symbol.length > 20) throw new Error("UNIT_DEFINITION_TEXT_INVALID");
  if (!Number.isInteger(input.decimalPrecision) || input.decimalPrecision < 0 || input.decimalPrecision > 6) throw new Error("UNIT_DECIMAL_PRECISION_INVALID");
  if (!input.allowsFraction && input.decimalPrecision !== 0) throw new Error("UNIT_FRACTION_PRECISION_CONFLICT");
  return { ...input, code, name, symbol, sortOrder: input.sortOrder ?? 0 };
}

function normalizeCode(value: string): string {
  const code = value.trim().toLocaleUpperCase("tr-TR");
  if (!/^[A-ZÇĞİÖŞÜ0-9._-]{1,24}$/.test(code)) throw new Error("UNIT_CODE_INVALID");
  return code;
}

function requireUnitPermission(context: UnitDefinitionContext, permission: string) {
  if (!context.permissions.includes(permission)) throw new Error("UNIT_PERMISSION_DENIED");
}

function decimalToUnits(value: string, scale: number): bigint {
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) throw new Error("UNIT_CONVERSION_VALUE_INVALID");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(10) ** BigInt(scale) + BigInt(fraction.padEnd(scale, "0"));
}

function unitsToDecimal(value: bigint, scale: number): string {
  const base = BigInt(10) ** BigInt(scale);
  const fraction = (value % base).toString().padStart(scale, "0").replace(/0+$/, "");
  return fraction ? `${value / base}.${fraction}` : (value / base).toString();
}
