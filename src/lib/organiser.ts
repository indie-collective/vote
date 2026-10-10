// Organisers share one secret (ORGANISER_SECRET); logging in sets a signed session cookie.

import { sign, verify } from "./signing";

export const ORGANISER_COOKIE = "organiser";
export const ORGANISER_SESSION_MS = 7 * 24 * 60 * 60_000;

type Session = { kind: "organiser"; expiresAt: number };

/** Compares in constant time so the secret can't be guessed character by character. */
export async function secretMatches(attempt: string, secret: string): Promise<boolean> {
  const digest = async (value: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(attempt), digest(secret)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return secret.length > 0 && difference === 0;
}

export function createSession(key: string, now = Date.now()): Promise<string> {
  return sign({ kind: "organiser", expiresAt: now + ORGANISER_SESSION_MS } satisfies Session, key);
}

export async function isOrganiser(cookie: string | undefined, key: string, now = Date.now()) {
  const session = await verify<Session>(cookie, key);
  return session?.kind === "organiser" && session.expiresAt > now;
}
