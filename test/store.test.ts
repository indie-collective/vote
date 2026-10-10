import { describe, expect, it } from "vitest";
import { castVote, getStatus, setRevealed, setVotingOpen, tally } from "../src/lib/store";
import { fakeD1 } from "./d1";

const vote = (ballotId: string, gameIds: string[]) => ({
  edition: "2026",
  category: "competition",
  gameIds,
  ballotId,
});

async function openEdition() {
  const { db, sqlite } = fakeD1();
  await setVotingOpen(db, "2026", true);
  return { db, sqlite };
}

describe("casting Votes", () => {
  it("stores a Vote with all its Picks", async () => {
    const { db } = await openEdition();
    expect(await castVote(db, vote("b1", ["a", "b", "c"]))).toBe("accepted");
    expect(await castVote(db, vote("b2", ["a"]))).toBe("accepted");
    expect(await tally(db, "2026", "competition")).toEqual({ voters: 2, picks: { a: 2, b: 1, c: 1 } });
  });

  it("allows one Vote per Ballot", async () => {
    const { db } = await openEdition();
    await castVote(db, vote("b1", ["a"]));
    expect(await castVote(db, vote("b1", ["b", "c"]))).toBe("ballot-used");
    expect(await tally(db, "2026", "competition")).toEqual({ voters: 1, picks: { a: 1 } });
  });

  it("stores nothing while voting is closed", async () => {
    const { db } = await openEdition();
    await setVotingOpen(db, "2026", false);
    expect(await castVote(db, vote("b1", ["a", "b"]))).toBe("closed");
    expect(await tally(db, "2026", "competition")).toEqual({ voters: 0, picks: {} });
  });

  it("counts only the requested Edition and Category", async () => {
    const { db } = await openEdition();
    await setVotingOpen(db, "2027", true);
    await castVote(db, vote("b1", ["a"]));
    await castVote(db, { ...vote("b2", ["a"]), edition: "2027" });
    expect(await tally(db, "2026", "competition")).toEqual({ voters: 1, picks: { a: 1 } });
  });
});

describe("Voting Status and Reveal", () => {
  it("only allows a Reveal while voting is closed, and reopening hides Results", async () => {
    const { db } = await openEdition();
    expect(await setRevealed(db, "2026", true)).toBe(false);
    await setVotingOpen(db, "2026", false);
    expect(await setRevealed(db, "2026", true)).toBe(true);
    await setVotingOpen(db, "2026", true);
    expect(await getStatus(db, "2026")).toEqual({ votingOpen: true, revealed: false });
  });
});

describe("migration to Picks", () => {
  it("turns existing single-game Votes into Votes with one Pick", async () => {
    const { db, sqlite } = fakeD1({ migrations: ["0001_init.sql"] });
    sqlite.exec(`INSERT INTO votes (id, edition, category, game_id, ballot_id)
                 VALUES ('v1', '2025', 'competition', 'appulse', 'b1'),
                        ('v2', '2025', 'competition', 'appulse', 'b2')`);
    sqlite.exec((await import("node:fs")).readFileSync("migrations/0002_picks.sql", "utf8"));
    expect(await tally(db, "2025", "competition")).toEqual({ voters: 2, picks: { appulse: 2 } });
  });
});
