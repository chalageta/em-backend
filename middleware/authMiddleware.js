import jwt from "jsonwebtoken";
import db from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "secret";

// Protect routes - requires login
export const protect = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret); // { id, email, role, iat, exp }

    // Get latest user data from DB
    db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(401).json({ message: "User not found" });

        req.user = results[0]; // attach user to request
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

// Admin-only middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin access required" });
  }
};
