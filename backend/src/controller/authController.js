import { redis } from "../config/upstash.js";
import Submission from "../models/Submission.js";
import admin from "../config/firebaseAdmin.js";
import { normalizeEmail, sendVerificationLinkEmail } from "../utils/emailUtils.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// STEP 1: start login — generate Firebase Email Link for STUDENT
export const startLogin = async (req, res) => {
  try {
    let { studentEmail } = req.body;
    studentEmail = normalizeEmail(studentEmail);

    if (!studentEmail) {
      return res.status(400).json({ message: "Valid student email address is required" });
    }

    const sessionId = crypto.randomBytes(16).toString("hex");

    await redis.set(
      `loginSession:${sessionId}`,
      JSON.stringify({
        studentEmail,
        studentVerified: false,
      }),
      { ex: 900 }
    );

    const actionCodeSettings = {
      url: `${FRONTEND_URL}/verify-email?sessionId=${sessionId}&role=student`,
      handleCodeInApp: true,
    };

    // Generate Firebase Auth sign-in link
    const firebaseLink = await admin.auth().generateSignInWithEmailLink(studentEmail, actionCodeSettings);

    await sendVerificationLinkEmail(studentEmail, firebaseLink, "student");

    res.status(200).json({
      message: "Firebase verification link generated and sent to student email",
      sessionId,
      firebaseLink,
    });
  } catch (error) {
    console.error("Error in startLogin:", error.message);
    if (error.code === "auth/configuration-not-found") {
      return res.status(400).json({
        message: "Firebase Email Link authentication is not enabled in Firebase Console. Please enable 'Email link (passwordless sign-in)' under Authentication -> Sign-in method in Firebase Console.",
      });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// STEP 2: verify link with Firebase ID token
export const verifyLink = async (req, res) => {
  try {
    const { sessionId, role, idToken } = req.body;

    if (!sessionId || !role || !idToken) {
      return res.status(400).json({ message: "sessionId, role, and idToken are required" });
    }

    const raw = await redis.get(`loginSession:${sessionId}`);
    if (!raw) {
      return res.status(400).json({ message: "Session expired or invalid. Please start over." });
    }

    const session = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Verify the Firebase ID Token using Firebase Admin SDK
    const decoded = await admin.auth().verifyIdToken(idToken);
    const verifiedEmail = normalizeEmail(decoded.email);

    const expectedEmail = role === "student" ? session.studentEmail : session.parentEmail;
    if (verifiedEmail && verifiedEmail !== expectedEmail) {
      return res.status(400).json({ message: `Verified email (${verifiedEmail}) does not match expected address (${expectedEmail})` });
    }

    if (role === "student") {
      session.studentVerified = true;

      const existingSubmission = await Submission.findOne({ studentEmail: session.studentEmail });

      const appToken = jwt.sign(
        { studentEmail: session.studentEmail },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      await redis.del(`loginSession:${sessionId}`);

      return res.status(200).json({
        message: "Student verified via Firebase Auth",
        stage: "complete",
        token: appToken,
        isNewJoinee: !existingSubmission,
      });
    }

    return res.status(400).json({ message: "Invalid role" });
  } catch (error) {
    console.error("Error in verifyLink:", error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};