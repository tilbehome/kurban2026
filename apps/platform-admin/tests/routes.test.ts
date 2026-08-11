import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const pages = [
  "app/page.tsx", "app/login/page.tsx", "app/organizations/page.tsx", "app/organizations/[id]/page.tsx",
  "app/provisioning/page.tsx", "app/provisioning/new/page.tsx", "app/plans/page.tsx", "app/domains/page.tsx",
  "app/backups/page.tsx", "app/support/page.tsx", "app/users/page.tsx", "app/audit/page.tsx", "app/unauthorized/page.tsx",
  "app/loading.tsx", "app/error.tsx",
] as const;
const mutationRoutes = [
  "app/api/commands/route.ts", "app/api/provisioning/route.ts", "app/api/domains/route.ts",
  "app/api/licenses/schedule/route.ts", "app/api/organizations/[id]/lifecycle/route.ts",
  "app/api/support/route.ts", "app/api/support/[id]/revoke/route.ts",
  "app/api/users/[id]/status/route.ts", "app/api/users/[id]/roles/route.ts",
] as const;

describe("Platform Admin temel sayfa ve route envanteri", () => {
  it("belgelenen tüm gerçek sayfalar kaynak kodda bulunur ve placeholder içermez", () => {
    for (const page of pages) {
      expect(existsSync(join(root, page)), page).toBe(true);
      expect(readFileSync(join(root, page), "utf8")).not.toMatch(/yakında|PLACEHOLDER_PAGE|TODO\b/i);
    }
  });

  it("kritik mutation route'ları host/origin ve application yetki kapısından geçer", () => {
    for (const route of mutationRoutes) {
      const source = readFileSync(join(root, route), "utf8");
      expect(source, route).toContain("assertTrustedMutationRequest");
      expect(source, route).toContain("requirePlatformActor");
      expect(source, route).not.toContain("@tilbecore/database-platform");
      expect(source, route).not.toMatch(/PrismaClient|\$queryRaw|\$executeRaw/);
    }
  });
});
