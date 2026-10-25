const express = require("express");
const Budget = require("../models/Budget");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Every budget route needs a logged-in user
router.use(requireAuth);

// GET /api/budget/2026-10 -> this user's budget for that month (amount 0 if not set)
router.get("/:month", async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ user: req.userId, month: req.params.month });
    res.json(budget || { month: req.params.month, amount: 0 });
  } catch (err) {
    next(err);
  }
});

// PUT /api/budget/2026-10  body: { amount: 5000 } -> create or update this user's budget
router.put("/:month", async (req, res, next) => {
  try {
    if (!/^\d{4}-\d{2}$/.test(req.params.month)) {
      return res.status(400).json({ message: "Month must be in YYYY-MM format" });
    }
    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, month: req.params.month },
      { user: req.userId, month: req.params.month, amount: req.body.amount },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(budget);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
