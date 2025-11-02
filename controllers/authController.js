import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "secret";
const jwtExpires = process.env.JWT_EXPIRES_IN || "7d";

const generateToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtExpires });

// -------------------- Existing functions --------------------
export const registerUser = (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Name, email, and password required" });

  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length) return res.status(400).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role || "user"],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const userId = result.insertId;
        const token = generateToken({ id: userId, email, role: role || "user" });
        res.status(201).json({ id: userId, name, email, role: role || "user", token });
      }
    );
  });
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
  });
};

export const logoutUser = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

export const getProfile = (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  });
};
// 3. Change password → logged-in user
export const changePassword = async (req, res) => {
  const user = req.user;
  const { current_password, new_password, new_password_confirmation } = req.body;

  if (!current_password || !new_password || !new_password_confirmation)
    return res.status(400).json({ message: "All fields are required" });

  if (new_password !== new_password_confirmation)
    return res.status(400).json({ message: "New passwords do not match" });

  db.query("SELECT password FROM users WHERE id = ?", [user.id], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const match = await bcrypt.compare(current_password, results[0].password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(new_password, salt);

    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ message: "Password changed successfully", status: "success" });
    });
  });
};
