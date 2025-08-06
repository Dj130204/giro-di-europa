// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { getUserByEmail, createUser } from "../db/users.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../public/uploads")),
  filename: (req, file, cb) => {
    cb(null, `pic-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.post(
  "/signup",
  upload.single("profilePic"),
  async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword)
      return res.status(400).send("Passwords do not match");
    if (!email.match(/.+@.+\..+/) || password.length < 8)
      return res.status(400).send("Invalid email or password too short");
    if (await getUserByEmail(email))
      return res.status(400).send("Email already in use");

    const hashed = await bcrypt.hash(password, 12);
    const picPath = req.file ? `/uploads/${req.file.filename}` : null;
    const user = await createUser({ username, email, password: hashed, profilePic: picPath });

    req.session.user = { id: user.id, username: user.username, email: user.email };
    res.redirect("/dashboard");
  }
);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).send("Email or password incorrect");

  req.session.user = { id: user.id, username: user.username, email: user.email };
  res.redirect("/dashboard");
});

export default router;
