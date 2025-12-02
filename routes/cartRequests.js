import express from "express";
import {
  createCartRequest,
  getAllCartRequests,
  updateCartRequestStatus,
  deleteCartRequest
} from "../controllers/cartRequests.js";

import { protect, admin, adminOrSalesman } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public guest can submit
router.post("/", createCartRequest);

// Admin + Salesman can view requests
router.get("/", protect, adminOrSalesman, getAllCartRequests);

// Admin + Salesman can update status
router.patch("/:id/status", protect, adminOrSalesman, updateCartRequestStatus);

// Only Admin can delete request
router.delete("/:id", protect, admin, deleteCartRequest);

export default router;
