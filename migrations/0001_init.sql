-- One row per Edition: Voting Status and whether Results are revealed.
-- A Reveal is only allowed while voting is closed.
CREATE TABLE edition_status (
  edition TEXT PRIMARY KEY,
  voting_open INTEGER NOT NULL DEFAULT 0,
  revealed INTEGER NOT NULL DEFAULT 0,
  CHECK (NOT (voting_open = 1 AND revealed = 1))
);

-- Votes are never edited or deleted. ballot_id is unique: one Vote per Ballot.
CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  edition TEXT NOT NULL,
  category TEXT NOT NULL,
  game_id TEXT NOT NULL,
  ballot_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX votes_edition_game ON votes (edition, game_id);
