import express from "express";
import {
  addNews,
  updateNews,
  deleteNews,
  getNewsBySlug,
  getAllNews,
  getPublicNews,
} from "../controllers/news.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { newsUpload } from "../middleware/uploadConfig.js"; 

const router = express.Router();

router.get("/", getPublicNews);          
router.get("/:slug", getNewsBySlug);      
router.get("/admin/all", protect, admin, getAllNews); 

router.post("/", protect, newsUpload.single("image"), addNews);
router.put("/:id", protect, newsUpload.single("image"), updateNews);
router.delete("/:id", protect, deleteNews);

export default router;
