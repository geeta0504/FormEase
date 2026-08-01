import express from "express";
import { startLogin, verifyLink } from "../controller/authController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start-login", startLogin);
router.post("/verify-link", verifyLink);

router.get("/test-protected", protectStudent, (req, res) => {
  res.json({ message: "You are authenticated!", student: req.student });
});

export default router;