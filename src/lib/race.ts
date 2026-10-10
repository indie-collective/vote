// The ceremony race: Votes replayed in the order they were cast, each Pick moving its Game forward.

export type TimedVote = { castAt: string; gameIds: string[] };

export type Race = {
  /** Number of Votes replayed. */
  votes: number;
  /** For each Game id, its Picks after 0, 1, …, `votes` Votes (length `votes + 1`). */
  series: Record<string, number[]>;
  /** When each Vote was cast (length `votes`). */
  castAt: string[];
  /** Highest final number of Picks: the finish line. */
  finish: number;
};

export function buildRace(gameIds: string[], votes: TimedVote[]): Race {
  const series: Record<string, number[]> = Object.fromEntries(gameIds.map((id) => [id, [0]]));
  for (const vote of votes) {
    for (const id of gameIds) {
      const previous = series[id][series[id].length - 1];
      series[id].push(previous + (vote.gameIds.includes(id) ? 1 : 0));
    }
  }
  const finish = Math.max(0, ...gameIds.map((id) => series[id][votes.length]));
  return { votes: votes.length, series, castAt: votes.map((vote) => vote.castAt), finish };
}

/** Small deterministic PRNG so a demo race looks the same every time it's rehearsed. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Made-up Votes for rehearsing the ceremony before real ones exist: `count` Votes of one to
 * `maxPicks` Games, spread over the festival's opening hours, with some Games more popular.
 */
export function demoVotes(
  gameIds: string[],
  options: { count?: number; maxPicks: number; days: string[]; seed?: number }
): TimedVote[] {
  const random = mulberry32(options.seed ?? 2026);
  const popularity = gameIds.map(() => 0.2 + random() ** 2);
  const votes: TimedVote[] = [];
  const count = options.count ?? 400;

  for (let i = 0; i < count; i++) {
    const day = options.days[Math.floor((i / count) * options.days.length)];
    const minutes = 10 * 60 + Math.floor(random() * 9 * 60); // 10:00–19:00
    const picks = 1 + Math.floor(random() * options.maxPicks);
    const chosen = new Set<string>();
    while (chosen.size < Math.min(picks, gameIds.length)) {
      let target = random() * popularity.reduce((sum, weight) => sum + weight, 0);
      const index = popularity.findIndex((weight) => (target -= weight) < 0);
      chosen.add(gameIds[index === -1 ? gameIds.length - 1 : index]);
    }
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    votes.push({ castAt: `${day}T${time}:00+02:00`, gameIds: [...chosen] });
  }
  return votes.sort((a, b) => a.castAt.localeCompare(b.castAt));
}
