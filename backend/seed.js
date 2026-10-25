// Creates a demo account with sample expenses for the current month.
// Run with: npm run seed
// Demo login:  demo@student.com  /  demo123
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Expense = require("./models/Expense");
const Budget = require("./models/Budget");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/student_expense_tracker";

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const day = (d) => new Date(Date.UTC(y, m, Math.min(d, 28)));
const month = `${y}-${String(m + 1).padStart(2, "0")}`;

const samples = [
  { title: "Canteen lunch", amount: 80, category: "Food", paymentMethod: "UPI", date: day(2) },
  { title: "Bus pass", amount: 450, category: "Travel", paymentMethod: "Cash", date: day(3) },
  { title: "Notebooks and pens", amount: 220, category: "Books & Stationery", paymentMethod: "UPI", date: day(5) },
  { title: "Mobile recharge", amount: 299, category: "Recharge & Internet", paymentMethod: "UPI", date: day(6) },
  { title: "Hostel rent", amount: 3500, category: "Rent & Hostel", paymentMethod: "UPI", date: day(1) },
  { title: "Movie with friends", amount: 250, category: "Entertainment", paymentMethod: "Card", date: day(10) },
  { title: "Pizza night", amount: 340, category: "Food", paymentMethod: "UPI", date: day(12) },
  { title: "Auto to college", amount: 60, category: "Travel", paymentMethod: "Cash", date: day(14) },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Start fresh: remove old data (including data saved before login was added)
  await Promise.all([Expense.deleteMany({}), Budget.deleteMany({}), User.deleteMany({})]);
  await mongoose.connection.collection("budgets").dropIndex("month_1").catch(() => {});
  await Budget.syncIndexes();

  const user = await User.create({
    name: "Demo Student",
    email: "demo@student.com",
    password: await bcrypt.hash("demo123", 10),
  });

  await Expense.insertMany(samples.map((s) => ({ ...s, user: user._id })));
  await Budget.create({ user: user._id, month, amount: 6000 });

  console.log(`Created demo account: demo@student.com / demo123`);
  console.log(`Added ${samples.length} sample expenses and a budget of Rs 6000 for ${month}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
