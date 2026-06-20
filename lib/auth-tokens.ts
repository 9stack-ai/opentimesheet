import crypto from "node:crypto";
import bcrypt from "bcryptjs";

// Split-token pattern: link = `selector.verifier`.
// selector is stored plaintext (indexed lookup); verifier is stored only as a bcrypt hash.

export function createInviteToken() {
  const selector = crypto.randomBytes(8).toString("hex");
  const verifier = crypto.randomBytes(24).toString("hex");
  return { selector, verifier, linkToken: `${selector}.${verifier}` };
}

export function hashVerifier(verifier: string): Promise<string> {
  return bcrypt.hash(verifier, 10);
}

export function verifyVerifier(verifier: string, hash: string): Promise<boolean> {
  return bcrypt.compare(verifier, hash);
}

export function parseLinkToken(linkToken: string): { selector: string; verifier: string } | null {
  const [selector, verifier] = linkToken.split(".");
  if (!selector || !verifier) return null;
  return { selector, verifier };
}
