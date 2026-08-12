import { createHash, randomUUID } from "node:crypto";

export type DeviceAdapterKind = "scale" | "label_printer" | "qr_reader";

export interface DeviceAdapterPort<TCommand, TResult> {
  readonly kind: DeviceAdapterKind;
  execute(command: TCommand): Promise<TResult>;
}

export interface ScaleReadCommand {
  expectedKg?: string;
  toleranceKg?: string;
}

export interface ScaleReadResult {
  readingId: string;
  grossWeightKg: string;
  stable: true;
  provider: "simulator";
  physicalAcceptance: "NOT_RUN";
}

export class SimulatorScaleAdapter implements DeviceAdapterPort<ScaleReadCommand, ScaleReadResult> {
  readonly kind = "scale" as const;

  async execute(command: ScaleReadCommand): Promise<ScaleReadResult> {
    return {
      readingId: `scale_reading_${randomUUID()}`,
      grossWeightKg: normalizeKg(command.expectedKg ?? "0.000"),
      stable: true,
      provider: "simulator",
      physicalAcceptance: "NOT_RUN",
    };
  }
}

export interface LabelPrintCommand {
  labelNo: string;
  lines: string[];
  copies?: number;
}

export interface LabelPrintResult {
  printJobId: string;
  labelNo: string;
  copies: number;
  checksum: string;
  provider: "simulator";
  physicalAcceptance: "NOT_RUN";
}

export class SimulatorLabelPrinterAdapter implements DeviceAdapterPort<LabelPrintCommand, LabelPrintResult> {
  readonly kind = "label_printer" as const;

  async execute(command: LabelPrintCommand): Promise<LabelPrintResult> {
    const copies = Math.max(1, Math.min(command.copies ?? 1, 10));
    return {
      printJobId: `print_job_${randomUUID()}`,
      labelNo: command.labelNo,
      copies,
      checksum: createHash("sha256").update(JSON.stringify({ ...command, copies })).digest("hex"),
      provider: "simulator",
      physicalAcceptance: "NOT_RUN",
    };
  }
}

export interface QrScanCommand {
  opaqueToken: string;
  purpose: "proxyDocument" | "slaughterCheck" | "package" | "delivery" | "customerTracking";
}

export interface QrScanResult {
  scanId: string;
  opaqueTokenHash: string;
  purpose: QrScanCommand["purpose"];
  provider: "simulator";
  physicalAcceptance: "NOT_RUN";
}

export class SimulatorQrReaderAdapter implements DeviceAdapterPort<QrScanCommand, QrScanResult> {
  readonly kind = "qr_reader" as const;

  async execute(command: QrScanCommand): Promise<QrScanResult> {
    return {
      scanId: `qr_scan_${randomUUID()}`,
      opaqueTokenHash: createHash("sha256").update(command.opaqueToken).digest("hex"),
      purpose: command.purpose,
      provider: "simulator",
      physicalAcceptance: "NOT_RUN",
    };
  }
}

export function createSimulatorDeviceAdapter(kind: DeviceAdapterKind) {
  if (kind === "scale") return new SimulatorScaleAdapter();
  if (kind === "label_printer") return new SimulatorLabelPrinterAdapter();
  return new SimulatorQrReaderAdapter();
}

function normalizeKg(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return "0.000";
  return parsed.toFixed(3);
}
