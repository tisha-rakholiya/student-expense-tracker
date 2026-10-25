const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_env";

// Create a login token that is valid for 7 days
function createToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

// Middleware: only lets the request through if it has a valid token.
// The frontend sends it as the header  "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in first" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id; // routes use this to find only this user's data
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired, please log in again" });
  }
}

module.exports = { createToken, requireAuth };
