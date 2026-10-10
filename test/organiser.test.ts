import { describe, expect, it } from "vitest";
import { createSession, isOrganiser, ORGANISER_SESSION_MS, secretMatches } from "../src/lib/organiser";

describe("organiser login", () => {
  it("accepts only the exact secret, and never an empty one", async () => {
    expect(await secretMatches("hunter2", "hunter2")).toBe(true);
    expect(await secretMatches("hunter3", "hunter2")).toBe(false);
    expect(await secretMatches("", "")).toBe(false);
  });

  it("keeps organisers logged in for the session length", async () => {
    const now = Date.now();
    const session = await createSession("k", now);
    expect(await isOrganiser(session, "k", now + ORGANISER_SESSION_MS - 1)).toBe(true);
    expect(await isOrganiser(session, "k", now + ORGANISER_SESSION_MS)).toBe(false);
    expect(await isOrganiser(session, "other", now)).toBe(false);
  });
});
