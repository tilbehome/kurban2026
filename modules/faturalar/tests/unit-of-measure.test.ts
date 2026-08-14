import { describe, expect, test } from "vitest";
import { UnitOfMeasureService, convertGeneralMeasurement, type UnitOfMeasureRecord, type UnitOfMeasureRepository } from "@tilbecore/tenant-core";
import { ProviderUnitMappingService } from "../domain/provider-unit-mapping";

describe("tenant-aware ölçü ve işlem birimleri", () => {
  test("genel fiziksel dönüşümler desteklenir; paket/ürün dönüşümü genelleştirilmez", () => {
    expect(convertGeneralMeasurement("1.5", "KG", "GR")).toBe("1500");
    expect(convertGeneralMeasurement("750", "ML", "LT")).toBe("0.75");
    expect(convertGeneralMeasurement("2", "METRE", "CM")).toBe("200");
    expect(() => convertGeneralMeasurement("1", "KOLİ", "ADET")).toThrowError("UNIT_GENERAL_CONVERSION_NOT_SUPPORTED");
  });

  test("firma birimi normalize edilir ve tenant context repository'ye taşınır", async () => {
    const created: Array<{ tenantId: string; code: string }> = [];
    const repository: UnitOfMeasureRepository = { list: async () => [], create: async (tenantId, input) => { created.push({ tenantId, code: input.code }); return { id: input.id }; }, update: async (_tenantId, id) => ({ id, version: 2 }), setActive: async (_tenantId, id, active) => ({ id, isActive: active }) };
    const service = new UnitOfMeasureService(repository);
    await service.create({ tenantId: "org-a", actorUserId: "actor-a", permissions: ["definitions.units.create.organization"] }, { id: "unit-a", code: "çuval", name: "Çuval", symbol: "çuval", category: "PACKAGE", decimalPrecision: 0, allowsFraction: false });
    expect(created).toEqual([{ tenantId: "org-a", code: "ÇUVAL" }]);
  });

  test("provider mapping resmî kod varsaymaz ve eksikte fail-closed kalır", async () => {
    const unit: UnitOfMeasureRecord = { id: "unit-a", tenantId: "org-a", code: "ÇUVAL", name: "Çuval", symbol: "çuval", category: "PACKAGE", decimalPrecision: 0, allowsFraction: false, isSystem: false, isActive: true, sortOrder: 0, version: 1, usageCount: 0 };
    const service = new ProviderUnitMappingService({ find: async () => null });
    await expect(service.resolve({ tenantId: "org-a", providerKey: "unconfigured-provider", mappingVersion: "guide-unverified", units: [{ unitId: unit.id, unitCodeSnapshot: unit.code, unitNameSnapshot: unit.name, unitSymbolSnapshot: unit.symbol }] })).rejects.toThrowError("E_DOCUMENT_UNIT_MAPPING_REQUIRED:ÇUVAL");
  });
});
