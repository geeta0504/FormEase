import Submission from "../models/Submission.js";
import admin from "../config/firebaseAdmin.js";
import { normalizeEmail } from "../utils/emailUtils.js";
import jwt from "jsonwebtoken";

// Verify Google Sign-In ID token and issue app JWT
export const verifyGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // Verify the Firebase ID Token using Firebase Admin SDK
    const decoded = await admin.auth().verifyIdToken(idToken);
    const studentEmail = normalizeEmail(decoded.email);

    if (!studentEmail) {
      return res.status(400).json({ message: "Could not extract a valid email from Google account" });
    }

    const existingSubmission = await Submission.findOne({ studentEmail });

    const appToken = jwt.sign(
      { studentEmail },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Google sign-in verified",
      token: appToken,
      isNewJoinee: !existingSubmission,
    });
  } catch (error) {
    console.error("Error in verifyGoogle:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};