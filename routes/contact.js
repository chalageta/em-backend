import express from "express";
import { addContact, getContacts, getContact, deleteContact } from "../controllers/contact.js";

const router = express.Router();

router.post("/", addContact);
router.get("/", getContacts);
router.get("/:id", getContact);
router.delete("/:id", deleteContact);

export default router;
