import db from "../db.js";

// Add Product
export const addProduct = (req, res) => {
  const { category_id, product_name, slug, description, price, model, status } = req.body;
  if (!category_id || !product_name || !slug || !price || !model)
    return res.status(400).json({ message: "Required fields missing" });

  const image = req.file ? req.file.filename : ""; // multer saves file info in req.file
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  db.query(
    `INSERT INTO products (category_id, product_name, slug, description, price, model, images, date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, product_name, slug, description, price, model, image, date, status || "active"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Return inserted product
      db.query("SELECT * FROM products WHERE id = ?", [result.insertId], (err2, results) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({
          message: "Product added successfully ✅",
          product: results[0],
        });
      });
    }
  );
};



// Get all Products
export const getProducts = (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Get Product by ID
export const getProductById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: "Product not found" });
    res.json(results[0]);
  });
};
export const updateProduct = (req, res) => {
  const { id } = req.params;
  const { category_id, product_name, slug, description, price, model, status } = req.body;
  const image = req.file ? req.file.filename : null; // new image file if uploaded

  // Get existing product first
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: "Product not found" });

    const oldProduct = results[0];
    const updatedImage = image || oldProduct.images;

    // Update product
    db.query(
      `UPDATE products SET category_id=?, product_name=?, slug=?, description=?, price=?, model=?, images=?, status=? WHERE id=?`,
      [category_id, product_name, slug, description, price, model, updatedImage, status, id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Return updated product
        db.query("SELECT * FROM products WHERE id = ?", [id], (err3, updatedResults) => {
          if (err3) return res.status(500).json({ error: err3.message });

          res.json({
            message: "Product updated successfully ✅",
            product: updatedResults[0],
          });
        });
      }
    );
  });
};


// Delete Product
export const deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product deleted successfully" });
  });
};
