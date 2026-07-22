import express from "express";
import { sendOTP, verifyOTP } from "../controller/authController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

router.get("/test-protected", protectStudent, (req, res) => {
  res.json({ message: "You are authenticated!", student: req.student });
});

export default router;