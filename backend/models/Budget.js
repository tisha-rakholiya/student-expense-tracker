const mongoose = require("mongoose");

// One budget per student per month, e.g. month = "2026-10"
const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [0, "Budget cannot be negative"],
    },
  },
  { timestamps: true }
);

// A student can have only one budget for a given month
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
