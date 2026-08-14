import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantManagementAnalyticsService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { TenantManagementAnalyticsError } from "@/packages/tenant-core/src";
import type { HataKodu } from "@/shared/lib/hata-katalogu";

const Query = z.object({
  reportKey: z.enum(["sales-occupancy", "operations-bottleneck", "delivery-cold-storage", "audit-exceptions", "finance-reconciliation", "customer-season-balances", "supplier-purchases", "animal-cost-health"]),
  format: z.enum(["csv", "xlsx", "pdf"]),
  seasonId: z.string().min(3).optional(),
  facilityId: z.string().min(1).optional(),
  operationalPeriodId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const session = await aktifOturum();
  if (!session) return apiHataYaniti("AUTH_REQUIRED");
  if (masterDataMode() !== "postgres") return apiHataYaniti("TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED");

  let query: z.infer<typeof Query>;
  try {
    query = Query.parse(Object.fromEntries(new URL(request.url).searchParams));
  } catch (error) {
    if (error instanceof z.ZodError) return zodHataYaniti(error);
    return apiHataYaniti("VALIDATION_INVALID");
  }

  try {
    const filters = {
      seasonId: query.seasonId,
      facilityId: query.facilityId,
      operationalPeriodId: query.operationalPeriodId,
    };
    const context = tenantUseCaseContext(session, { request, payload: query, readOnly: true });
    const report = await tenantManagementAnalyticsService().exportReport(context, { reportKey: query.reportKey, filters, format: query.format });
    const basename = `tilbecore-${query.reportKey}-${new Date().toISOString().slice(0, 10)}`;

    if (query.format === "csv") {
      return download(csv(report.rows), "text/csv; charset=utf-8", `${basename}.csv`);
    }
    if (query.format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(report.rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
      return download(toBody(buffer), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `${basename}.xlsx`);
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.text(`TilbeCore Rapor: ${query.reportKey}`, 40, 40);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const headers = columns(report.rows);
    let y = 70;
    pdf.text(headers.join(" | ").slice(0, 110), 40, y);
    y += 18;
    for (const row of report.rows.slice(0, 60)) {
      if (y > 780) {
        pdf.addPage();
        y = 40;
      }
      pdf.text(headers.map((key) => String(row[key] ?? "")).join(" | ").slice(0, 125), 40, y);
      y += 14;
    }
    return download(pdf.output("arraybuffer"), "application/pdf", `${basename}.pdf`);
  } catch (error) {
    if (error instanceof TenantManagementAnalyticsError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_MANAGEMENT_ANALYTICS_FAILED", "Rapor dışa aktarma tamamlanamadı");
  }
}

function download(body: BodyInit, contentType: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function columns(rows: Array<Record<string, string | number | null>>): string[] {
  return Array.from(rows.reduce((set, row) => {
    for (const key of Object.keys(row)) set.add(key);
    return set;
  }, new Set<string>()));
}

function csv(rows: Array<Record<string, string | number | null>>): string {
  const headers = columns(rows);
  return "\uFEFF" + [headers, ...rows.map((row) => headers.map((key) => row[key] ?? ""))]
    .map((line) => line.map((cell) => csvCell(cell)).join(","))
    .join("\r\n");
}

function csvCell(value: string | number | null): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function toBody(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}
