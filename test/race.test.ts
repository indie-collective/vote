import { describe, expect, it } from "vitest";
import { buildRace, demoVotes } from "../src/lib/race";

describe("buildRace", () => {
  it("accumulates each Game's Picks vote by vote", () => {
    const race = buildRace(
      ["a", "b", "c"],
      [
        { castAt: "2026-10-23T10:00:00Z", gameIds: ["a", "b"] },
        { castAt: "2026-10-23T11:00:00Z", gameIds: ["a"] },
        { castAt: "2026-10-24T10:00:00Z", gameIds: ["b", "a"] },
      ]
    );
    expect(race.votes).toBe(3);
    expect(race.series).toEqual({ a: [0, 1, 2, 3], b: [0, 1, 1, 2], c: [0, 0, 0, 0] });
    expect(race.finish).toBe(3);
    expect(race.castAt).toHaveLength(3);
  });

  it("handles a race with no Votes", () => {
    expect(buildRace(["a"], [])).toEqual({ votes: 0, series: { a: [0] }, castAt: [], finish: 0 });
  });
});

describe("demoVotes", () => {
  const options = { maxPicks: 5, days: ["2026-10-23", "2026-10-24"], count: 200 };

  it("is repeatable, ordered, and respects the Pick rules", () => {
    const votes = demoVotes(["a", "b", "c", "d", "e", "f"], options);
    expect(votes).toEqual(demoVotes(["a", "b", "c", "d", "e", "f"], options));
    expect(votes).toHaveLength(200);
    expect(votes.map((vote) => vote.castAt)).toEqual(votes.map((vote) => vote.castAt).sort());
    for (const vote of votes) {
      expect(vote.gameIds.length).toBeGreaterThanOrEqual(1);
      expect(vote.gameIds.length).toBeLessThanOrEqual(5);
      expect(new Set(vote.gameIds).size).toBe(vote.gameIds.length);
    }
  });
});
