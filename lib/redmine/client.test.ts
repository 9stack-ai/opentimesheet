import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRedmineClient } from "./client";
import { RedmineError } from "./types";

type MockResult = { status: number; body?: unknown };

function mockFetch(handler: (url: string, init: RequestInit) => MockResult) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const { status, body } = handler(url, init);
      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
        text: async () => (body == null ? "" : JSON.stringify(body)),
      } as Response;
    }),
  );
}

describe("redmine client", () => {
  beforeEach(() => {
    process.env.REDMINE_URL = "https://redmine.example.com";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("currentUser parses the user", async () => {
    mockFetch(() => ({ status: 200, body: { user: { id: 7, login: "alice", firstname: "A", lastname: "B" } } }));
    const me = await createRedmineClient("k").currentUser();
    expect(me).toMatchObject({ id: 7, login: "alice" });
  });

  it("sends the API key header to REDMINE_URL with redirect:manual", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    mockFetch((url, init) => {
      calls.push({ url, init });
      return { status: 200, body: { user: { id: 1, login: "x", firstname: "", lastname: "" } } };
    });
    await createRedmineClient("secret-key").currentUser();
    expect(calls[0].url).toBe("https://redmine.example.com/users/current.json");
    expect((calls[0].init.headers as Record<string, string>)["X-Redmine-API-Key"]).toBe("secret-key");
    expect(calls[0].init.redirect).toBe("manual");
  });

  it("maps 401 -> auth, 403 -> forbidden", async () => {
    mockFetch(() => ({ status: 401 }));
    await expect(createRedmineClient("bad").currentUser()).rejects.toMatchObject({ kind: "auth" });
    mockFetch(() => ({ status: 403 }));
    await expect(createRedmineClient("k").currentUser()).rejects.toMatchObject({ kind: "forbidden" });
  });

  it("maps 422 -> validation with messages", async () => {
    mockFetch(() => ({ status: 422, body: { errors: ["Hours can't be blank"] } }));
    const err = await createRedmineClient("k")
      .createTimeEntry({ issueId: 1, hours: 0, spentOn: "2026-06-21", activityId: 9 })
      .catch((e) => e);
    expect(err).toBeInstanceOf(RedmineError);
    expect(err.kind).toBe("validation");
    expect(err.messages).toContain("Hours can't be blank");
  });

  it("rejects an unexpected 3xx redirect (SSRF guard)", async () => {
    mockFetch(() => ({ status: 302 }));
    await expect(createRedmineClient("k").currentUser()).rejects.toMatchObject({ kind: "http" });
  });

  it("paginates assigned issues across pages", async () => {
    let call = 0;
    const issue = (id: number) => ({
      id,
      subject: "s",
      project: { id: 1, name: "p" },
      status: { id: 1, name: "New" },
      updated_on: "2026-01-01T00:00:00Z",
    });
    mockFetch(() => {
      call++;
      const count = call === 1 ? 100 : 50;
      const start = call === 1 ? 0 : 100;
      return {
        status: 200,
        body: { issues: Array.from({ length: count }, (_, i) => issue(start + i)), total_count: 150 },
      };
    });
    const issues = await createRedmineClient("k").listAssignedIssues({ projectId: 1 });
    expect(issues.length).toBe(150);
  });
});
