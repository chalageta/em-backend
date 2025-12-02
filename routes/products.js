import express from "express";
import { 
  addProduct, 
  updateProduct, 
  getProducts, 
  getProductBySlug, 
  deleteProduct 
} from "../controllers/products.js";
import { productUpload } from "../middleware/createUploader.js";
import { protect, admin, adminOrSalesman, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin/Salesman routes
router.post("/", protect, adminOrSalesman, productUpload.single("images"), addProduct);
router.put("/:id", protect, adminOrSalesman, productUpload.single("images"), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

// Public routes (guests or logged-in users)
router.get("/", optionalProtect, getProducts);
router.get("/:slug", optionalProtect, getProductBySlug);

export default router;
