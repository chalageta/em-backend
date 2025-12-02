import express from "express";
import {
  addContact,
  getContacts,
  getContact,
  deleteContact,
  markContactsRead
} from "../controllers/contact.js";

import { protect, adminOrSalesman } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.post("/", addContact);

// Admin + Salesman
router.get("/", protect, adminOrSalesman, getContacts);
router.get("/:id", protect, adminOrSalesman, getContact);
router.delete("/:id", protect, adminOrSalesman, deleteContact);
router.patch("/mark-read", protect, adminOrSalesman, markContactsRead);

export default router;
