export interface SimulationScenario {
  key: string;
  title: string;
  required: boolean;
  status: "planned" | "ready" | "executed" | "failed";
}

export interface GoLiveReadinessChecklist {
  scenarios: readonly SimulationScenario[];
  placeholderAuditCompleted: boolean;
  demoDataCleanupCompleted: boolean;
  emergencyRunbookPublished: boolean;
}

export function assertKurbanDaySimulationGate(checklist: GoLiveReadinessChecklist): void {
  const missingScenario = checklist.scenarios.find((scenario) => scenario.required && scenario.status !== "executed");
  if (missingScenario) throw new Error(`SIMULATION_SCENARIO_NOT_EXECUTED:${missingScenario.key}`);
  if (!checklist.placeholderAuditCompleted) throw new Error("PLACEHOLDER_AUDIT_REQUIRED");
  if (!checklist.demoDataCleanupCompleted) throw new Error("DEMO_DATA_CLEANUP_REQUIRED");
  if (!checklist.emergencyRunbookPublished) throw new Error("EMERGENCY_RUNBOOK_REQUIRED");
}
