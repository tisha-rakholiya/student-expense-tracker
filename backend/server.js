require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const budgetRoutes = require("./routes/budget");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/student_expense_tracker";

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budget", budgetRoutes);

// In production, serve the built React app from frontend/dist
const distPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(distPath));
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => err && next());
});

// Unknown API route
app.use("/api", (req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler: send clear messages for validation errors
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: "This record already exists" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set in .env, using a default secret (fine for local testing only)");
}

// Connect to MongoDB, then start the server
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    // Remove the old "one budget per month" index from the version without login
    await mongoose.connection
      .collection("budgets")
      .dropIndex("month_1")
      .catch(() => {});
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });
