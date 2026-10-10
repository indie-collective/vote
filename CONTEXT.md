# Stunfest Vote

Audience-vote app for the Stunfest Indie Awards (Rennes, France): festival visitors physically present at the stand vote for their favourite game in the competition.

## Language

### Event

**Edition**:
One year's Stunfest Indie Awards, e.g. "Stunfest 2026". Every Game and Vote belongs to exactly one Edition; only one Edition is active at a time. Past Editions are kept as an archive of their Game lists.
_Avoid_: Event, year, festival

**Category**:
A named group of Games within an Edition (e.g. Competition, Indie Games, Game Jam). Only the Competition is voted on; other Categories are informational.

**Competition**:
The single Category of an Edition whose Games are eligible for audience Votes.
_Avoid_: Indie awards, contest

**Game**:
A title shown at the festival, listed in exactly one Category of an Edition.
_Avoid_: Entry, project

### Voting

**Vote**:
One visitor's choice of one Game in the Competition. Never edited or deleted once cast.
_Avoid_: Ballot (a Ballot is the permission to vote, not the vote)

**Host Screen**:
The organiser-controlled display at the stand that shows the rotating QR code. Being in front of it is what proves on-site presence.
_Avoid_: Kiosk, QR page

**Ballot**:
A visitor's short-lived permission to cast one Vote, obtained by scanning the Host Screen's QR code while it is still fresh. A Ballot yields at most one Vote and expires if unused.
_Avoid_: Token, voting link, session

**Voting Status**:
Whether the active Edition is accepting Votes (Open) or not (Closed). Set by an Organiser; while Closed, no Ballots are issued and no Votes are accepted, including from Ballots issued before closing.

**Organiser**:
A Stunfest/Indie Collective team member who runs the Host Screen, controls Voting Status, sees Results and performs the Reveal.
_Avoid_: Admin, host

### Results

**Results**:
The vote tally per Game for the active Edition. Organisers can always see them; the public sees them only after the Reveal.
_Avoid_: Leaderboard, scores

**Reveal**:
An Organiser's deliberate act of making Results public, typically at the awards ceremony. Only possible while Voting Status is Closed; can be undone.
