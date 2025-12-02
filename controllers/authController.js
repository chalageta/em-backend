import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js"; // your nodemailer function

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "secret";
const jwtExpires = process.env.JWT_EXPIRES_IN || "7d";

const generateToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtExpires });

// -------------------- Register User --------------------
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

// -------------------- Login User --------------------
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

// -------------------- Logout User --------------------
export const logoutUser = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// -------------------- Get Profile --------------------
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

// -------------------- Change Password --------------------
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

// -------------------- Forgot Password --------------------
export const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ message: "Email is required" });

  db.query("SELECT id FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length)
      return res.status(404).json({ message: "Email not found" });

    const userId = results[0].id;

    // Generate reset token and expiry (15 min)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15);

    db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
      [resetToken, expires, userId],
      async (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const resetUrl = `http://empharmaceutical.com/reset-password/${resetToken}`;
        const html = `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="padding:10px 16px; background:#1976d2; color:white; text-decoration:none; border-radius:6px;">Reset Password</a>
          <p>This link expires in 15 minutes.</p>
        `;

        // Send email
        await sendEmail({
          to: email,
          subject: "EM Pharmaceutical - Reset Password",
          html,
        });

        res.json({ message: "Reset link sent to your email.", status: "success" });
      }
    );
  });
};

// -------------------- Reset Password --------------------
export const resetPassword = async (req, res) => {
  const { token, new_password, new_password_confirmation } = req.body;

  if (!token || !new_password || !new_password_confirmation)
    return res.status(400).json({ message: "All fields are required" });

  if (new_password !== new_password_confirmation)
    return res.status(400).json({ message: "Passwords do not match" });

  db.query(
    "SELECT id, reset_expires FROM users WHERE reset_token = ?",
    [token],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length)
        return res.status(400).json({ message: "Invalid or expired token" });

      const user = results[0];
      if (new Date() > new Date(user.reset_expires))
        return res.status(400).json({ message: "Token expired" });

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(new_password, salt);

      db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
        [hashed, user.id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({ message: "Password reset successful", status: "success" });
        }
      );
    }
  );
};
