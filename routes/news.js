import express from "express";
import {
  addNews,
  getNews,
  updateNews,
  deleteNews,
  getNewsBySlug, // only import existing functions
} from "../controllers/news.js";
import { protect } from "../middleware/authMiddleware.js";
import { newsUpload } from "../middleware/uploadConfig.js"; // multer config for image upload

const router = express.Router();

// Public routes
router.get("/", getNews);
router.get("/:slug", getNewsBySlug); // fetch by slug only

// Protected routes (require login)
router.post("/", protect, newsUpload.single("image"), addNews);
router.put("/:id", protect, newsUpload.single("image"), updateNews);
router.delete("/:id", protect, deleteNews);

export default router;
