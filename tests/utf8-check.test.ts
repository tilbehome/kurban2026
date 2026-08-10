import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("UTF-8/mojibake kontrolu", () => {
  it("kaynak agacinda bilinen bozuk karakter desenleri bulunmaz", () => {
    const cikti = execFileSync(process.execPath, ["scripts/check-utf8.mjs"], {
      encoding: "utf8",
    });

    expect(cikti).toContain("UTF-8/mojibake kontrolü temiz.");
  });

  it("gecersiz UTF-8 byte dizisini yakalar", () => {
    const script = resolve("scripts/check-utf8.mjs");
    const temp = mkdtempSync(resolve(tmpdir(), "tilbe-utf8-"));

    try {
      writeFileSync(resolve(temp, "bozuk.ts"), Buffer.from([0xff, 0xfe, 0xfd]));

      expect(() =>
        execFileSync(process.execPath, [script], {
          cwd: temp,
          encoding: "utf8",
          stdio: "pipe",
        }),
      ).toThrow();
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
