import { Router } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// --- DB SETUP (own database file) ---
const dbPromise = open({
  filename: join(__dirname, "..", "db", "members.sqlite"),
  driver: sqlite3.Database,
});

async function initDB() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      car_make TEXT,
      car_model TEXT,
      livery_pack INTEGER DEFAULT 0,
      confirm_token TEXT,
      confirmed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
initDB().catch(console.error);

// --- Email Transport (optional; logs if not configured) ---
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// --- Helpers ---
function originBase(req) {
  // Prefer .env BASE_URL; otherwise build from request
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
}

// --- PAGE: /members ---
router.get("/", async (req, res) => {
  // Serve static HTML page (put in public/members.html)
  res.sendFile(join(__dirname, "..", "public", "members.html"));
});

// --- API: POST /members/api/signup ---
router.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, carMake, carModel, liveryPack } = req.body || {};
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const db = await dbPromise;
    await db.run(
      `INSERT INTO members (first_name, last_name, email, car_make, car_model, livery_pack, confirm_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName.trim(), lastName.trim(), email.trim().toLowerCase(), carMake || "", carModel || "", liveryPack ? 1 : 0, token]
    );

    const confirmUrl = `${originBase(req)}/members/confirm?token=${token}`;

    // Send email if transporter configured; else log link
    if (transporter) {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || "no-reply@giro-di-europa",
        to: email,
        subject: "Confirm your Giro di Europa membership",
        html: `<p>Hi ${firstName},</p>
               <p>Thanks for signing up. Please confirm your email by clicking the link below:</p>
               <p><a href="${confirmUrl}">${confirmUrl}</a></p>
               <p>If you didn’t request this, you can ignore this email.</p>`,
      });
    } else {
      console.log("[members] Email not configured. Confirmation link:", confirmUrl);
    }

    res.json({ ok: true });
  } catch (err) {
    if (String(err).includes("UNIQUE constraint failed: members.email")) {
      return res.status(409).json({ ok: false, error: "Email already registered." });
    }
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error." });
  }
});

// --- API: GET /members/confirm?token= ---
router.get("/confirm", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Missing token");

    const db = await dbPromise;
    const row = await db.get(`SELECT id FROM members WHERE confirm_token = ?`, [token]);
    if (!row) return res.status(404).send("Invalid token");

    await db.run(`UPDATE members SET confirmed = 1, confirm_token = NULL WHERE id = ?`, [row.id]);
    res.send(`Email confirmed! You can close this page.`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// --- Admin helper: list (optional; secure behind auth or comment out in prod) ---
router.get("/api/list", async (_req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all(`SELECT id, first_name, last_name, email, car_make, car_model, livery_pack, confirmed, created_at FROM members ORDER BY created_at DESC`);
    res.json({ ok: true, members: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
