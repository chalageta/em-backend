import db from "../db.js"; // your MySQL connection

// Add a new contact message
export const addContact = (req, res) => {
  const { name, email, company, phone, subject, message, newsletter } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Required fields missing ❌" });
  }

  const query = `
    INSERT INTO contact 
      (name, email, company, phone, subject, message, newsletter)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [name, email, company || null, phone || null, subject, message, newsletter ? 1 : 0];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT * FROM contact WHERE id = ?", [result.insertId], (err2, results) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.status(201).json({
        message: "✅ Contact message sent successfully",
        contact: results[0],
      });
    });
  });
};

// Get all contact messages with pagination
export const getContacts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.query("SELECT COUNT(*) AS total FROM contact", (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countResult[0].total;

    db.query(
      "SELECT * FROM contact ORDER BY date_created DESC LIMIT ? OFFSET ?",
      [limit, offset],
      (err2, results) => {
        if (err2) return res.status(500).json({ error: err2.message });

        res.json({
          data: results,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        });
      }
    );
  });
};

// Get single contact by ID
export const getContact = (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM contact WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: "Contact not found" });
    res.json(results[0]);
  });
};

// Delete contact message
export const deleteContact = (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM contact WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Contact not found" });
    res.json({ message: "✅ Contact deleted successfully" });
  });
};
