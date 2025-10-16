import express from "express";

const router = express.Router();

// Example route (you’ll add real logic later)
router.get("/", (req, res) => {
  res.json({ message: "News endpoint working ✅" });
});

export default router;
