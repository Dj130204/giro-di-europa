// db/users.js
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

let dbPromise = open({
  filename: path.join(__dirname, "database.sqlite"),
  driver: sqlite3.Database
}).then(db => {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      profilePic TEXT
    );
  `).then(() => db);
});

export async function getUserByEmail(email) {
  const db = await dbPromise;
  return db.get("SELECT * FROM users WHERE email = ?", email);
}

export async function createUser({ username, email, password, profilePic }) {
  const db = await dbPromise;
  const result = await db.run(
    `INSERT INTO users (username, email, password, profilePic)
     VALUES (?, ?, ?, ?)`,
    username, email, password, profilePic
  );
  return db.get("SELECT * FROM users WHERE id = ?", result.lastID);
}
