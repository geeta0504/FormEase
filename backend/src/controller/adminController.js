import Admin from "../models/Admin.js";
import Submission from "../models/Submission.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/admin/login
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error in adminLogin:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/submissions?phone=&name=
export const getAllSubmissions = async (req, res) => {
  try {
    const { phone, name, rollNumber, branch, semester } = req.query;

    const filter = {};
    if (phone) {
      filter.studentPhone = { $regex: phone, $options: "i" };
    }

    let submissions = await Submission.find(filter).sort({ createdAt: -1 });

    // these filters search inside the latest version's data, so we filter in JS after fetching
    submissions = submissions.filter((s) => {
      const latest = s.versions[s.versions.length - 1];
      const d = latest?.data || {};

      if (name && !d.studentName?.toLowerCase().includes(name.toLowerCase())) return false;
      if (rollNumber && !d.rollNumber?.toLowerCase().includes(rollNumber.toLowerCase())) return false;
      if (branch && !d.branch?.toLowerCase().includes(branch.toLowerCase())) return false;
      if (semester && !d.semester?.toLowerCase().includes(semester.toLowerCase())) return false;

      return true;
    });

    res.status(200).json({ count: submissions.length, submissions });
  } catch (error) {
    console.error("Error in getAllSubmissions:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/submissions/:studentPhone/:versionLabel/pdf
export const downloadSubmissionPdf = async (req, res) => {
  try {
    const { studentPhone, versionLabel } = req.params;

    const submission = await Submission.findOne({ studentPhone: decodeURIComponent(studentPhone) });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const version = submission.versions.find((v) => v.versionLabel === versionLabel);

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    const safeName = (version.data.studentName || "student").replace(/\s+/g, "_");
    const downloadName = `${safeName}_${versionLabel}.pdf`;

    res.download(version.pdfPath, downloadName);
  } catch (error) {
    console.error("Error in downloadSubmissionPdf:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};