import { describe, expect, it } from "vitest";
import { podium, rankGames } from "../src/lib/results";

const game = (id: string) => ({ id, title: id, studio: "" });

describe("rankGames", () => {
  it("orders by votes and gives tied Games the same rank", () => {
    const ranked = rankGames([game("a"), game("b"), game("c"), game("d")], { a: 3, b: 5, c: 3 });
    expect(ranked.map(({ id, votes, rank }) => [id, votes, rank])).toEqual([
      ["b", 5, 1],
      ["a", 3, 2],
      ["c", 3, 2],
      ["d", 0, 4],
    ]);
  });
});

describe("podium", () => {
  const steps = (counts: Record<string, number>) =>
    podium(rankGames(Object.keys(counts).map(game), counts)).map((step) => [
      step.rank,
      step.games.map((g) => g.id),
    ]);

  it("has one step per rank 1–3", () => {
    expect(steps({ a: 5, b: 4, c: 3, d: 2 })).toEqual([[1, ["a"]], [2, ["b"]], [3, ["c"]]]);
  });

  it("puts tied Games on one step and skips ranks the tie used up", () => {
    expect(steps({ a: 5, b: 4, c: 4, d: 2 })).toEqual([[1, ["a"]], [2, ["b", "c"]]]);
    expect(steps({ a: 5, b: 5, c: 3, d: 2 })).toEqual([[1, ["a", "b"]], [3, ["c"]]]);
  });

  it("leaves out Games nobody picked", () => {
    expect(steps({ a: 2, b: 0, c: 0 })).toEqual([[1, ["a"]]]);
  });
});
