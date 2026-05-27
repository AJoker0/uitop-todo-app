import { DatabaseSync } from 'node:sqlite';

type QueryParams = Array<string | number | null>;

export async function initDB() {
  const database = new DatabaseSync('./database.sqlite');

  const db = {
    exec: async (sql: string) => database.exec(sql),
    get: async <T = any>(sql: string, params: QueryParams = []) => database.prepare(sql).get(...params) as T,
    all: async <T = any>(sql: string, params: QueryParams = []) => database.prepare(sql).all(...params) as T[],
    run: async (sql: string, params: QueryParams = []) => {
      const result = database.prepare(sql).run(...params);
      return { lastID: Number(result.lastInsertRowid), changes: result.changes };
    },
  };

  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      categoryId INTEGER,
      isCompleted BOOLEAN DEFAULT 0,
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    );
  `);

  const count = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (count.count === 0) {
    await db.exec(`
      INSERT INTO categories (name) VALUES ('Work'), ('Personal'), ('Study'), ('Hobby');
    `);
  }

  return db;
}