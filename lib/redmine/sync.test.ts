import { describe, it, expect } from "vitest";
import { taskNameForIssue } from "./format";
import type { RedmineIssue } from "./types";

const issue = (over: Partial<RedmineIssue> = {}): RedmineIssue => ({
  id: 42,
  subject: "Fix login",
  project: { id: 1, name: "P" },
  status: { id: 1, name: "New" },
  updated_on: "2026-01-01T00:00:00Z",
  ...over,
});

describe("redmine sync mapping", () => {
  it("formats the task name as '#id subject'", () => {
    expect(taskNameForIssue(issue())).toBe("#42 Fix login");
  });

  it("truncates very long subjects to 200 chars", () => {
    expect(taskNameForIssue(issue({ subject: "x".repeat(500) })).length).toBe(200);
  });
});
