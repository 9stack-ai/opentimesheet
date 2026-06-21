import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption for secrets stored at rest (per-user Redmine API keys).
// Key comes from REDMINE_ENC_KEY (base64-encoded 32 bytes). Validated LAZILY (on first
// encrypt/decrypt) so an absent key never blocks app boot for users with no Redmine
// connection. Blob format: "v1:" + base64( iv(12) | authTag(16) | ciphertext ).
const PREFIX = "v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.REDMINE_ENC_KEY;
  if (!raw) {
    throw new Error("REDMINE_ENC_KEY is not set (required for Redmine secret encryption).");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("REDMINE_ENC_KEY must decode to 32 bytes (generate: openssl rand -base64 32).");
  }
  cachedKey = key;
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(blob: string): string {
  const key = getKey();
  if (!blob.startsWith(PREFIX)) {
    throw new Error("Unrecognized secret format.");
  }
  const data = Buffer.from(blob.slice(PREFIX.length), "base64");
  const iv = data.subarray(0, IV_LEN);
  const authTag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = data.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Test-only: clear the cached key so tests can swap REDMINE_ENC_KEY. */
export function __resetKeyCacheForTests(): void {
  cachedKey = null;
}
