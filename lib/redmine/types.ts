// Shapes returned by the Redmine REST API (subset we use) + a normalized error type.

export type RedmineUser = { id: number; login: string; firstname: string; lastname: string; mail?: string };
export type RedmineProject = { id: number; identifier: string; name: string };
export type RedmineIssue = {
  id: number;
  subject: string;
  project: { id: number; name: string };
  status: { id: number; name: string; is_closed?: boolean };
  tracker?: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  done_ratio?: number;
  updated_on: string;
};
export type RedmineActivity = { id: number; name: string; is_default?: boolean };

export type RedmineErrorKind = "auth" | "forbidden" | "notfound" | "validation" | "network" | "http";

export class RedmineError extends Error {
  kind: RedmineErrorKind;
  status?: number;
  messages: string[];
  constructor(kind: RedmineErrorKind, message: string, status?: number, messages: string[] = []) {
    super(message);
    this.name = "RedmineError";
    this.kind = kind;
    this.status = status;
    this.messages = messages;
  }
}
