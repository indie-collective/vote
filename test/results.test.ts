import { describe, expect, it } from "vitest";
import { rankGames } from "../src/lib/results";

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
