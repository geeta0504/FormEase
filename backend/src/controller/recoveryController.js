import { redis } from "../config/upstash.js";
import Submission from "../models/Submission.js";
import { normalizeEmail, sendOtpEmail, emailToPathSlug } from "../utils/emailUtils.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendAnchorOtp = async (req, res) => {
  try {
    let { anchorType, anchorEmail } = req.body;
    if (!anchorType || !anchorEmail) {
      return res.status(400).json({ message: "anchorType and anchorEmail are required" });
    }

    anchorEmail = normalizeEmail(anchorEmail);
    if (!anchorEmail) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const filter = anchorType === "student" ? { studentEmail: anchorEmail } : { parentEmail: anchorEmail };
    const submission = await Submission.findOne(filter);

    if (!submission) {
      return res.status(404).json({ message: "No record found for that email address" });
    }

    const otp = generateOTP();
    await redis.set(`recovery:anchorOtp:${anchorEmail}`, otp, { ex: 300 });
    await redis.set(`recovery:anchorType:${anchorEmail}`, anchorType, { ex: 300 });

    await sendOtpEmail(anchorEmail, otp, anchorType);
    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.error("Error in sendAnchorOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyAnchorOtp = async (req, res) => {
  try {
    let { anchorEmail, otp } = req.body;
    anchorEmail = normalizeEmail(anchorEmail);
    if (!anchorEmail || !otp) {
      return res.status(400).json({ message: "anchorEmail and otp are required" });
    }

    const storedOtp = await redis.get(`recovery:anchorOtp:${anchorEmail}`);
    if (!storedOtp || String(storedOtp) !== String(otp)) {
      return res.status(400).json({ message: "Incorrect or expired OTP" });
    }

    await redis.del(`recovery:anchorOtp:${anchorEmail}`);
    await redis.set(`recovery:verified:${anchorEmail}`, "true", { ex: 600 });

    res.status(200).json({ message: "Anchor verified, you may now enter the new email address" });
  } catch (error) {
    console.error("Error in verifyAnchorOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendNewNumberOtp = async (req, res) => {
  try {
    let { anchorEmail, newEmail } = req.body;
    anchorEmail = normalizeEmail(anchorEmail);
    const normalizedNew = normalizeEmail(newEmail);

    if (!anchorEmail || !normalizedNew) {
      return res.status(400).json({ message: "anchorEmail and newEmail are required" });
    }

    const verified = await redis.get(`recovery:verified:${anchorEmail}`);
    if (!verified) {
      return res.status(400).json({ message: "Please verify your current email first" });
    }

    const anchorType = await redis.get(`recovery:anchorType:${anchorEmail}`);

    if (anchorType === "parent") {
      const clash = await Submission.findOne({ studentEmail: normalizedNew });
      if (clash) {
        return res.status(409).json({ message: "That email is already registered as a student's email" });
      }
    }

    const otp = generateOTP();
    await redis.set(`recovery:newOtp:${anchorEmail}`, otp, { ex: 300 });
    await redis.set(`recovery:newEmail:${anchorEmail}`, normalizedNew, { ex: 300 });

    await sendOtpEmail(normalizedNew, otp, "new email");
    res.status(200).json({ message: "OTP sent to new email address" });
  } catch (error) {
    console.error("Error in sendNewNumberOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyNewNumberOtp = async (req, res) => {
  try {
    let { anchorEmail, otp } = req.body;
    anchorEmail = normalizeEmail(anchorEmail);
    if (!anchorEmail || !otp) {
      return res.status(400).json({ message: "anchorEmail and otp are required" });
    }

    const storedOtp = await redis.get(`recovery:newOtp:${anchorEmail}`);
    if (!storedOtp || String(storedOtp) !== String(otp)) {
      return res.status(400).json({ message: "Incorrect or expired OTP" });
    }

    const anchorType = await redis.get(`recovery:anchorType:${anchorEmail}`);
    const newEmail = await redis.get(`recovery:newEmail:${anchorEmail}`);

    const filter = anchorType === "student" ? { studentEmail: anchorEmail } : { parentEmail: anchorEmail };
    const submission = await Submission.findOne(filter);

    if (!submission) {
      return res.status(404).json({ message: "Record no longer found" });
    }

    let finalStudentEmail = submission.studentEmail;

    if (anchorType === "student") {
      submission.parentEmail = newEmail;
    } else {
      const oldSlug = emailToPathSlug(submission.studentEmail);
      const newSlug = emailToPathSlug(newEmail);
      const oldDir = path.join("uploads", "pdfs", oldSlug);
      const newDir = path.join("uploads", "pdfs", newSlug);
      if (fs.existsSync(oldDir)) fs.renameSync(oldDir, newDir);

      submission.versions.forEach((v) => {
        v.pdfPath = v.pdfPath.replace(oldSlug, newSlug);
      });
      submission.studentEmail = newEmail;
      finalStudentEmail = newEmail;
    }

    await submission.save();

    await redis.del(`recovery:verified:${anchorEmail}`);
    await redis.del(`recovery:newOtp:${anchorEmail}`);
    await redis.del(`recovery:newEmail:${anchorEmail}`);
    await redis.del(`recovery:anchorType:${anchorEmail}`);

    const token = jwt.sign(
      { studentEmail: finalStudentEmail, parentEmail: submission.parentEmail },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Email updated, login successful", token, isNewJoinee: false });
  } catch (error) {
    console.error("Error in verifyNewNumberOtp:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
