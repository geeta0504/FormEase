import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import recoveryRoutes from "./routes/recoveryRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Add this block:
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/recovery", recoveryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/recovery", recoveryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);

// Serve frontend static assets if built (Production / Single Service)
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendDistPath, "index.html"));
  });
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});