import express from "express";
import { addContact, getContacts, getContact, deleteContact, markContactsRead } from "../controllers/contact.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", addContact);
router.get("/", protect, getContacts); 
router.get("/:id", protect, getContact); 
router.delete("/:id", protect, deleteContact);
router.patch("/mark-read", protect, markContactsRead);
export default router;
