import db from "../db.js";

// Utility: Generate slug from title
const generateSlug = (title) =>
  title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/-+/g, "-"); // remove multiple -

// 📰 Add News
export const addNews = (req, res) => {
  const { title, details, author, status, views } = req.body;
  const image = req.file ? `/uploads/news/${req.file.filename}` : "";

  if (!title || !details || !author) {
    return res.status(400).json({
      success: false,
      message: "Title, details, and author are required",
    });
  }

  const slug = generateSlug(title);
  const date = new Date().toISOString().split("T")[0];

  const sql = `
    INSERT INTO news 
    (title, slug, details, author, date, status, views, image) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, slug, details, author, date, status || "published", views || 0, image],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      db.query(
        "SELECT * FROM news WHERE id = ?",
        [result.insertId],
        (err2, results) => {
          if (err2) return res.status(500).json({ success: false, message: err2.message });

          res.status(201).json({
            success: true,
            message: "News added successfully",
            data: results[0],
          });
        }
      );
    }
  );
};

export const getAllNews = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  const whereClause = `WHERE title LIKE ? OR details LIKE ? OR author LIKE ?`;
  const params = [`%${search}%`, `%${search}%`, `%${search}%`];

  const countSql = `SELECT COUNT(*) AS total FROM news ${whereClause}`;
  db.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const total = countResult[0].total;

    const dataSql = `
      SELECT *
      FROM news
      ${whereClause}
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];

    db.query(dataSql, dataParams, (err2, results) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message });

      res.json({
        success: true,
        message: "News retrieved successfully",
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

export const getPublicNews = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  const whereClause = `WHERE (title LIKE ? OR details LIKE ? OR author LIKE ?) AND status = 'published'`;
  const params = [`%${search}%`, `%${search}%`, `%${search}%`];

  const countSql = `SELECT COUNT(*) AS total FROM news ${whereClause}`;
  db.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const total = countResult[0].total;

    const dataSql = `
      SELECT *
      FROM news
      ${whereClause}
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];

    db.query(dataSql, dataParams, (err2, results) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message });

      res.json({
        success: true,
        message: "News retrieved successfully",
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

// Get single news by slug
export const getNewsBySlug = (req, res) => {
  const { slug } = req.params;
  db.query("SELECT * FROM news WHERE slug = ?", [slug], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "News not found" });

    res.json({
      success: true,
      message: "News retrieved successfully",
      data: results[0],
    });
  });
};

// ✏️ Update News
export const updateNews = (req, res) => {
  const { id } = req.params;
  const { title, details, author, status, views } = req.body;
  const newImage = req.file ? `/uploads/news/${req.file.filename}` : null;

  db.query("SELECT * FROM news WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "News not found" });

    const current = results[0];
    const updatedTitle = title || current.title;
    const slug = generateSlug(updatedTitle);

    const updatedNews = {
      title: updatedTitle,
      slug,
      details: details || current.details,
      author: author || current.author,
      image: newImage || current.image,
      status: status || current.status,
      views: views != null ? views : current.views,
      date: new Date().toISOString().split("T")[0],
    };

    const sql = `
      UPDATE news SET title=?, slug=?, details=?, author=?, image=?, status=?, views=?, date=?
      WHERE id=?
    `;
    db.query(
      sql,
      [
        updatedNews.title,
        updatedNews.slug,
        updatedNews.details,
        updatedNews.author,
        updatedNews.image,
        updatedNews.status,
        updatedNews.views,
        updatedNews.date,
        id,
      ],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message });

        db.query("SELECT * FROM news WHERE id = ?", [id], (err3, rows) => {
          if (err3) return res.status(500).json({ success: false, message: err3.message });
          res.json({
            success: true,
            message: "News updated successfully",
            data: rows[0],
          });
        });
      }
    );
  });
};

// ❌ Delete News
export const deleteNews = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM news WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "News not found" });

    db.query("DELETE FROM news WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message });
      res.json({
        success: true,
        message: "News deleted successfully",
        data: results[0],
      });
    });
  });
};
