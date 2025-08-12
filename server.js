// server.js
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import http from "http";
import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import authRoutes from "./routes/auth.js";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { Parser } from "json2csv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const isProd = process.env.NODE_ENV === "production" || !!process.env.RENDER;

// --- Ensure required directories exist ---
const dbDir = join(__dirname, "db");
fs.mkdirSync(dbDir, { recursive: true });
const publicDir = join(__dirname, "public");
fs.mkdirSync(publicDir, { recursive: true });

// --- DB (for user lookup / CSV export) ---
const dbPromise = open({
  filename: join(dbDir, "database.sqlite"),
  driver: sqlite3.Database
});

// --- Security headers ---
app.use(helmet());

// Content Security Policy (adjust as needed)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      scriptSrcElem: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrcElem: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  })
);

// --- Parsing ---
app.use(bodyParser.urlencoded({ extended: false }));

// --- Static files ---
app.use("/assets", express.static(join(publicDir, "assets")));
app.use("/images", express.static(join(publicDir, "images")));
app.use("/uploads", express.static(join(publicDir, "uploads")));
app.use(express.static(publicDir));

// --- Sessions (Render is behind a proxy) ---
app.set("trust proxy", 1);
const SQLiteStore = SQLiteStoreFactory(session);
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: dbDir }),
    secret: process.env.SESSION_SECRET || "change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,       // true in production behind HTTPS
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// --- Routes ---
app.use("/auth", authRoutes);

app.get("/auth/user", (req, res) => {
  if (req.session.user) {
    return res.json({ username: req.session.user.username, email: req.session.user.email });
  }
  res.status(401).send("Not authenticated");
});

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login.html");
}

app.get("/member.html", requireAuth, (req, res) => {
  res.sendFile(join(publicDir, "member.html"));
});

app.get("/member", (req, res) => res.redirect("/member.html"));

// --- CSV export (basic auth) ---
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "password";
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Contacts Export"');
    return res.status(401).send("Authentication required.");
  }
  const [user, pass] = Buffer.from(auth.split(" ")[1], "base64").toString().split(":");
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  res.setHeader("WWW-Authenticate", 'Basic realm="Contacts Export"');
  return res.status(403).send("Forbidden");
}

app.get("/admin/contacts.csv", basicAuth, async (req, res) => {
  const db = await dbPromise;
  const users = await db.all("SELECT username, email FROM users");
  const parser = new Parser({ fields: ["username", "email"] });
  const csv = parser.parse(users);
  res.header("Content-Type", "text/csv");
  res.attachment("contacts.csv");
  res.send(csv);
});

// --- Start HTTP server (Render expects HTTP on PORT) ---
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
http.createServer(app).listen(PORT, HOST, () => {
  console.log(` Server listening on http://${HOST}:${PORT}`);
});
