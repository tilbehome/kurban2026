export interface InvoiceUnitSnapshot {
  unitId: string;
  unitCodeSnapshot: string;
  unitNameSnapshot: string;
  unitSymbolSnapshot: string;
}

export interface ProviderUnitMappingPort {
  find(input: { tenantId: string; providerKey: string; mappingVersion: string; unitId: string }): Promise<{ providerUnitCode: string } | null>;
}

export class ProviderUnitMappingService {
  constructor(private readonly mappings: ProviderUnitMappingPort) {}

  async resolve(input: { tenantId: string; providerKey: string; mappingVersion: string; units: readonly InvoiceUnitSnapshot[] }): Promise<ReadonlyMap<string, string>> {
    if (!input.mappingVersion.trim()) throw new Error("E_DOCUMENT_UNIT_MAPPING_VERSION_REQUIRED");
    const result = new Map<string, string>();
    for (const unit of input.units) {
      if (result.has(unit.unitId)) continue;
      const mapping = await this.mappings.find({ tenantId: input.tenantId, providerKey: input.providerKey, mappingVersion: input.mappingVersion, unitId: unit.unitId });
      if (!mapping?.providerUnitCode.trim()) throw new Error(`E_DOCUMENT_UNIT_MAPPING_REQUIRED:${unit.unitCodeSnapshot}`);
      result.set(unit.unitId, mapping.providerUnitCode);
    }
    return result;
  }
}
