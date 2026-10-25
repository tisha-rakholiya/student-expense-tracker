const mongoose = require("mongoose");

const CATEGORIES = [
  "Food",
  "Travel",
  "Books & Stationery",
  "Rent & Hostel",
  "Recharge & Internet",
  "Entertainment",
  "Shopping",
  "Health",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card"];

const expenseSchema = new mongoose.Schema(
  {
    // Which student this expense belongs to
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [60, "Title must be 60 characters or less"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: "Invalid category" },
      default: "Other",
    },
    paymentMethod: {
      type: String,
      enum: { values: PAYMENT_METHODS, message: "Invalid payment method" },
      default: "UPI",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "Note must be 200 characters or less"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
