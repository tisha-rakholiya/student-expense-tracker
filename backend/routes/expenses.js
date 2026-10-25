const express = require("express");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Every expense route needs a logged-in user
router.use(requireAuth);

// Turn "2026-10" into a date range [start of month, start of next month)
function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || "")) return null;
  const [y, m] = month.split("-").map(Number);
  return { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/expenses/categories -> list of allowed categories and payment methods
router.get("/categories", (req, res) => {
  res.json({ categories: Expense.CATEGORIES, paymentMethods: Expense.PAYMENT_METHODS });
});

// GET /api/expenses/summary?month=2026-10 -> total, count and total per category
router.get("/summary", async (req, res, next) => {
  try {
    const range = monthRange(req.query.month);
    // aggregate() does not convert strings to ObjectId, so convert the user id here
    const match = { user: new mongoose.Types.ObjectId(req.userId) };
    if (range) match.date = range;

    // MongoDB aggregation: group the month's expenses by category and add up the amounts
    const byCategory = await Expense.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const total = byCategory.reduce((sum, c) => sum + c.total, 0);
    const count = await Expense.countDocuments(match);

    res.json({
      month: req.query.month || "all",
      total,
      count,
      byCategory: byCategory.map((c) => ({ category: c._id, total: c.total })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/expenses?month=2026-10&category=Food&search=pizza
router.get("/", async (req, res, next) => {
  try {
    const { month, category, search } = req.query;
    const filter = { user: req.userId };

    const range = monthRange(month);
    if (range) filter.date = range;
    if (category && category !== "All") filter.category = category;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses -> add a new expense for the logged-in user
router.post("/", async (req, res, next) => {
  try {
    const { title, amount, category, paymentMethod, date, note } = req.body;
    const expense = await Expense.create({ user: req.userId, title, amount, category, paymentMethod, date, note });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

// PUT /api/expenses/:id -> update an expense (only if it belongs to this user)
router.put("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid expense id" });

    const { title, amount, category, paymentMethod, date, note } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, amount, category, paymentMethod, date, note },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/expenses/:id -> delete an expense (only if it belongs to this user)
router.delete("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid expense id" });

    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
