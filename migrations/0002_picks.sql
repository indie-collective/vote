-- Approval voting (docs/adr/0003): a Vote holds one to five Picks.
-- Existing single-game Votes become Votes with one Pick.
CREATE TABLE picks (
  vote_id TEXT NOT NULL REFERENCES votes (id),
  game_id TEXT NOT NULL,
  PRIMARY KEY (vote_id, game_id)
);

INSERT INTO picks (vote_id, game_id) SELECT id, game_id FROM votes;

DROP INDEX votes_edition_game;
ALTER TABLE votes DROP COLUMN game_id;
CREATE INDEX votes_edition_category ON votes (edition, category);
CREATE INDEX picks_game ON picks (game_id);
