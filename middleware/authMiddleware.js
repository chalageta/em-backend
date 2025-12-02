import jwt from "jsonwebtoken";
import db from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "secret";

// Protect routes - requires login
export const protect = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length)
          return res.status(401).json({ message: "User not found" });

        req.user = results[0];
        next();
      }
    );
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized, token invalid or expired" });
  }
};

// Admin-only
export const admin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

// Salesman-only
export const salesman = (req, res, next) => {
  if (req.user?.role === "salesman") {
    return next();
  }
  return res.status(403).json({ message: "Salesman access required" });
};

// Admin or Salesman
export const adminOrSalesman = (req, res, next) => {
  if (req.user?.role === "admin" || req.user?.role === "salesman") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Admin or Salesman access required" });
};
// Optional authentication - does not fail if token missing
export const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, jwtSecret);
      db.query(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [decoded.id],
        (err, results) => {
          if (!err && results.length) {
            req.user = results[0]; // attach user if token valid
          }
          next(); // continue anyway
        }
      );
    } catch (err) {
      next(); // invalid token → continue as guest
    }
  } else {
    next(); // no token → guest
  }
};

