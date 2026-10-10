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

/**
 * The podium: one step per rank from 1 to 3, tied Games sharing a step. With ranks 1, 2, 2, 4
 * the two tied Games complete the top three, so there is no step for rank 3.
 */
export function podium(ranked: RankedGame[]): { rank: number; games: RankedGame[] }[] {
  const ranks = [...new Set(ranked.filter((game) => game.votes > 0 && game.rank <= 3).map((game) => game.rank))];
  return ranks.map((rank) => ({ rank, games: ranked.filter((game) => game.rank === rank) }));
}
