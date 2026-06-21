import {
  RedmineError,
  type RedmineActivity,
  type RedmineIssue,
  type RedmineProject,
  type RedmineUser,
} from "./types";

// Server-only Redmine REST client. Single shared instance via REDMINE_URL (admin-set,
// trusted); each call authenticates with the caller's personal API key. `redirect: "manual"`
// blocks redirect-based SSRF. Errors normalized to RedmineError (never carries the key).
const TIMEOUT_MS = 8000;
const PAGE = 100;
const MAX_PAGES = 20;

function redmineBaseUrl(): string {
  const url = process.env.REDMINE_URL;
  if (!url) throw new RedmineError("http", "REDMINE_URL chưa được cấu hình.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new RedmineError("http", "REDMINE_URL không hợp lệ.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new RedmineError("http", "REDMINE_URL phải dùng http(s).");
  }
  return url.replace(/\/+$/, "");
}

async function request<T>(apiKey: string, path: string, method = "GET", body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${redmineBaseUrl()}${path}`, {
      method,
      headers: {
        "X-Redmine-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
      signal: controller.signal,
    });
  } catch {
    throw new RedmineError("network", "Không kết nối được Redmine.");
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 300 && res.status < 400) {
    throw new RedmineError("http", "Redmine trả về chuyển hướng không mong đợi.", res.status);
  }
  if (res.status === 401) throw new RedmineError("auth", "API key không hợp lệ.", 401);
  if (res.status === 403) throw new RedmineError("forbidden", "Không có quyền hoặc REST API chưa bật.", 403);
  if (res.status === 404) throw new RedmineError("notfound", "Không tìm thấy tài nguyên Redmine.", 404);
  if (res.status === 422) {
    let messages: string[] = [];
    try {
      messages = ((await res.json()) as { errors?: string[] }).errors ?? [];
    } catch {
      /* ignore parse error */
    }
    throw new RedmineError("validation", messages.join("; ") || "Dữ liệu không hợp lệ.", 422, messages);
  }
  if (!res.ok) throw new RedmineError("http", `Redmine lỗi HTTP ${res.status}.`, res.status);

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type RedmineClient = ReturnType<typeof createRedmineClient>;

export function createRedmineClient(apiKey: string) {
  return {
    async currentUser(): Promise<RedmineUser> {
      return (await request<{ user: RedmineUser }>(apiKey, "/users/current.json")).user;
    },

    async listProjects(): Promise<RedmineProject[]> {
      const out: RedmineProject[] = [];
      for (let offset = 0, page = 0; page < MAX_PAGES; offset += PAGE, page++) {
        const j = await request<{ projects: RedmineProject[]; total_count?: number }>(
          apiKey,
          `/projects.json?limit=${PAGE}&offset=${offset}`,
        );
        out.push(...j.projects);
        if (j.projects.length < PAGE || (j.total_count != null && out.length >= j.total_count)) break;
      }
      return out;
    },

    async listAssignedIssues(opts: { projectId: number; since?: Date; statusId?: string }): Promise<RedmineIssue[]> {
      const status = opts.statusId ?? "*";
      const since = opts.since ? `&updated_on=%3E%3D${opts.since.toISOString().slice(0, 10)}` : "";
      const out: RedmineIssue[] = [];
      for (let offset = 0, page = 0; page < MAX_PAGES; offset += PAGE, page++) {
        const j = await request<{ issues: RedmineIssue[]; total_count?: number }>(
          apiKey,
          `/issues.json?assigned_to_id=me&project_id=${opts.projectId}&status_id=${status}&limit=${PAGE}&offset=${offset}${since}`,
        );
        out.push(...j.issues);
        if (j.issues.length < PAGE || (j.total_count != null && out.length >= j.total_count)) break;
      }
      return out;
    },

    async listTimeEntryActivities(): Promise<RedmineActivity[]> {
      const j = await request<{ time_entries: RedmineActivity[] }>(
        apiKey,
        "/enumerations/time_entry_activities.json",
      );
      return j.time_entries ?? [];
    },

    async createTimeEntry(input: {
      issueId: number;
      hours: number;
      spentOn: string;
      activityId: number;
      comments?: string;
    }): Promise<{ id: number }> {
      const j = await request<{ time_entry: { id: number } }>(apiKey, "/time_entries.json", "POST", {
        time_entry: {
          issue_id: input.issueId,
          hours: input.hours,
          spent_on: input.spentOn,
          activity_id: input.activityId,
          comments: input.comments,
        },
      });
      return j.time_entry;
    },

    async updateIssue(input: { id: number; statusId?: number; doneRatio?: number; notes?: string }): Promise<void> {
      await request<void>(apiKey, `/issues/${input.id}.json`, "PUT", {
        issue: { status_id: input.statusId, done_ratio: input.doneRatio, notes: input.notes },
      });
    },
  };
}
