import express from "express";
import { addContact, getContacts, getContact, deleteContact } from "../controllers/contact.js";

const router = express.Router();

// Add a new contact
router.post("/", addContact);

// Get all contacts
router.get("/", getContacts);

// Get single contact by ID
router.get("/:id", getContact);

// Delete contact
router.delete("/:id", deleteContact);

export default router;
