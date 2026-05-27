import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

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

  // Сидирование категорий, если пусто
  const count = await db.get('SELECT COUNT(*) as count FROM categories');
  if (count.count === 0) {
    await db.exec(`
      INSERT INTO categories (name) VALUES ('Work'), ('Personal'), ('Study'), ('Hobby');
    `);
  }

  return db;
}