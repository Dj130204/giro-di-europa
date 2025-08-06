// routes/auth.js
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

import { getUserByEmail, createUser } from "../db/users.js";

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, "../public/uploads")),
  filename:   (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `pic-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// SIGN UP
router.post(
  "/signup",
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;
      // Validate input
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).send("All fields are required.");
      }
      if (password !== confirmPassword) {
        return res.status(400).send("Passwords do not match.");
      }
      if (!/.+@.+\..+/.test(email) || password.length < 8) {
        return res.status(400).send("Invalid email or password too short (min 8 chars).");
      }
      // Check existing user
      const existing = await getUserByEmail(email);
      if (existing) {
        return res.status(400).send("Email already in use.");
      }
      // Hash password
      const hashed = await bcrypt.hash(password, 12);
      // Handle profile picture path
      const profilePicPath = req.file ? `/uploads/${req.file.filename}` : null;
      // Create user in DB
      const user = await createUser({ username, email, password: hashed, profilePic: profilePicPath });
      // Store session
      req.session.user = { id: user.id, username: user.username, email: user.email };
      // Redirect to dashboard
      res.redirect("/member");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error during signup.");
    }
  }
);

// LOG IN
router.post(
  "/login",
  async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).send("Email and password are required.");
      }
      // Fetch user
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).send("Invalid email or password.");
      }
      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).send("Invalid email or password.");
      }
      // Set session
      req.session.user = { id: user.id, username: user.username, email: user.email };
      res.redirect("/member");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error during login.");
    }
  }
);

// LOG OUT
router.post(
  "/logout",
  (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error(err);
        return res.status(500).send("Logout failed.");
      }
      res.clearCookie('connect.sid');
      res.redirect('/login.html');
    });
  }
);

export default router;
