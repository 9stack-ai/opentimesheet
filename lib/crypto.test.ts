import { describe, it, expect, beforeEach } from "vitest";
import { encryptSecret, decryptSecret, __resetKeyCacheForTests } from "./crypto";

const KEY = Buffer.alloc(32, 7).toString("base64"); // deterministic 32-byte key

describe("crypto (AES-256-GCM secret store)", () => {
  beforeEach(() => {
    process.env.REDMINE_ENC_KEY = KEY;
    __resetKeyCacheForTests();
  });

  it("roundtrips and does not leak plaintext", () => {
    const secret = "redmine-api-key-abc123";
    const enc = encryptSecret(secret);
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it("uses a random IV (different ciphertext each call)", () => {
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });

  it("rejects tampered ciphertext", () => {
    const enc = encryptSecret("secret");
    const body = Buffer.from(enc.slice(3), "base64");
    body[body.length - 1] ^= 0xff; // flip last ciphertext byte
    expect(() => decryptSecret("v1:" + body.toString("base64"))).toThrow();
  });

  it("rejects an unrecognized format", () => {
    expect(() => decryptSecret("plain-text")).toThrow();
  });

  it("validates the key lazily — throws only on use when absent", () => {
    delete process.env.REDMINE_ENC_KEY;
    __resetKeyCacheForTests();
    expect(() => encryptSecret("x")).toThrow(/REDMINE_ENC_KEY/);
  });

  it("rejects a wrong-length key", () => {
    process.env.REDMINE_ENC_KEY = Buffer.alloc(16, 1).toString("base64");
    __resetKeyCacheForTests();
    expect(() => encryptSecret("x")).toThrow(/32 bytes/);
  });
});
