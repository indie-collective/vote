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

export async function castVote(
  db: D1Database,
  vote: { edition: string; category: string; gameId: string; ballotId: string }
): Promise<CastResult> {
  const result = await db
    .prepare(
      `INSERT INTO votes (id, edition, category, game_id, ballot_id)
       SELECT ?, ?, ?, ?, ?
       WHERE EXISTS (SELECT 1 FROM edition_status WHERE edition = ? AND voting_open = 1)
       ON CONFLICT (ballot_id) DO NOTHING`
    )
    .bind(crypto.randomUUID(), vote.edition, vote.category, vote.gameId, vote.ballotId, vote.edition)
    .run();
  if (result.meta.changes > 0) return "accepted";
  return (await getStatus(db, vote.edition)).votingOpen ? "ballot-used" : "closed";
}

export async function countVotes(
  db: D1Database,
  edition: string,
  category: string
): Promise<Record<string, number>> {
  const { results } = await db
    .prepare(
      "SELECT game_id, COUNT(*) AS votes FROM votes WHERE edition = ? AND category = ? GROUP BY game_id"
    )
    .bind(edition, category)
    .all<{ game_id: string; votes: number }>();
  return Object.fromEntries(results.map((row) => [row.game_id, row.votes]));
}
