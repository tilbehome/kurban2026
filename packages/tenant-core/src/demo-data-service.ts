import { randomUUID } from "node:crypto";

export type DemoScenario = "minimal" | "full-qurban-day" | "finance-reconciliation";

export interface SyntheticDemoBundle {
  id: string;
  scenario: DemoScenario;
  generatedAt: string;
  mode: "dry-run";
  records: {
    business: { displayName: string; facility: string; season: string };
    customers: Array<{ id: string; displayName: string; phone: string }>;
    animals: Array<{ id: string; earTag: string; shares: number; status: string }>;
    sales: Array<{ id: string; payerCustomerId: string; shareholderCustomerId: string; amount: string; deposit: string }>;
    operations: Array<{ kind: string; status: string; evidence: string }>;
  };
  guard: { productionWriteBlocked: true; realTenantWriteAllowed: false; reason: string };
}

export class DemoDataService {
  createSyntheticBundle(input: { scenario: DemoScenario; environmentName?: string; allowProduction?: boolean }): SyntheticDemoBundle {
    const environmentName = input.environmentName ?? process.env.NODE_ENV ?? "unknown";
    if (isProductionLike(environmentName) && !input.allowProduction) throw new DemoDataError("DEMO_DATA_PRODUCTION_FORBIDDEN");
    const id = `demo_${randomUUID()}`;
    return {
      id,
      scenario: input.scenario,
      generatedAt: new Date().toISOString(),
      mode: "dry-run",
      records: {
        business: { displayName: "Sentetik Kurban İşletmesi", facility: "Sentetik Tesis A", season: "Sentetik 2026" },
        customers: [
          { id: `${id}_customer_1`, displayName: "Sentetik Müşteri Bir", phone: "+905550000001" },
          { id: `${id}_customer_2`, displayName: "Sentetik Müşteri İki", phone: "+905550000002" },
        ],
        animals: [
          { id: `${id}_animal_1`, earTag: `SYN-${Date.now()}`, shares: 7, status: "ready_for_sale" },
        ],
        sales: input.scenario === "minimal" ? [] : [
          { id: `${id}_sale_1`, payerCustomerId: `${id}_customer_1`, shareholderCustomerId: `${id}_customer_2`, amount: "44000.0000", deposit: "5000.0000" },
        ],
        operations: input.scenario === "full-qurban-day" ? [
          { kind: "proxy", status: "signed", evidence: "synthetic-note" },
          { kind: "slaughter", status: "ready_for_delivery", evidence: "synthetic-station" },
          { kind: "delivery", status: "pending", evidence: "synthetic-loading-list" },
        ] : [],
      },
      guard: {
        productionWriteBlocked: true,
        realTenantWriteAllowed: false,
        reason: "Demo merkezi yalnız sentetik dry-run paketi üretir; gerçek tenant veritabanına yazmaz.",
      },
    };
  }
}

export class DemoDataError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "DemoDataError";
  }
}

function isProductionLike(value: string): boolean {
  return /prod|production|canli|live/i.test(value);
}
