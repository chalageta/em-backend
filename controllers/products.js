import db from "../db.js";

// 🟢 Add Product
export const addProduct = (req, res) => {
  const { category, product_name, description, price, model, stock, status } = req.body;
  
  if (!category || !product_name ) {
    return res.status(400).json({ message: "Required fields missing ❌" });
  }

  // Save image path instead of just filename
  const image = req.file ? `/uploads/products/${req.file.filename}` : "";
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const query = `
    INSERT INTO products 
      (category, product_name, description, price, model, stock, images, date, status)
    VALUES (?, ?, ?, ?, ?,  ?, ?, ?, ?)
  `;
  const values = [category, product_name, description, price, model, stock, image, date, status || "active"];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT * FROM products WHERE id = ?", [result.insertId], (err2, results) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({
        message: "✅ Product added successfully",
        product: results[0],
      });
    });
  });
};



// 🟢 Get All Products (Latest First)
export const getProducts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count of products
  db.query("SELECT COUNT(*) AS total FROM products", (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countResult[0].total;

    // Fetch products sorted by latest (id DESC)
    db.query(
      "SELECT * FROM products ORDER BY date DESC LIMIT ? OFFSET ?",
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


// 🟢 Get Product By ID
export const getProductById = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
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
    const updatedImage = image || oldProduct.images;

    const query = `
      UPDATE products SET 
        category=?, product_name=?, description=?, price=?, model=?, stock=?, images=?, status=?
      WHERE id=?
    `;
    const values = [
      category || oldProduct.category,
      product_name || oldProduct.product_name,
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
  });
};


// 🟢 Delete Product
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
