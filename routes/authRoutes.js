import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protect, getProfile);
router.post("/logout", protect, logoutUser);
router.post("/change-password", protect, changePassword);

export default router;
