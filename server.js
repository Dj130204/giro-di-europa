// server.js
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import https from "https";
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

// Initialize DB promise for user lookup / CSV
const dbPromise = open({
  filename: join(__dirname, "db", "database.sqlite"),
  driver: sqlite3.Database
});

// Security headers
app.use(helmet());

// Content Security Policy (adjust for production)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "'unsafe-inline'"
      ],
      scriptSrcElem: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "'unsafe-inline'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com"
      ],
      styleSrcElem: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      imgSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "data:"
      ],
      fontSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://player.vimeo.com"
      ],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  })
);

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from public/
app.use('/assets', express.static(join(__dirname, 'public', 'assets')));
// Legacy mount: serve assets also under /images
app.use('/images', express.static(join(__dirname, 'public', 'assets')));
app.use('/images', express.static(join(__dirname, 'public', 'images')));
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));
app.use(express.static(join(__dirname, 'public')));
app.use('/assets', express.static(join(__dirname, 'public', 'assets')));
app.use('/images', express.static(join(__dirname, 'public', 'images')));
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));

// Session setup (secure: false for local dev)
const SQLiteStore = SQLiteStoreFactory(session);
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: join(__dirname, 'db') }),
    secret: process.env.SESSION_SECRET || 'change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true with valid HTTPS in production
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Auth routes
app.use('/auth', authRoutes);

// User info endpoint
app.get('/auth/user', (req, res) => {
  if (req.session.user) {
    return res.json({ username: req.session.user.username, email: req.session.user.email });
  }
  res.status(401).send('Not authenticated');
});

// Protect member.html
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login.html');
}
app.get('/member.html', requireAuth, (req, res) => {
  res.sendFile(join(__dirname, 'public', 'member.html'));
});

// Redirect /member to protected member.html
app.get('/member', (req, res) => res.redirect('/member.html'));

// CSV export with basic auth (optional)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Contacts Export"');
    return res.status(401).send('Authentication required.');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Contacts Export"');
  return res.status(403).send('Forbidden');
}
app.get('/admin/contacts.csv', basicAuth, async (req, res) => {
  const db = await dbPromise;
  const users = await db.all('SELECT username, email FROM users');
  const parser = new Parser({ fields: ['username', 'email'] });
  const csv = parser.parse(users);
  res.header('Content-Type', 'text/csv');
  res.attachment('contacts.csv');
  res.send(csv);
});

// HTTPS server
const sslOpts = {
  pfx: fs.readFileSync(join(__dirname, 'certs', 'server.pfx')),
  passphrase: 'changeit'
};
https.createServer(sslOpts, app).listen(443, () => console.log('🚀 HTTPS on 443'));
