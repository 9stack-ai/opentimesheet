import { describe, it, expect } from "vitest";
import { resolveTargetUserId, canModifyEntry } from "./timesheet-access";

describe("resolveTargetUserId", () => {
  const admin = { id: "admin-1", role: "ADMIN" as const };
  const freelancer = { id: "free-1", role: "FREELANCER" as const };

  it("lets ADMIN act on behalf of another user", () => {
    expect(resolveTargetUserId(admin, "victim-2")).toBe("victim-2");
  });

  it("falls back to self when ADMIN supplies no target", () => {
    expect(resolveTargetUserId(admin, "")).toBe("admin-1");
    expect(resolveTargetUserId(admin, null)).toBe("admin-1");
    expect(resolveTargetUserId(admin, undefined)).toBe("admin-1");
  });

  it("ignores a forged targetUserId from a non-admin (operates on self)", () => {
    expect(resolveTargetUserId(freelancer, "victim-2")).toBe("free-1");
  });

  it("ignores forged target for MANAGER and EMPLOYEE too", () => {
    expect(resolveTargetUserId({ id: "m", role: "MANAGER" }, "x")).toBe("m");
    expect(resolveTargetUserId({ id: "e", role: "EMPLOYEE" }, "x")).toBe("e");
  });
});

describe("canModifyEntry", () => {
  it("ADMIN may modify any entry in any status", () => {
    for (const status of ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]) {
      expect(canModifyEntry("ADMIN", false, status)).toBe(true);
      expect(canModifyEntry("ADMIN", true, status)).toBe(true);
    }
  });

  it("owner may modify only their own DRAFT/REJECTED entry", () => {
    expect(canModifyEntry("FREELANCER", true, "DRAFT")).toBe(true);
    expect(canModifyEntry("FREELANCER", true, "REJECTED")).toBe(true);
    expect(canModifyEntry("FREELANCER", true, "SUBMITTED")).toBe(false);
    expect(canModifyEntry("FREELANCER", true, "APPROVED")).toBe(false);
  });

  it("non-admin may never modify another user's entry", () => {
    expect(canModifyEntry("FREELANCER", false, "DRAFT")).toBe(false);
    expect(canModifyEntry("MANAGER", false, "DRAFT")).toBe(false);
    expect(canModifyEntry("EMPLOYEE", false, "REJECTED")).toBe(false);
  });
});
