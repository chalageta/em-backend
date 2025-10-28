import db from "../db.js";
import bcrypt from "bcryptjs";

// 🟢 Register New User (Admin only)
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "❌ Name, email, password, and role are required" });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(400).json({ message: "❌ Email already registered" });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const date = new Date().toISOString().split("T")[0];

      const query = `
        INSERT INTO users (name, email, password, role, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [name, email, hashed, role, date, "active"];

      db.query(query, values, (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });

        db.query("SELECT id, name, email, role, created_at, status FROM users WHERE id = ?", [result.insertId], (err3, newUser) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.status(201).json({
            message: "✅ User created successfully",
            user: newUser[0],
          });
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};



// 🟢 Get All Users (except Admin) with Pagination
export const getAllUsers = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  let where = "WHERE role != 'admin'";
  const params = [];

  if (search) {
    where += " AND (name LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  // Count total users
  db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countResult[0].total;

    // Fetch paginated users
    const query = `
      SELECT id, name, email, role, created_at, status 
      FROM users 
      ${where}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    db.query(query, [...params, limit, offset], (err2, results) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.status(200).json({
        data: results,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    });
  });
};



// 🟢 Get One User by ID
export const getUserById = (req, res) => {
  const { user_id } = req.params;

  db.query(
    "SELECT id, name, email, role, created_at, status FROM users WHERE id = ?",
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ message: "❌ User not found" });
      res.status(200).json(results[0]);
    }
  );
};



// 🟢 Update User
export const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { name, email, password, role, status } = req.body;

  const updates = [];
  const values = [];

  if (name) {
    updates.push("name = ?");
    values.push(name);
  }
  if (email) {
    updates.push("email = ?");
    values.push(email);
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    updates.push("password = ?");
    values.push(hashed);
  }
  if (role) {
    updates.push("role = ?");
    values.push(role);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "⚠️ No fields to update" });
  }

  values.push(user_id);
  const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "❌ User not found" });

    db.query(
      "SELECT id, name, email, role, created_at, status FROM users WHERE id = ?",
      [user_id],
      (err2, updated) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(200).json({
          message: "✅ User updated successfully",
          user: updated[0],
        });
      }
    );
  });
};



// 🟢 Delete User by ID
export const deleteUser = (req, res) => {
  const { user_id } = req.params;

  db.query("SELECT * FROM users WHERE id = ?", [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length)
      return res.status(404).json({ message: "❌ User not found" });

    const deletedUser = results[0];

    db.query("DELETE FROM users WHERE id = ?", [user_id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(200).json({
        message: `🗑️ User "${deletedUser.name}" deleted successfully`,
        deleted: deletedUser,
      });
    });
  });
};
