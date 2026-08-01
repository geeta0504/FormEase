import Submission from "../models/Submission.js";
import { generateSubmissionPdf } from "../utils/pdfGenerator.js";
import fs from "fs";
import path from "path";
import { uppercaseFields } from "../utils/textUtils.js";
import { emailToPathSlug } from "../utils/emailUtils.js";
import { normalizePhone } from "../utils/phoneUtils.js";


export const getMySubmission = async (req, res) => {
  try {
    const { studentEmail } = req.student;
    const submission = await Submission.findOne({ studentEmail });

    if (!submission) {
      return res.status(200).json({ isNewJoinee: true, submission: null });
    }

    res.status(200).json({ isNewJoinee: false, submission });
  } catch (error) {
    console.error("Error in getMySubmission:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createSubmission = async (req, res) => {
  try {
    const { studentEmail, parentEmail } = req.student;

    const existing = await Submission.findOne({ studentEmail });
    if (existing) {
      return res.status(409).json({
        message: "A submission already exists for this email. Use the update/correction flow instead.",
      });
    }

    const {
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber, studentMobile, parentName,
      parentAddressLine1, parentAddressLine2, parentMobile,
    } = req.body;

    if (!studentName || !rollNumber || !studentMobile || !parentMobile) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const normalizedStudentMobile = normalizePhone(studentMobile);
    const normalizedParentMobile = normalizePhone(parentMobile);

    if (!normalizedStudentMobile) {
      return res.status(400).json({ message: "Student mobile number is invalid" });
    }
    if (!normalizedParentMobile) {
      return res.status(400).json({ message: "Parent mobile number is invalid" });
    }

    const studentSignatureFile = req.files?.studentSignature?.[0];
    const parentSignatureFile = req.files?.parentSignature?.[0];

    if (!studentSignatureFile || !parentSignatureFile) {
      return res.status(400).json({ message: "Both student and parent signature images are required" });
    }

    const today = new Date().toLocaleDateString("en-GB");

    const data = uppercaseFields({
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber,
      studentMobile: normalizedStudentMobile,
      studentDate: today,
      parentName, parentAddressLine1, parentAddressLine2,
      parentMobile: normalizedParentMobile,
      parentDate: today,
    });
    const pdfBuffer = await generateSubmissionPdf(
      data,
      studentSignatureFile.buffer,
      parentSignatureFile.buffer
    );

    const emailSlug = emailToPathSlug(studentEmail);
    const studentDir = path.join("uploads", "pdfs", emailSlug);
    fs.mkdirSync(studentDir, { recursive: true });
    const pdfPath = path.join(studentDir, "name_declaration.pdf");
    fs.writeFileSync(pdfPath, pdfBuffer);

    const submission = await Submission.create({
      studentEmail,
      parentEmail,
      versions: [{ versionLabel: "original", data, pdfPath, submittedAt: new Date() }],
    });

    res.status(201).json({ message: "Submission created successfully", submission });
  } catch (error) {
    console.error("Error in createSubmission:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateSubmission = async (req, res) => {
  try {
    const { studentEmail } = req.student;

    const submission = await Submission.findOne({ studentEmail });

    if (!submission) {
      return res.status(404).json({ message: "No existing submission found. Use the new joinee flow instead." });
    }

    const {
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber, studentMobile, parentName,
      parentAddressLine1, parentAddressLine2, parentMobile,
    } = req.body;

    if (!studentName || !rollNumber || !studentMobile || !parentMobile) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const normalizedStudentMobile = normalizePhone(studentMobile);
    const normalizedParentMobile = normalizePhone(parentMobile);

    if (!normalizedStudentMobile) {
      return res.status(400).json({ message: "Student mobile number is invalid" });
    }
    if (!normalizedParentMobile) {
      return res.status(400).json({ message: "Parent mobile number is invalid" });
    }

    const studentSignatureFile = req.files?.studentSignature?.[0];
    const parentSignatureFile = req.files?.parentSignature?.[0];

    if (!studentSignatureFile || !parentSignatureFile) {
      return res.status(400).json({ message: "Both student and parent signature images are required" });
    }

    const today = new Date().toLocaleDateString("en-GB");

    const data = uppercaseFields({
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber,
      studentMobile: normalizedStudentMobile,
      studentDate: today,
      parentName, parentAddressLine1, parentAddressLine2,
      parentMobile: normalizedParentMobile,
      parentDate: today,
    });

    const pdfBuffer = await generateSubmissionPdf(
      data,
      studentSignatureFile.buffer,
      parentSignatureFile.buffer
    );

    const versionNumber = submission.versions.length;
    const versionLabel = `update${versionNumber}`;

    const emailSlug = emailToPathSlug(studentEmail);
    const studentDir = path.join("uploads", "pdfs", emailSlug);
    fs.mkdirSync(studentDir, { recursive: true });
    const pdfPath = path.join(studentDir, `name_declaration_${versionLabel}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    submission.versions.push({ versionLabel, data, pdfPath, submittedAt: new Date() });
    await submission.save();

    res.status(200).json({ message: "Correction submitted successfully", submission });
  } catch (error) {
    console.error("Error in updateSubmission:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const downloadMyPdf = async (req, res) => {
  try {
    const { studentEmail } = req.student;
    const { versionLabel } = req.params;

    const submission = await Submission.findOne({ studentEmail });
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
    console.error("Error in downloadMyPdf:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
