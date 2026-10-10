import { describe, expect, it } from "vitest";
import {
  BALLOT_TTL_MS,
  checkPicks,
  checkQrToken,
  issueBallot,
  issueQrToken,
  MAX_PICKS,
  QR_SCAN_WINDOW_MS,
  readBallot,
} from "../src/lib/voting";

const KEY = "test-key";
const NOW = Date.UTC(2026, 4, 30, 14, 0, 0);

describe("QR codes", () => {
  it("can be opened while fresh", async () => {
    const token = await issueQrToken("2026", KEY, NOW);
    expect(await checkQrToken(token, "2026", KEY, NOW + QR_SCAN_WINDOW_MS)).toEqual({ ok: true });
  });

  it("expire once the scan window has passed, so shared photos stop working", async () => {
    const token = await issueQrToken("2026", KEY, NOW);
    expect(await checkQrToken(token, "2026", KEY, NOW + QR_SCAN_WINDOW_MS + 1)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("are invalid when tampered with, signed with another key or for another Edition", async () => {
    const token = await issueQrToken("2026", KEY, NOW);
    const [body, signature] = token.split(".");
    const forged = `${btoa(JSON.stringify({ kind: "qr", edition: "2026", issuedAt: NOW + 3_600_000 }))}.${signature}`;

    for (const [candidate, edition, key] of [
      [forged, "2026", KEY],
      [`${body}.x${signature}`, "2026", KEY],
      [token, "2026", "other-key"],
      [token, "2025", KEY],
      ["garbage", "2026", KEY],
      [undefined, "2026", KEY],
    ] as const) {
      expect(await checkQrToken(candidate, edition, key, NOW)).toEqual({ ok: false, reason: "invalid" });
    }
  });

  it("can't be used as a Ballot", async () => {
    const token = await issueQrToken("2026", KEY, NOW);
    expect(await readBallot(token, "2026", KEY, NOW)).toBeNull();
  });
});

describe("Ballots", () => {
  it("are readable until they expire", async () => {
    const { ballot, cookie } = await issueBallot("2026", KEY, NOW);
    expect(await readBallot(cookie, "2026", KEY, NOW + BALLOT_TTL_MS - 1)).toEqual(ballot);
    expect(await readBallot(cookie, "2026", KEY, NOW + BALLOT_TTL_MS)).toBeNull();
  });

  it("each have a unique id", async () => {
    const a = await issueBallot("2026", KEY, NOW);
    const b = await issueBallot("2026", KEY, NOW);
    expect(a.ballot.id).not.toEqual(b.ballot.id);
  });

  it("belong to one Edition", async () => {
    const { cookie } = await issueBallot("2026", KEY, NOW);
    expect(await readBallot(cookie, "2027", KEY, NOW)).toBeNull();
  });
});

describe("Picks", () => {
  const competition = ["a", "b", "c", "d", "e", "f"];

  it("accepts one to five distinct Competition Games", () => {
    expect(checkPicks(["a"], competition)).toEqual({ ok: true, gameIds: ["a"] });
    expect(checkPicks(["a", "b", "c", "d", "e"], competition)).toEqual({
      ok: true,
      gameIds: ["a", "b", "c", "d", "e"],
    });
  });

  it("rejects no Picks, more than five, duplicates or Games outside the Competition", () => {
    expect(MAX_PICKS).toBe(5);
    for (const submitted of [[], ["a", "b", "c", "d", "e", "f"], ["a", "a"], ["a", "zzz"]]) {
      expect(checkPicks(submitted, competition)).toEqual({ ok: false });
    }
  });
});
