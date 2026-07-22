import { redis } from "../config/upstash.js";
import Submission from "../models/Submission.js";
import { normalizePhone } from "../utils/phoneUtils.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// STEP 1: send OTP to the still-working ("anchor") number
export const sendAnchorOtp = async (req, res) => {
  try {
    let { anchorType, anchorPhone } = req.body; // anchorType: "student" | "parent"
    if (!anchorType || !anchorPhone) {
      return res.status(400).json({ message: "anchorType and anchorPhone are required" });
    }

    anchorPhone = normalizePhone(anchorPhone);
    if (!anchorPhone) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const filter = anchorType === "student" ? { studentPhone: anchorPhone } : { parentPhone: anchorPhone };
    const submission = await Submission.findOne(filter);

    if (!submission) {
      return res.status(404).json({ message: "No record found for that phone number" });
    }

    const otp = generateOTP();
    await redis.set(`recovery:anchorOtp:${anchorPhone}`, otp, { ex: 300 });
    await redis.set(`recovery:anchorType:${anchorPhone}`, anchorType, { ex: 300 });

    console.log(`Recovery anchor OTP for ${anchorPhone}: ${otp}`);
    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.error("Error in sendAnchorOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// STEP 2: verify anchor OTP, unlock the "enter new number" step
export const verifyAnchorOtp = async (req, res) => {
  try {
    let { anchorPhone, otp } = req.body;
    anchorPhone = normalizePhone(anchorPhone);
    if (!anchorPhone || !otp) {
      return res.status(400).json({ message: "anchorPhone and otp are required" });
    }

    const storedOtp = await redis.get(`recovery:anchorOtp:${anchorPhone}`);
    if (!storedOtp || String(storedOtp) !== String(otp)) {
      return res.status(400).json({ message: "Incorrect or expired OTP" });
    }

    await redis.del(`recovery:anchorOtp:${anchorPhone}`);
    // mark this anchor as verified for the next 10 minutes
    await redis.set(`recovery:verified:${anchorPhone}`, "true", { ex: 600 });

    res.status(200).json({ message: "Anchor verified, you may now enter the new number" });
  } catch (error) {
    console.error("Error in verifyAnchorOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// STEP 3: send OTP to the NEW number
export const sendNewNumberOtp = async (req, res) => {
  try {
    let { anchorPhone, newPhone } = req.body;
    anchorPhone = normalizePhone(anchorPhone);
    const normalizedNew = normalizePhone(newPhone);

    if (!anchorPhone || !normalizedNew) {
      return res.status(400).json({ message: "anchorPhone and newPhone are required" });
    }

    const verified = await redis.get(`recovery:verified:${anchorPhone}`);
    if (!verified) {
      return res.status(400).json({ message: "Please verify your current number first" });
    }

    const anchorType = await redis.get(`recovery:anchorType:${anchorPhone}`);

    // only studentPhone must stay globally unique — parentPhone can be shared across siblings
    if (anchorType === "parent") {
      // anchor is parent's number -> the new number becomes the STUDENT's number -> must be unique
      const clash = await Submission.findOne({ studentPhone: normalizedNew });
      if (clash) {
        return res.status(409).json({ message: "That phone number is already registered as a student's number" });
      }
    }
    // if anchorType === "student" -> new number becomes the PARENT's number -> no uniqueness check needed

    const otp = generateOTP();
    await redis.set(`recovery:newOtp:${anchorPhone}`, otp, { ex: 300 });
    await redis.set(`recovery:newPhone:${anchorPhone}`, normalizedNew, { ex: 300 });

    console.log(`Recovery new-number OTP for ${normalizedNew}: ${otp}`);
    res.status(200).json({ message: "OTP sent to new number" });
  } catch (error) {
    console.error("Error in sendNewNumberOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// STEP 4: verify new number OTP, update the record, log the student in
export const verifyNewNumberOtp = async (req, res) => {
  try {
    let { anchorPhone, otp } = req.body;
    anchorPhone = normalizePhone(anchorPhone);
    if (!anchorPhone || !otp) {
      return res.status(400).json({ message: "anchorPhone and otp are required" });
    }

    const storedOtp = await redis.get(`recovery:newOtp:${anchorPhone}`);
    if (!storedOtp || String(storedOtp) !== String(otp)) {
      return res.status(400).json({ message: "Incorrect or expired OTP" });
    }

    const anchorType = await redis.get(`recovery:anchorType:${anchorPhone}`);
    const newPhone = await redis.get(`recovery:newPhone:${anchorPhone}`);

    const filter = anchorType === "student" ? { studentPhone: anchorPhone } : { parentPhone: anchorPhone };
    const submission = await Submission.findOne(filter);

    if (!submission) {
      return res.status(404).json({ message: "Record no longer found" });
    }

    let finalStudentPhone = submission.studentPhone;

    if (anchorType === "student") {
      // student's own number still works -> parent's number changed
      submission.parentPhone = newPhone;
    } else {
      // parent's number still works -> student's number changed (primary key!)
      const oldDir = path.join("uploads", "pdfs", submission.studentPhone);
      const newDir = path.join("uploads", "pdfs", newPhone);
      if (fs.existsSync(oldDir)) fs.renameSync(oldDir, newDir);

      submission.versions.forEach((v) => {
        v.pdfPath = v.pdfPath.replace(submission.studentPhone, newPhone);
      });
      submission.studentPhone = newPhone;
      finalStudentPhone = newPhone;
    }

    await submission.save();

    // clean up all recovery redis keys
    await redis.del(`recovery:verified:${anchorPhone}`);
    await redis.del(`recovery:newOtp:${anchorPhone}`);
    await redis.del(`recovery:newPhone:${anchorPhone}`);
    await redis.del(`recovery:anchorType:${anchorPhone}`);

    const token = jwt.sign(
      { studentPhone: finalStudentPhone, parentPhone: submission.parentPhone },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Number updated, login successful", token, isNewJoinee: false });
  } catch (error) {
    console.error("Error in verifyNewNumberOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};