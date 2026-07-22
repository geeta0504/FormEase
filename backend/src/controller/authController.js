import { redis, ratelimit } from "../config/upstash.js";
import Submission from "../models/Submission.js";
import jwt from "jsonwebtoken";
import { normalizePhone } from "../utils/phoneUtils.js";

// generates a random 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendOTP = async (req, res) => {
  try {
    let { studentPhone, parentPhone } = req.body;

    if (!studentPhone || !parentPhone) {
      return res.status(400).json({ message: "Both phone numbers are required" });
    }

    studentPhone = normalizePhone(studentPhone);
    parentPhone = normalizePhone(parentPhone);

    if (!studentPhone || !parentPhone) {
      return res.status(400).json({ message: "One or both phone numbers are invalid" });
    }

    // rate limit per studentPhone (acts as the identity key for this login attempt)
    const { success } = await ratelimit.limit(studentPhone);
    if (!success) {
      return res.status(429).json({ message: "Too many OTP requests. Try again later." });
    }

    const studentOtp = generateOTP();
    const parentOtp = generateOTP();

    // store both OTPs separately, each auto-expires in 5 minutes
    await redis.set(`otp:student:${studentPhone}`, studentOtp, { ex: 300 });
    await redis.set(`otp:parent:${studentPhone}`, parentOtp, { ex: 300 });

    // also store parentPhone itself so verify step can retrieve it
    await redis.set(`parentPhone:${studentPhone}`, parentPhone, { ex: 300 });

    // TODO: replace these with real SMS provider calls later
    console.log(`Student OTP for ${studentPhone}: ${studentOtp}`);
    console.log(`Parent OTP for ${parentPhone}: ${parentOtp}`);

    res.status(200).json({ message: "OTPs sent to both numbers" });
  } catch (error) {
    console.error("Error in sendOTP:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    let { studentPhone, studentOtp, parentOtp } = req.body;

    if (!studentPhone || !studentOtp || !parentOtp) {
      return res.status(400).json({ message: "studentPhone, studentOtp, and parentOtp are all required" });
    }

    studentPhone = normalizePhone(studentPhone);

    if (!studentPhone) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const storedStudentOtp = await redis.get(`otp:student:${studentPhone}`);
    const storedParentOtp = await redis.get(`otp:parent:${studentPhone}`);
    const parentPhone = await redis.get(`parentPhone:${studentPhone}`);

    if (!storedStudentOtp || !storedParentOtp) {
      return res.status(400).json({ message: "OTP expired or not found. Please request new OTPs." });
    }

    const studentMatch = String(storedStudentOtp) === String(studentOtp);
    const parentMatch = String(storedParentOtp) === String(parentOtp);

    if (!studentMatch && !parentMatch) {
      return res.status(400).json({ message: "Both OTPs are incorrect" });
    }
    if (!studentMatch) {
      return res.status(400).json({ message: "Student OTP is incorrect" });
    }
    if (!parentMatch) {
      return res.status(400).json({ message: "Parent OTP is incorrect" });
    }

    // both verified — clean up so codes can't be reused
    await redis.del(`otp:student:${studentPhone}`);
    await redis.del(`otp:parent:${studentPhone}`);
    await redis.del(`parentPhone:${studentPhone}`);

    const existingSubmission = await Submission.findOne({ studentPhone });

    const token = jwt.sign(
      { studentPhone, parentPhone },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Both OTPs verified",
      token,
      isNewJoinee: !existingSubmission,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};