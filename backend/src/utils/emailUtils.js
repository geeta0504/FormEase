import nodemailer from "nodemailer";

/**
 * Normalizes and validates an email address.
 * @param {string} rawEmail
 * @returns {string|null}
 */
export function normalizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== "string") return null;

  const email = rawEmail.trim().toLowerCase();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return re.test(email) ? email : null;
}

/** Safe folder name derived from an email address. */
export function emailToPathSlug(email) {
  return email.replace(/@/g, "_at_").replace(/\./g, "_");
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Sends an OTP email. Falls back to console.log when SMTP is not configured.
 */
export async function sendOtpEmail(to, otp, recipientLabel) {
  const subject = "NIT Goa Hostel Portal — Your OTP";
  const text = `Your OTP for ${recipientLabel} verification is: ${otp}\n\nThis code expires in 5 minutes.`;

  const mailer = getTransporter();

  if (!mailer) {
    console.log(`OTP email for ${to} (${recipientLabel}): ${otp}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}
