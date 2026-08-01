import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount = null;

// Option 1: Direct Environment Variables (Easiest & 100% failproof - no JSON parsing needed)
if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "formease-5d57d",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

// Option 2: FIREBASE_SERVICE_ACCOUNT (JSON or Base64 String)
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

  // Try decoding Base64 if not starting with '{'
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
      // Fix unescaped control characters & raw newlines
      const sanitized = raw
        .replace(/[\u0000-\u001F]+/g, (match) => (match === "\n" ? "\\n" : match === "\r" ? "\\r" : match === "\t" ? "\\t" : ""))
        .replace(/\r?\n/g, "\\n");
      serviceAccount = JSON.parse(sanitized);
    } catch (err2) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", err2.message);
    }
  }
}

// Option 3: Local File Path
if (!serviceAccount) {
  const possiblePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(__dirname, "../../firebase-service-account.json"),
    path.resolve(process.cwd(), "firebase-service-account.json"),
    path.resolve(process.cwd(), "backend/firebase-service-account.json"),
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(p, "utf-8"));
        break;
      } catch (err) {
        console.error(`Error reading ${p}:`, err.message);
      }
    }
  }
}

if (!serviceAccount) {
  console.error("❌ CRITICAL ERROR: Firebase Service Account credentials not found!");
  console.error("Set 'FIREBASE_CLIENT_EMAIL' and 'FIREBASE_PRIVATE_KEY' in Render environment variables.");
  throw new Error("Firebase Service Account credentials missing.");
}

if (serviceAccount.private_key && typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;