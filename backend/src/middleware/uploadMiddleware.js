import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG or JPEG images are allowed for signature"), false);
  }
};

export const uploadSignatures = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max per file
}).fields([
  { name: "studentSignature", maxCount: 1 },
  { name: "parentSignature", maxCount: 1 },
]);