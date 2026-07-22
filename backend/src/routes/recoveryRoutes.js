import express from "express";
import {
  sendAnchorOtp, verifyAnchorOtp, sendNewNumberOtp, verifyNewNumberOtp,
} from "../controller/recoveryController.js";

const router = express.Router();

router.post("/send-anchor-otp", sendAnchorOtp);
router.post("/verify-anchor-otp", verifyAnchorOtp);
router.post("/send-new-otp", sendNewNumberOtp);
router.post("/verify-new-otp", verifyNewNumberOtp);

export default router;