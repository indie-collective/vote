// All D1 access. Invariants (Voting Status gate, one Vote per Ballot, Reveal only
// while closed) are enforced in SQL so concurrent requests can't break them.

export type EditionStatus = { votingOpen: boolean; revealed: boolean };

export type CastResult = "accepted" | "closed" | "ballot-used";

async function ensureStatusRow(db: D1Database, edition: string) {
  await db.prepare("INSERT OR IGNORE INTO edition_status (edition) VALUES (?)").bind(edition).run();
}

export async function getStatus(db: D1Database, edition: string): Promise<EditionStatus> {
  const row = await db
    .prepare("SELECT voting_open, revealed FROM edition_status WHERE edition = ?")
    .bind(edition)
    .first<{ voting_open: number; revealed: number }>();
  return { votingOpen: row?.voting_open === 1, revealed: row?.revealed === 1 };
}

export async function setVotingOpen(db: D1Database, edition: string, open: boolean) {
  await ensureStatusRow(db, edition);
  // Reopening voting hides Results again: a Reveal only holds while voting is closed.
  await db
    .prepare(
      "UPDATE edition_status SET voting_open = ?, revealed = CASE WHEN ? THEN 0 ELSE revealed END WHERE edition = ?"
    )
    .bind(open ? 1 : 0, open ? 1 : 0, edition)
    .run();
}

/** Returns false if the Reveal was refused because voting is still open. */
export async function setRevealed(db: D1Database, edition: string, revealed: boolean) {
  await ensureStatusRow(db, edition);
  const result = await db
    .prepare("UPDATE edition_status SET revealed = ? WHERE edition = ? AND voting_open = 0")
    .bind(revealed ? 1 : 0, edition)
    .run();
  return result.meta.changes > 0;
}

/**
 * Records a Vote and its Picks atomically (D1 batches are transactions). The Picks are only
 * inserted if the Vote was, so a closed Edition or a reused Ballot leaves no trace.
 */
export async function castVote(
  db: D1Database,
  vote: { edition: string; category: string; gameIds: string[]; ballotId: string }
): Promise<CastResult> {
  const voteId = crypto.randomUUID();
  const [inserted] = await db.batch([
    db
      .prepare(
        `INSERT INTO votes (id, edition, category, ballot_id)
         SELECT ?, ?, ?, ?
         WHERE EXISTS (SELECT 1 FROM edition_status WHERE edition = ? AND voting_open = 1)
         ON CONFLICT (ballot_id) DO NOTHING`
      )
      .bind(voteId, vote.edition, vote.category, vote.ballotId, vote.edition),
    ...vote.gameIds.map((gameId) =>
      db
        .prepare(
          "INSERT INTO picks (vote_id, game_id) SELECT ?, ? WHERE EXISTS (SELECT 1 FROM votes WHERE id = ?)"
        )
        .bind(voteId, gameId, voteId)
    ),
  ]);
  if (inserted.meta.changes > 0) return "accepted";
  return (await getStatus(db, vote.edition)).votingOpen ? "ballot-used" : "closed";
}

export type Tally = {
  /** Number of Votes cast. */
  voters: number;
  /** Number of Picks per Game id. */
  picks: Record<string, number>;
};

export async function tally(db: D1Database, edition: string, category: string): Promise<Tally> {
  const [voters, picks] = await db.batch([
    db
      .prepare("SELECT COUNT(*) AS voters FROM votes WHERE edition = ? AND category = ?")
      .bind(edition, category),
    db
      .prepare(
        `SELECT picks.game_id, COUNT(*) AS picks
         FROM picks JOIN votes ON votes.id = picks.vote_id
         WHERE votes.edition = ? AND votes.category = ?
         GROUP BY picks.game_id`
      )
      .bind(edition, category),
  ]);
  return {
    voters: (voters.results[0] as { voters: number }).voters,
    picks: Object.fromEntries(
      (picks.results as { game_id: string; picks: number }[]).map((row) => [row.game_id, row.picks])
    ),
  };
}
