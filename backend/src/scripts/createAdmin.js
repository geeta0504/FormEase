import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const username = "admin"; // change if you want a different username
  const plainPassword = "admin123"; // CHANGE THIS to something secure

  const existing = await Admin.findOne({ username });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  await Admin.create({ username, passwordHash });

  console.log(`Admin created: username="${username}", password="${plainPassword}"`);
  process.exit(0);
}

run();