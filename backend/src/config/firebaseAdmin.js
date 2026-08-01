import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : process.env.FIREBASE_SERVICE_ACCOUNT;
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
  serviceAccount = JSON.parse(
    fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf-8")
  );
} else {
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