import express from "express";
import { 
  addProduct, 
  updateProduct, 
  getProducts, 
  getProductById, 
  deleteProduct 
} from '../controllers/products.js';
import { productUpload } from "../middleware/createUploader.js"; // make sure folder is "middlewares"

const router = express.Router();

router.post("/", productUpload.single("images"), addProduct);
router.put("/:id", productUpload.single("images"), updateProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.delete("/:id", deleteProduct);

export default router;
