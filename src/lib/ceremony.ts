// Data shared by the ceremony race pages (2D and 3D): the replayed Votes, lane order and podium.

import type { Category, Edition, Game } from "./edition";
import { buildRace, demoVotes, type Race } from "./race";
import { podium, rankGames, type RankedGame } from "./results";
import { timeline } from "./store";
import { MAX_PICKS } from "./voting";

export type Ceremony = {
  race: Race;
  /** Games in lane order: alphabetical, so no lane position hints at the result. */
  lanes: Game[];
  /** Podium steps for ranks 1–3 (`place` 0 = 1st step), tied Games sharing a step. */
  steps: { place: number; rank: number; games: RankedGame[] }[];
};

export async function loadCeremony(options: {
  db: D1Database;
  edition: Edition;
  competition: Category;
  /** Replay seeded made-up Votes instead of the real ones, to rehearse. */
  demo: boolean;
}): Promise<Ceremony> {
  const { db, edition, competition, demo } = options;
  const gameIds = competition.games.map((game) => game.id);
  const votes = demo
    ? demoVotes(gameIds, { maxPicks: MAX_PICKS, days: ["2026-10-23", "2026-10-24", "2026-10-25"] })
    : await timeline(db, edition.id, competition.id);
  const race = buildRace(gameIds, votes);

  const finalPicks = Object.fromEntries(gameIds.map((id) => [id, race.series[id][race.votes]]));
  const steps = podium(rankGames(competition.games, finalPicks)).map((step, place) => ({ place, ...step }));
  const lanes = [...competition.games].sort((a, b) => a.title.localeCompare(b.title));

  return { race, lanes, steps };
}

/** JSON for a `<script type="application/json">` block, safe against `</script>` in titles. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
