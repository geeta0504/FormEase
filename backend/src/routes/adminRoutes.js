import express from "express";
import { adminLogin, getAllSubmissions, downloadSubmissionPdf } from "../controller/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/submissions", protectAdmin, getAllSubmissions);
router.get("/submissions/:studentPhone/:versionLabel/pdf", protectAdmin, downloadSubmissionPdf);

export default router;