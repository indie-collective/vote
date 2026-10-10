// Minimal in-memory stand-in for a D1 database, backed by Node's built-in SQLite,
// so the SQL in src/lib/store.ts and migrations/ can be tested without Cloudflare.
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

type Params = (string | number | null)[];

export function fakeD1(options: { migrations?: string[] } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");

  const files = readdirSync("migrations").filter((file) => file.endsWith(".sql")).sort();
  for (const file of options.migrations ?? files) {
    sqlite.exec(readFileSync(`migrations/${file}`, "utf8"));
  }

  const execute = (sql: string, params: Params) => {
    const statement = sqlite.prepare(sql);
    if (/^\s*SELECT/i.test(sql)) return { results: statement.all(...params), meta: { changes: 0 } };
    const { changes } = statement.run(...params);
    return { results: [], meta: { changes: Number(changes) } };
  };

  const prepare = (sql: string, params: Params = []) => ({
    sql,
    params,
    bind: (...values: Params) => prepare(sql, values),
    run: async () => execute(sql, params),
    all: async () => execute(sql, params),
    first: async () => (execute(sql, params).results[0] ?? null) as never,
  });

  const db = {
    prepare: (sql: string) => prepare(sql),
    // Like D1, a batch runs in one transaction and rolls back entirely on error.
    batch: async (statements: ReturnType<typeof prepare>[]) => {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map((statement) => execute(statement.sql, statement.params));
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };

  return { db: db as unknown as D1Database, sqlite };
}
