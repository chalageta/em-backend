import express from "express";
import {
  getAllUsers,
  getUserById,
  registerUser,
  updateUser,
  deleteUser,
} from "../controllers/users.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin-only routes
router.get("/users", protect, admin, getAllUsers);            // GET all users
router.get("/users/:user_id", protect, admin, getUserById);   // GET single user
router.post("/users", protect, admin, registerUser);          // CREATE user
router.put("/users/:user_id", protect, admin, updateUser);    // UPDATE user
router.delete("/users/:user_id", protect, admin, deleteUser); // DELETE user

export default router;
