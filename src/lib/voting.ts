// Two-step voting (see docs/adr/0001-two-step-qr-and-ballot.md):
// a QR code must be opened while fresh, and opening it grants a Ballot for one Vote.

import { sign, verify } from "./signing";

/** How often the Host Screen shows a new QR code. */
export const QR_REFRESH_MS = 10_000;
/** How long after being shown a QR code can still be opened. */
export const QR_SCAN_WINDOW_MS = 20_000;
/** How long a Ballot stays usable. */
export const BALLOT_TTL_MS = 3 * 60_000;
/** Most Picks a Vote may hold (approval voting, see docs/adr/0003-approval-voting-capped-at-five.md). */
export const MAX_PICKS = 5;

type QrPayload = { kind: "qr"; edition: string; issuedAt: number };

export type Ballot = { kind: "ballot"; id: string; edition: string; expiresAt: number };

export type QrCheck = { ok: true } | { ok: false; reason: "invalid" | "expired" };

export function issueQrToken(edition: string, key: string, now = Date.now()): Promise<string> {
  return sign({ kind: "qr", edition, issuedAt: now } satisfies QrPayload, key);
}

export async function checkQrToken(
  token: string | undefined,
  edition: string,
  key: string,
  now = Date.now()
): Promise<QrCheck> {
  const payload = await verify<QrPayload>(token, key);
  if (!payload || payload.kind !== "qr" || payload.edition !== edition) {
    return { ok: false, reason: "invalid" };
  }
  if (now - payload.issuedAt > QR_SCAN_WINDOW_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}

export async function issueBallot(
  edition: string,
  key: string,
  now = Date.now()
): Promise<{ ballot: Ballot; cookie: string }> {
  const ballot: Ballot = {
    kind: "ballot",
    id: crypto.randomUUID(),
    edition,
    expiresAt: now + BALLOT_TTL_MS,
  };
  return { ballot, cookie: await sign(ballot, key) };
}

/** Returns the Ballot if it is authentic, for this Edition and not expired. */
export async function readBallot(
  cookie: string | undefined,
  edition: string,
  key: string,
  now = Date.now()
): Promise<Ballot | null> {
  const ballot = await verify<Ballot>(cookie, key);
  if (!ballot || ballot.kind !== "ballot" || ballot.edition !== edition) return null;
  return ballot.expiresAt > now ? ballot : null;
}

export type PicksCheck = { ok: true; gameIds: string[] } | { ok: false };

/** Validates submitted Picks: one to MAX_PICKS distinct Games, all from the Competition. */
export function checkPicks(submitted: unknown[], competitionGameIds: string[]): PicksCheck {
  const gameIds = [...new Set(submitted.map(String))];
  const valid =
    gameIds.length >= 1 &&
    gameIds.length <= MAX_PICKS &&
    gameIds.length === submitted.length &&
    gameIds.every((id) => competitionGameIds.includes(id));
  return valid ? { ok: true, gameIds } : { ok: false };
}
