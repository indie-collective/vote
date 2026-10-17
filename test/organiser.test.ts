import { describe, expect, it } from "vitest";
import { createSession, isOrganiser, loginUrl, ORGANISER_SESSION_MS, safeNext, secretMatches } from "../src/lib/organiser";

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

describe("login redirects", () => {
  it("returns to the requested page with its query string", () => {
    const url = loginUrl(new URL("https://vote.indieco.xyz/admin/race-3d?demo&seconds=60"));
    expect(url).toBe("/login?next=%2Fadmin%2Frace-3d%3Fdemo%26seconds%3D60");
    expect(safeNext(new URL(url, "https://vote.indieco.xyz").searchParams.get("next"))).toBe(
      "/admin/race-3d?demo&seconds=60"
    );
  });

  it("only follows paths on this site", () => {
    for (const next of [null, "", "admin", "https://evil.example", "//evil.example", "/\\evil.example"]) {
      expect(safeNext(next)).toBe("/admin");
    }
    expect(safeNext("/host")).toBe("/host");
  });
});
