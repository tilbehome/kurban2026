import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Vitest yapilandirmasi.
 * - Node ortami: salt utility/business logic icin yeterli (DOM gerekirse happy-dom acilir)
 * - Yol takmasi: tsconfig.json "@/*" -> proje koku
 * - Test desenleri: shared/lib, modules/.../api, modules/.../lib altinda *.test.ts
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: [
      "shared/**/*.test.ts",
      "modules/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    exclude: ["node_modules", ".next", "dist"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "shared/lib/**/*.ts",
        "modules/**/api/**/*.ts",
        "modules/**/lib/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/types.ts",
        "shared/lib/prisma.ts",
        "shared/lib/session.ts",
      ],
    },
  },
});
