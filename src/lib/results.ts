import type { Game } from "./edition";

export type RankedGame = Game & { votes: number; rank: number };

/** Orders Games by Votes; tied Games share a rank (1, 1, 3, …). */
export function rankGames(games: Game[], counts: Record<string, number>): RankedGame[] {
  const sorted = games
    .map((game) => ({ ...game, votes: counts[game.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));

  return sorted.map((game) => ({
    ...game,
    rank: sorted.findIndex((other) => other.votes === game.votes) + 1,
  }));
}
