import { describe, expect, it } from "vitest";
import { getCompetition, getEdition } from "../src/lib/edition";

describe("Edition files", () => {
  it("2025 has one Competition with unique Game ids", () => {
    const edition = getEdition("2025");
    const competition = getCompetition(edition);
    expect(competition.id).toBe("competition");
    const ids = edition.categories.flatMap((category) => category.games.map((game) => game.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("rejects unknown Editions", () => {
    expect(() => getEdition("1999")).toThrow(/Unknown edition/);
  });
});
