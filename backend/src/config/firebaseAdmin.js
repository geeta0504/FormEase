import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

  // If base64 encoded string, decode it first
  if (!raw.startsWith("{")) {
    try {
      raw = Buffer.from(raw, "base64").toString("utf-8").trim();
    } catch (e) {
      console.error("Failed to decode base64 FIREBASE_SERVICE_ACCOUNT:", e.message);
    }
  }

  try {
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    try {
      // Fix unescaped newlines that break JSON parsing when pasted into web forms
      const sanitized = raw.replace(/\r?\n/g, "\\n");
      serviceAccount = JSON.parse(sanitized);
    } catch (err2) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", err.message);
    }
  }
}

if (!serviceAccount) {
  const possiblePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(__dirname, "../../firebase-service-account.json"),
    path.resolve(process.cwd(), "firebase-service-account.json"),
    path.resolve(process.cwd(), "backend/firebase-service-account.json"),
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serviceAccount = JSON.parse(fs.readFileSync(p, "utf-8"));
      break;
    }
  }
}

if (!serviceAccount) {
  console.error("❌ CRITICAL ERROR: Firebase Service Account credentials not found!");
  console.error("Please add 'FIREBASE_SERVICE_ACCOUNT' as an Environment Variable in Render dashboard.");
  throw new Error("Firebase Service Account credentials missing in environment variables.");
}

if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;