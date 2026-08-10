import type { TenantInstanceId } from "@tilbecore/contracts";

export interface ManagementDashboardKpi {
  key: string;
  label: string;
  value: string;
  severity: "normal" | "warning" | "critical";
}

export interface OperationExceptionQueueItem {
  id: string;
  tenantInstanceId: TenantInstanceId;
  category: "sales" | "finance" | "slaughter" | "delivery" | "data_quality" | "security";
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  assignedToUserId?: string;
}

export interface UniversalSearchResult {
  type: "customer" | "phone" | "earTag" | "share" | "qr" | "ledger" | "delivery";
  id: string;
  title: string;
  subtitle?: string;
  tenantInstanceId: TenantInstanceId;
}

export function sortExceptionQueue(
  items: readonly OperationExceptionQueueItem[],
): OperationExceptionQueueItem[] {
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...items].sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.createdAt.localeCompare(b.createdAt));
}
