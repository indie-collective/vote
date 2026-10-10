# Approval voting, capped at five Picks

Visitors usually play only a handful of the Competition's Games, so asking for a single favourite throws information away, and asking for a full ranking makes them rank games they never played. Each Vote is therefore a set of one to five unranked Picks, and a Game's Results are its number of Picks (equivalently, the share of voters who picked it). The cap keeps each Pick meaningful and stops "tick everything" votes. This resolves issue #1 (points / upvote / top 3).

## Considered Options

- **One pick (the original system)**: simplest, but a visitor who loved three Games can only back one.
- **Ranked voting (full ranking, instant runoff, Borda)**: fiddly drag-to-order on phones, meaningless for unplayed Games, and hard to explain at the ceremony.
- **Top three with 3-2-1 points**: slower at the stand, and #2/#3 tend to be half-hearted.
- **Star ratings per Game**: averages reward Games with a few enthusiastic raters unless a minimum count is imposed.
- **Upvote/downvote**: downvoting indie developers at their own festival is a bad look.
- **Uncapped approval**: "tick everything" Votes dilute everyone else's.

## Consequences

Votes and Picks are stored separately (one row per Vote, one per Pick). Exposure bias remains: Games with busier stands get played, and so picked, more.
