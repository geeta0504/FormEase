import jwt from "jsonwebtoken";

export const protectStudent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.student = {
      studentEmail: decoded.studentEmail,
      parentEmail: decoded.parentEmail,
    };

    next();
  } catch (error) {
    console.error("Error in protectStudent middleware:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};


export const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.admin = { adminId: decoded.adminId };
    next();
  } catch (error) {
    console.error("Error in protectAdmin middleware:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
