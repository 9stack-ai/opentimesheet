import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Guards the dual-DB setup: prisma/schema.prisma (SQLite dev) and prisma/schema.prod.prisma
// (Postgres) must define the SAME models + fields/attributes. Comments & whitespace are
// ignored; only the datasource provider may differ. (red-team H1)
function normalizeModels(src: string): Record<string, string[]> {
  const models: Record<string, string[]> = {};
  const re = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    models[m[1]] = m[2]
      .split("\n")
      .map((l) => l.replace(/\/\/.*$/, "").trim()) // strip line comments
      .filter(Boolean)
      .map((l) => l.replace(/\s+/g, " ")) // collapse whitespace
      .sort();
  }
  return models;
}

describe("prisma schema parity (dev SQLite vs prod Postgres)", () => {
  const root = process.cwd();
  const dev = normalizeModels(readFileSync(join(root, "prisma/schema.prisma"), "utf8"));
  const prod = normalizeModels(readFileSync(join(root, "prisma/schema.prod.prisma"), "utf8"));

  it("defines the same set of models", () => {
    expect(Object.keys(dev).sort()).toEqual(Object.keys(prod).sort());
  });

  it("defines identical fields/attributes per model", () => {
    for (const name of Object.keys(dev)) {
      expect(prod[name], `model ${name} differs between dev and prod schema`).toEqual(dev[name]);
    }
  });
});
