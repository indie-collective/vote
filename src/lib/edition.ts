// Editions are data files in src/data/editions/<id>.json; ACTIVE_EDITION picks one.

export type Game = {
  id: string;
  title: string;
  studio: string;
  keywords?: string[];
  link?: string;
  summary?: string;
};

export type Category = {
  id: string;
  name: string;
  /** True for the Competition: the only Category whose Games can receive Votes. */
  voting: boolean;
  games: Game[];
};

export type Edition = {
  id: string;
  name: string;
  categories: Category[];
};

const editions = import.meta.glob<Edition>("../data/editions/*.json", {
  eager: true,
  import: "default",
});

export function getEdition(id: string): Edition {
  const edition = Object.values(editions).find((candidate) => candidate.id === id);
  if (!edition) throw new Error(`Unknown edition "${id}" (check ACTIVE_EDITION)`);
  return edition;
}

export function getCompetition(edition: Edition): Category {
  const competitions = edition.categories.filter((category) => category.voting);
  if (competitions.length !== 1) {
    throw new Error(`Edition "${edition.id}" must have exactly one voting Category`);
  }
  return competitions[0];
}

export function gameImage(edition: Edition, game: Game): string {
  return `/${edition.id}/${game.id}.jpg`;
}
