// Per-request access to the active Edition and Cloudflare bindings.

import { env } from "cloudflare:workers";
import { getCompetition, getEdition } from "./edition";

export function app() {
  const edition = getEdition(env.ACTIVE_EDITION);
  return {
    db: env.DB,
    key: env.SIGNING_KEY,
    // Missing secret means nobody can log in (secretMatches rejects an empty secret).
    organiserSecret: env.ORGANISER_SECRET ?? "",
    edition,
    competition: getCompetition(edition),
  };
}

/** Cookie marking that this phone has voted in an Edition; casual repeat-vote protection. */
export const votedCookie = (edition: string) => `voted_${edition}`;
export const BALLOT_COOKIE = "ballot";

export function cookieOptions(url: URL, maxAgeSeconds: number, path = "/") {
  return {
    path,
    maxAge: maxAgeSeconds,
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax" as const,
  };
}
