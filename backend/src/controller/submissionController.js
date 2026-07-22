import Submission from "../models/Submission.js";
import { generateSubmissionPdf } from "../utils/pdfGenerator.js";
import fs from "fs";
import path from "path";
import { uppercaseFields } from "../utils/textUtils.js";

// GET /api/submissions/me  (already exists from Step 7)
export const getMySubmission = async (req, res) => {
  try {
    const { studentPhone } = req.student;
    const submission = await Submission.findOne({ studentPhone });

    if (!submission) {
      return res.status(200).json({ isNewJoinee: true, submission: null });
    }

    res.status(200).json({ isNewJoinee: false, submission });
  } catch (error) {
    console.error("Error in getMySubmission:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/submissions  (New Joinee form submit)
export const createSubmission = async (req, res) => {
  try {
    const { studentPhone, parentPhone } = req.student;

    const existing = await Submission.findOne({ studentPhone });
    if (existing) {
      return res.status(409).json({
        message: "A submission already exists for this phone number. Use the update/correction flow instead.",
      });
    }

    const {
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber, parentName, parentAddressLine1, parentAddressLine2,
    } = req.body;

    if (!studentName || !rollNumber) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const studentSignatureFile = req.files?.studentSignature?.[0];
    const parentSignatureFile = req.files?.parentSignature?.[0];

    if (!studentSignatureFile || !parentSignatureFile) {
      return res.status(400).json({ message: "Both student and parent signature images are required" });
    }

    const today = new Date().toLocaleDateString("en-GB"); // dd/mm/yyyy

    const data = uppercaseFields({
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber,
      studentMobile: studentPhone,
      studentDate: today,
      parentName, parentAddressLine1, parentAddressLine2,
      parentMobile: parentPhone,
      parentDate: today,
    });
    const pdfBuffer = await generateSubmissionPdf(
      data,
      studentSignatureFile.buffer,
      parentSignatureFile.buffer
    );

    const studentDir = path.join("uploads", "pdfs", studentPhone);
    fs.mkdirSync(studentDir, { recursive: true });
    const pdfPath = path.join(studentDir, "name_declaration.pdf");
    fs.writeFileSync(pdfPath, pdfBuffer);

    const submission = await Submission.create({
      studentPhone,
      parentPhone,
      versions: [{ versionLabel: "original", data, pdfPath, submittedAt: new Date() }],
    });

    res.status(201).json({ message: "Submission created successfully", submission });
  } catch (error) {
    console.error("Error in createSubmission:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


// PUT /api/submissions  (Update/Correction — creates a new version)
export const updateSubmission = async (req, res) => {
  try {
    const { studentPhone, parentPhone } = req.student;

    const submission = await Submission.findOne({ studentPhone });

    if (!submission) {
      return res.status(404).json({ message: "No existing submission found. Use the new joinee flow instead." });
    }

    const {
      studentName, degree, branch, rollNumber, semester,
      hostel, roomNumber, parentName, parentAddressLine1, parentAddressLine2,
    } = req.body;

    if (!studentName || !rollNumber) {
      return res.status(400).json({ message: "Required fields are missing" });
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
      studentMobile: studentPhone,
      studentDate: today,
      parentName, parentAddressLine1, parentAddressLine2,
      parentMobile: parentPhone,
      parentDate: today,
    });

    const pdfBuffer = await generateSubmissionPdf(
      data,
      studentSignatureFile.buffer,
      parentSignatureFile.buffer
    );

    const versionNumber = submission.versions.length;
    const versionLabel = `update${versionNumber}`;

    const studentDir = path.join("uploads", "pdfs", studentPhone);
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

// GET /api/submissions/:versionLabel/pdf
export const downloadMyPdf = async (req, res) => {
  try {
    const { studentPhone } = req.student;
    const { versionLabel } = req.params;

    const submission = await Submission.findOne({ studentPhone });
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