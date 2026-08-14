import type { PrismaClient } from "@/packages/database-tenant/generated/client";
import type { ProviderUnitMappingPort } from "../../domain/provider-unit-mapping";

export class PrismaProviderUnitMappingRepository implements ProviderUnitMappingPort {
  constructor(private readonly db: PrismaClient) {}
  async find(input: { tenantId: string; providerKey: string; mappingVersion: string; unitId: string }) {
    const row = await this.db.unitProviderMapping.findFirst({ where: { tenantId: { in: ["SYSTEM", input.tenantId] }, providerKey: input.providerKey, mappingVersion: input.mappingVersion, unitOfMeasureId: input.unitId, isActive: true }, select: { providerUnitCode: true } });
    return row;
  }
}
