import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { gameImage, getCompetition, getEdition } from "../src/lib/edition";

const editionIds = readdirSync("src/data/editions").map((file) => file.replace(/\.json$/, ""));

describe.each(editionIds)("Edition %s", (id) => {
  const edition = getEdition(id);

  it("has exactly one Competition", () => {
    expect(getCompetition(edition).games.length).toBeGreaterThan(0);
  });

  it("has unique kebab-case Game ids", () => {
    const ids = edition.categories.flatMap((category) => category.games.map((game) => game.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const gameId of ids) expect(gameId).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("has an image for every Game", () => {
    const missing = edition.categories
      .flatMap((category) => category.games)
      .filter((game) => !existsSync(`public${gameImage(edition, game)}`))
      .map((game) => game.id);
    expect(missing).toEqual([]);
  });
});

it("rejects unknown Editions", () => {
  expect(() => getEdition("1999")).toThrow(/Unknown edition/);
});
