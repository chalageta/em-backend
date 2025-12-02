import db from "../db.js";

// Generate slug from name
const generateSlug = (name) =>
  name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Generate unique slug
const generateUniqueSlug = (name, callback, productId = null) => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  const checkSlug = () => {
    let query = "SELECT COUNT(*) AS count FROM products WHERE slug = ?";
    let values = [slug];
    if (productId) {
      // Exclude current product if updating
      query += " AND id != ?";
      values.push(productId);
    }

    db.query(query, values, (err, results) => {
      if (err) return callback(err, null);

      if (results[0].count > 0) {
        // Slug exists, append counter
        slug = `${baseSlug}-${counter++}`;
        checkSlug(); // recursive check
      } else {
        callback(null, slug); // unique slug found
      }
    });
  };

  checkSlug();
};


// 🟢 Add Product
export const addProduct = (req, res) => {
  const { category, product_name, description, price, model, stock, status } = req.body;
  if (!category || !product_name) {
    return res.status(400).json({ message: "Required fields missing ❌" });
  }

  const image = req.file ? `/uploads/products/${req.file.filename}` : "";
  const date = new Date().toISOString().split("T")[0];

  generateUniqueSlug(product_name, (err, slug) => {
    if (err) return res.status(500).json({ error: err.message });

    const query = `
      INSERT INTO products 
        (category, product_name, slug, description, price, model, stock, images, date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [category, product_name, slug, description, price, model, stock, image, date, status || "active"];

    db.query(query, values, (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.query("SELECT * FROM products WHERE id = ?", [result.insertId], (err3, results) => {
        if (err3) return res.status(500).json({ error: err3.message });

        res.status(201).json({
          message: "✅ Product added successfully",
          product: results[0],
        });
      });
    });
  });
};


// 🟢 Get All Products (with search & pagination)
export const getProducts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;

  // Check if user is logged in
  const isLoggedIn = !!req.user;
  const userRole = req.user?.role; // 'admin', 'sales', etc.

  let countQuery = "SELECT COUNT(*) AS total FROM products";
  let selectQuery = "SELECT * FROM products";
  let countValues = [];
  let selectValues = [];

  let whereClauses = [];

  // Only show active products to non-logged-in users
  if (!isLoggedIn || (userRole && !['admin','salesman'].includes(userRole))) {
    whereClauses.push("status = 'active'");
  }

  // Search filter
  if (search) {
    whereClauses.push("(product_name LIKE ? OR category LIKE ? OR description LIKE ? OR model LIKE ?)");
    countValues.push(search, search, search, search);
    selectValues.push(search, search, search, search);
  }

  // Combine WHERE clauses
  if (whereClauses.length) {
    const whereString = " WHERE " + whereClauses.join(" AND ");
    countQuery += whereString;
    selectQuery += whereString;
  }

  selectQuery += " ORDER BY date DESC LIMIT ? OFFSET ?";
  selectValues.push(limit, offset);

  db.query(countQuery, countValues, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countResult[0].total;

    db.query(selectQuery, selectValues, (err2, results) => {
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
    });
  });
};



// 🟢 Get Product By Slug
export const getProductBySlug = (req, res) => {
  const { slug } = req.params;

  const isLoggedIn = !!req.user;
  const userRole = req.user?.role;

  let query = "SELECT * FROM products WHERE slug = ?";
  const values = [slug];

  // Only show active product to non-logged-in users
  if (!isLoggedIn || (userRole && !['admin','salesman'].includes(userRole))) {
    query += " AND status = 'active'";
  }

  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: "Product not found ❌" });

    res.json(results[0]);
  });
};


// 🟢 Update Product
export const updateProduct = (req, res) => {
  const { id } = req.params;
  const { category, product_name, description, price, model, stock, status } = req.body;
  const image = req.file ? `/uploads/products/${req.file.filename}` : null;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: "Product not found ❌" });

    const oldProduct = results[0];
    const updatedName = product_name || oldProduct.product_name;
    const updatedImage = image || oldProduct.images;

    generateUniqueSlug(updatedName, (err, slug) => {
      if (err) return res.status(500).json({ error: err.message });

      const query = `
        UPDATE products SET 
          category=?, product_name=?, slug=?, description=?, price=?, model=?, stock=?, images=?, status=?
        WHERE id=?
      `;
      const values = [
        category || oldProduct.category,
        updatedName,
        slug,
        description || oldProduct.description,
        price || oldProduct.price,
        model || oldProduct.model,
        stock || oldProduct.stock,
        updatedImage,
        status || oldProduct.status,
        id
      ];

      db.query(query, values, (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        db.query("SELECT * FROM products WHERE id = ?", [id], (err3, updatedResults) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({
            message: "✅ Product updated successfully",
            product: updatedResults[0],
          });
        });
      });
    }, id); // pass id to exclude current product
  });
};


// 🗑️ Delete Product
export const deleteProduct = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: `❌ Product with ID ${id} not found` });

    const deletedProduct = results[0];

    db.query("DELETE FROM products WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        message: `🗑️ Product "${deletedProduct.product_name}" deleted successfully`,
        deleted: deletedProduct,
      });
    });
  });
};
