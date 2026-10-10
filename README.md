# Vote

Audience vote for the Indie Awards of [Stunfest](https://stunfest.com), the video game festival in Rennes, France. Visitors at the stand scan a QR code on a big screen and vote for their favourite game in the competition.

- Voting needs physical presence: the QR code on the Host Screen changes every 10 s and only works for 20 s after it is shown. Opening it grants a Ballot good for one Vote within 3 minutes ([why](docs/adr/0001-two-step-qr-and-ballot.md)).
- Organisers open and close voting, follow live Results, and Reveal them publicly at the ceremony.
- Interface in French and English (from the phone's language, with a FR/EN switch).

The look follows the festival's 2026 identity on [stunfest.com](https://www.stunfest.com); colours and fonts are defined once in `src/layouts/Base.astro`. Domain vocabulary is in [CONTEXT.md](CONTEXT.md). Built with Astro on Cloudflare Workers and D1 ([why](docs/adr/0002-astro-on-cloudflare-workers.md)).

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | Public | Holding page, then Results after the Reveal |
| `/vote/<token>` | Visitors | Target of the QR code: exchanges a fresh code for a Ballot |
| `/vote` | Visitors | Pick a game and vote |
| `/login` | Organisers | Shared organiser password |
| `/host` | Organisers | Host Screen with the rotating QR code |
| `/admin` | Organisers | Voting Status, Reveal, live Results |

## Development

```sh
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Log in at http://localhost:4321/login with the `ORGANISER_SECRET` from `.dev.vars`, open voting on `/admin`, then open `/host`. In development the Host Screen shows a clickable vote link under the QR code.

```sh
npm test         # unit tests
npm run check    # type check
```

## New edition

1. Add `src/data/editions/<year>.json` (copy the previous one). Each Game needs a unique kebab-case `id`; exactly one Category has `"voting": true`.
2. Put each Game's image at `public/<year>/<id>.jpg`.
3. Set `ACTIVE_EDITION` in `wrangler.jsonc` to `<year>`.
4. Change the organiser password: `npx wrangler secret put ORGANISER_SECRET`.

Votes are stored per Edition, so previous Results are kept.

## Deployment (Cloudflare)

One-time setup:

```sh
npx wrangler login
npx wrangler d1 create stunfest-vote   # copy the database_id into wrangler.jsonc
npx wrangler secret put ORGANISER_SECRET
npx wrangler secret put SIGNING_KEY    # long random string, e.g. `openssl rand -base64 32`
```

Every deploy:

```sh
npm run db:migrate:remote
npm run deploy
```

The app is served at `https://stunfest-vote.<account>.workers.dev`. A custom domain such as `vote.indieco.xyz` needs the domain on Cloudflare; until then, the workers.dev address works because visitors only reach it through the QR code.

Changing `SIGNING_KEY` logs out all organisers and invalidates open Ballots.
