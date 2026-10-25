const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register  body: { name, email, password }
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "An account with this email already exists" });

    // Hash the password before saving (10 = salt rounds)
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({ token: createToken(user._id), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  body: { email, password }
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Please enter email and password" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Same message for wrong email or wrong password, so nobody can guess which emails exist
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    res.json({ token: createToken(user._id), user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me -> the logged-in user's details (used when the page reloads)
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: "Account not found, please log in again" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
