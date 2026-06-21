import type { RedmineIssue } from "./types";

// Pure formatting helpers (no DB / no I/O) — safe to unit-test in isolation.

export function taskNameForIssue(issue: RedmineIssue): string {
  return `#${issue.id} ${issue.subject}`.slice(0, 200);
}

// Embed the local entry id so a Redmine time entry can be reconciled back to ours
// (dedup marker for the rare crash-between-POST-and-write case). H2.
export function pushComment(note: string | null, entryId: string): string {
  const base = note?.trim() ? note.trim() : "9stimesheet";
  return `${base} [9stimesheet#${entryId}]`.slice(0, 255);
}
