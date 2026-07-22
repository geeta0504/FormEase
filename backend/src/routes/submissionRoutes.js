import express from "express";
import { getMySubmission, createSubmission, updateSubmission, downloadMyPdf } from "../controller/submissionController.js";
import { protectStudent } from "../middleware/authMiddleware.js";
import { uploadSignatures } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/me", protectStudent, getMySubmission);
router.post("/", protectStudent, uploadSignatures, createSubmission);
router.put("/", protectStudent, uploadSignatures, updateSubmission);
router.get("/:versionLabel/pdf", protectStudent, downloadMyPdf);

export default router;