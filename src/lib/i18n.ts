// Interface text only; Game content stays as written in the Edition file.

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "lang";

const fr = {
  siteTitle: "Indie Awards du Stunfest",
  siteDescription: "Votez pour votre jeu indé préféré du Stunfest.",
  votePrompt: "Votez pour vos jeux préférés !",
  pickHint: (max: number) => `Choisissez jusqu'à ${max} jeux auxquels vous avez joué.`,
  hostTop: "Votez pour vos",
  hostBottom: "jeux préférés !",
  voteButton: "Voter",
  timeLeft: "Temps restant",
  thanksTitle: "Merci pour votre vote ! 🎉",
  thanksText: "Bon Stunfest !",
  invalidTitle: "Lien de vote invalide !",
  expiredTitle: "Lien de vote expiré !",
  scanAgain: "Essayez de scanner le QR Code à nouveau.",
  noBallotTitle: "Temps écoulé !",
  noBallotText: "Scannez à nouveau le QR Code sur l'écran du stand.",
  closedTitle: "Votes clos",
  closedText: "Les votes sont terminés. Rendez-vous à la cérémonie !",
  invalidVoteTitle: "Choix invalide",
  invalidVoteText: (max: number) => `Choisissez entre 1 et ${max} jeux de la compétition.`,
  resultsTitle: "Résultats",
  game: "Jeu",
  votes: "Votes",
  voters: "Votants",
  holdingTitle: "Résultats annoncés lors de la cérémonie",
  holdingText: "Revenez après la remise des prix !",
  loginTitle: "Espace organisateur",
  secretLabel: "Mot de passe organisateur",
  loginButton: "Se connecter",
  wrongSecret: "Mot de passe incorrect.",
  logout: "Se déconnecter",
  adminTitle: "Organisation",
  votingOpen: "Votes ouverts",
  votingClosed: "Votes fermés",
  openVoting: "Ouvrir les votes",
  closeVoting: "Fermer les votes",
  reveal: "Révéler les résultats",
  unreveal: "Masquer les résultats",
  revealed: "Résultats publics",
  notRevealed: "Résultats privés",
  revealNeedsClosed: "Fermez les votes avant de révéler les résultats.",
  totalVoters: "Votants",
  hostLink: "Écran du stand",
  publicLink: "Page publique",
  adminLink: "Organisation",
  hostClosed: "Votes clos",
  refreshing: "Mise à jour automatique",
  raceLink: "Course des résultats",
  raceTitle: "Le Grand Prix des Indie Awards",
  raceStart: "Espace : départ",
  racePodium: "Espace : podium",
  raceNext: "Espace : suivant",
  raceRestart: "R : recommencer · F : plein écran",
  raceDemo: "Démo : votes fictifs",
  raceEmpty: "Aucun vote pour l'instant.",
  podiumPlaces: ["1er", "2e", "3e"],
};

const en: typeof fr = {
  siteTitle: "Stunfest Indie Awards",
  siteDescription: "Vote for your favourite indie game at Stunfest.",
  votePrompt: "Vote for your favourite games!",
  pickHint: (max: number) => `Pick up to ${max} games you played.`,
  hostTop: "Vote for your",
  hostBottom: "favourite games!",
  voteButton: "Vote",
  timeLeft: "Time left",
  thanksTitle: "Thanks for voting! 🎉",
  thanksText: "Enjoy Stunfest!",
  invalidTitle: "Invalid voting link!",
  expiredTitle: "Voting link expired!",
  scanAgain: "Try scanning the QR code again.",
  noBallotTitle: "Time's up!",
  noBallotText: "Scan the QR code on the stand's screen again.",
  closedTitle: "Voting is closed",
  closedText: "Voting has ended. See you at the ceremony!",
  invalidVoteTitle: "Invalid choice",
  invalidVoteText: (max: number) => `Pick between 1 and ${max} games from the competition.`,
  resultsTitle: "Results",
  game: "Game",
  votes: "Votes",
  voters: "Voters",
  holdingTitle: "Results will be announced at the ceremony",
  holdingText: "Come back after the awards!",
  loginTitle: "Organisers",
  secretLabel: "Organiser password",
  loginButton: "Log in",
  wrongSecret: "Wrong password.",
  logout: "Log out",
  adminTitle: "Organisation",
  votingOpen: "Voting open",
  votingClosed: "Voting closed",
  openVoting: "Open voting",
  closeVoting: "Close voting",
  reveal: "Reveal results",
  unreveal: "Hide results",
  revealed: "Results public",
  notRevealed: "Results private",
  revealNeedsClosed: "Close voting before revealing the results.",
  totalVoters: "Voters",
  hostLink: "Stand screen",
  publicLink: "Public page",
  adminLink: "Organisation",
  hostClosed: "Voting closed",
  refreshing: "Updates automatically",
  raceLink: "Results race",
  raceTitle: "The Indie Awards Grand Prix",
  raceStart: "Space: start",
  racePodium: "Space: podium",
  raceNext: "Space: next",
  raceRestart: "R: restart · F: fullscreen",
  raceDemo: "Demo: made-up votes",
  raceEmpty: "No votes yet.",
  podiumPlaces: ["1st", "2nd", "3rd"],
};

export type Messages = typeof fr;

const messages: Record<Locale, Messages> = { fr, en };

export function t(locale: Locale): Messages {
  return messages[locale];
}

function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Explicit choice (query or cookie) wins, then the phone's language, then French. */
export function pickLocale(options: {
  query?: string | null;
  cookie?: string;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(options.query)) return options.query;
  if (isLocale(options.cookie)) return options.cookie;
  const preferred = (options.acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.lang && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .find((entry) => isLocale(entry.lang));
  return preferred ? (preferred.lang as Locale) : DEFAULT_LOCALE;
}
