import express from "express";
import { registerUser, loginUser, logoutUser, getProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser); // /api/auth/register
router.post("/login", loginUser);       // /api/auth/login

// Protected routes
router.get("/me", protect, getProfile); // /api/auth/me
router.post("/logout", protect, logoutUser); // /api/auth/logout

export default router;
