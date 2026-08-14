import { randomUUID } from "node:crypto";
import type { UnitOfMeasureInput, UnitOfMeasureRecord, UnitOfMeasureRepository } from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

export class PrismaUnitOfMeasureRepository implements UnitOfMeasureRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(tenantId: string, includeInactive: boolean): Promise<readonly UnitOfMeasureRecord[]> {
    const rows = await this.db.unitOfMeasure.findMany({ where: { tenantId: { in: ["SYSTEM", tenantId] }, isActive: includeInactive ? undefined : true }, include: { _count: { select: { invoiceLines: true } } }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
    return rows.map((row) => ({ id: row.id, tenantId: row.tenantId, code: row.code, name: row.name, symbol: row.symbol, category: row.category as UnitOfMeasureRecord["category"], decimalPrecision: row.decimalPrecision, allowsFraction: row.allowsFraction, isSystem: row.isSystem, isActive: row.isActive, sortOrder: row.sortOrder, version: row.version, usageCount: row._count.invoiceLines }));
  }

  async create(tenantId: string, input: UnitOfMeasureInput, actorUserId: string) {
    return this.db.$transaction(async (tx) => {
      const collision = await tx.unitOfMeasure.findFirst({ where: { tenantId: { in: ["SYSTEM", tenantId] }, code: input.code } });
      if (collision) throw new Error("UNIT_CODE_ALREADY_EXISTS");
      const row = await tx.unitOfMeasure.create({ data: { ...input, tenantId, isSystem: false, createdByUserId: actorUserId, updatedByUserId: actorUserId }, select: { id: true } });
      await evidence(tx, actorUserId, "definitions.unit.created", row.id, { code: input.code, category: input.category });
      return row;
    });
  }

  async update(tenantId: string, id: string, input: Omit<UnitOfMeasureInput, "id">, actorUserId: string) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.unitOfMeasure.findFirst({ where: { id, tenantId, isSystem: false }, include: { _count: { select: { invoiceLines: true } } } });
      if (!current) throw new Error("UNIT_TENANT_RECORD_NOT_FOUND");
      if (current._count.invoiceLines > 0 && (current.code !== input.code || current.name !== input.name || current.symbol !== input.symbol || current.category !== input.category || current.decimalPrecision !== input.decimalPrecision || current.allowsFraction !== input.allowsFraction)) throw new Error("UNIT_IN_USE_IMMUTABLE");
      if (current.code !== input.code && await tx.unitOfMeasure.findFirst({ where: { tenantId: { in: ["SYSTEM", tenantId] }, code: input.code, id: { not: id } } })) throw new Error("UNIT_CODE_ALREADY_EXISTS");
      const row = await tx.unitOfMeasure.update({ where: { id }, data: { ...input, updatedByUserId: actorUserId, version: { increment: 1 } }, select: { id: true, version: true } });
      await evidence(tx, actorUserId, "definitions.unit.updated", row.id, { version: row.version });
      return row;
    });
  }

  async setActive(tenantId: string, id: string, active: boolean, actorUserId: string) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.unitOfMeasure.findFirst({ where: { id, tenantId, isSystem: false } });
      if (!current) throw new Error("UNIT_TENANT_RECORD_NOT_FOUND");
      const row = await tx.unitOfMeasure.update({ where: { id }, data: { isActive: active, updatedByUserId: actorUserId, version: { increment: 1 } }, select: { id: true, isActive: true } });
      await evidence(tx, actorUserId, active ? "definitions.unit.activated" : "definitions.unit.deactivated", row.id, {});
      return row;
    });
  }
}

async function evidence(tx: Prisma.TransactionClient, actorUserId: string, action: string, targetId: string, metadata: Record<string, unknown>) {
  const requestId = `unit_${randomUUID()}`;
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId, action, targetType: "UnitOfMeasure", targetId, requestId, occurredAt: new Date(), metadata: json(metadata) } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload: json({ unitId: targetId, requestId, ...metadata }), status: "pending" } });
}

function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
