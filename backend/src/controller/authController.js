import { redis, ratelimit } from "../config/upstash.js";
import Submission from "../models/Submission.js";
import jwt from "jsonwebtoken";
import { normalizeEmail, sendOtpEmail } from "../utils/emailUtils.js";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendOTP = async (req, res) => {
  try {
    let { studentEmail, parentEmail } = req.body;

    if (!studentEmail || !parentEmail) {
      return res.status(400).json({ message: "Both email addresses are required" });
    }

    studentEmail = normalizeEmail(studentEmail);
    parentEmail = normalizeEmail(parentEmail);

    if (!studentEmail || !parentEmail) {
      return res.status(400).json({ message: "One or both email addresses are invalid" });
    }

    const { success } = await ratelimit.limit(studentEmail);
    if (!success) {
      return res.status(429).json({ message: "Too many OTP requests. Try again later." });
    }

    const studentOtp = generateOTP();
    const parentOtp = generateOTP();

    await redis.set(`otp:student:${studentEmail}`, studentOtp, { ex: 300 });
    await redis.set(`otp:parent:${studentEmail}`, parentOtp, { ex: 300 });
    await redis.set(`parentEmail:${studentEmail}`, parentEmail, { ex: 300 });

    await sendOtpEmail(studentEmail, studentOtp, "student");
    await sendOtpEmail(parentEmail, parentOtp, "parent");

    res.status(200).json({ message: "OTPs sent to both email addresses" });
  } catch (error) {
    console.error("Error in sendOTP:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    let { studentEmail, studentOtp, parentOtp } = req.body;

    if (!studentEmail || !studentOtp || !parentOtp) {
      return res.status(400).json({ message: "studentEmail, studentOtp, and parentOtp are all required" });
    }

    studentEmail = normalizeEmail(studentEmail);

    if (!studentEmail) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const storedStudentOtp = await redis.get(`otp:student:${studentEmail}`);
    const storedParentOtp = await redis.get(`otp:parent:${studentEmail}`);
    const parentEmail = await redis.get(`parentEmail:${studentEmail}`);

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

    await redis.del(`otp:student:${studentEmail}`);
    await redis.del(`otp:parent:${studentEmail}`);
    await redis.del(`parentEmail:${studentEmail}`);

    const existingSubmission = await Submission.findOne({ studentEmail });

    const token = jwt.sign(
      { studentEmail, parentEmail },
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
