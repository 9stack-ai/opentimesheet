import { prisma } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { createRedmineClient, type RedmineClient } from "./client";

/** A Redmine client bound to the user's stored key, or null if not connected. */
export async function getRedmineClientForUser(userId: string): Promise<RedmineClient | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { redmineApiKeyEnc: true },
  });
  if (!u?.redmineApiKeyEnc) return null;
  return createRedmineClient(decryptSecret(u.redmineApiKeyEnc));
}

/** Validate the key against the shared instance, then store it encrypted. Throws RedmineError on bad key. */
export async function connectRedmineForUser(userId: string, apiKey: string): Promise<{ login: string }> {
  const me = await createRedmineClient(apiKey).currentUser();
  await prisma.user.update({
    where: { id: userId },
    data: {
      redmineApiKeyEnc: encryptSecret(apiKey),
      redmineUserId: me.id,
      redmineConnectedAt: new Date(),
    },
  });
  return { login: me.login };
}

export async function disconnectRedmineForUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { redmineApiKeyEnc: null, redmineUserId: null, redmineConnectedAt: null },
  });
}
