import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/products.js";
import newsRoutes from "./routes/news.js";
import userRoutes from "./routes/users.js";
import contactRoutes from "./routes/contact.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (so images can be accessed by front-end)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/admin", userRoutes);
app.use("/api/contact", contactRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
