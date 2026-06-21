import { describe, it, expect } from "vitest";
import { pushComment } from "./format";

describe("redmine push comment marker", () => {
  it("embeds the local entry id for reconciliation", () => {
    expect(pushComment("Worked on login", "abc123")).toBe("Worked on login [9stimesheet#abc123]");
  });

  it("falls back to a default base when the note is empty", () => {
    expect(pushComment(null, "e1")).toBe("9stimesheet [9stimesheet#e1]");
    expect(pushComment("   ", "e1")).toBe("9stimesheet [9stimesheet#e1]");
  });

  it("caps length at 255 chars", () => {
    expect(pushComment("x".repeat(400), "e1").length).toBe(255);
  });
});
