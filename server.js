// server.js
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

import fs from "fs";
import https from "https";
import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import authRoutes from "./routes/auth.js";

const app = express();

// Security headers
app.use(helmet());

// Content Security Policy (adjust for prod)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      scriptSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      scriptSrcElem: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "data:"
      ],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  })
);

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Static file serving
app.use('/assets',  express.static(join(__dirname, 'public/assets')));
app.use('/images',  express.static(join(__dirname, 'public/images')));
app.use('/uploads', express.static(join(__dirname, 'public/uploads')));
// Also allow legacy image paths from assets
app.use('/images',   express.static(join(__dirname, 'public/assets')));
app.use(express.static(join(__dirname, 'public')));

// Session setup
const SQLiteStore = SQLiteStoreFactory(session);
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: './db' }),
    secret: process.env.SESSION_SECRET || 'change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      // set to true in production with valid HTTPS
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Auth routes
app.use('/auth', authRoutes);

// Protect dashboard
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login.html');
}
app.get(
  '/dashboard',
  requireAuth,
  (req, res) => res.sendFile(join(__dirname, 'public', 'dashboard.html'))
);

// HTTPS options using PFX
const sslOpts = {
  pfx: fs.readFileSync(join(__dirname, 'certs', 'server.pfx')),
  passphrase: 'changeit'
};

https.createServer(sslOpts, app)
  .listen(443, () => console.log('🚀 HTTPS on 443'));
