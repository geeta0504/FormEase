import nodemailer from "nodemailer";
import { Resend } from "resend";

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
let resendClient = null;

async function getTransporter() {
  if (transporter || resendClient) return { transporter, resendClient };

  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    return { resendClient };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return { transporter };
  }

  return { transporter: null };
}

/**
 * Sends an OTP email. Falls back to console.log when SMTP is not configured.
 */
export async function sendOtpEmail(to, otp, recipientLabel) {
  const subject = "NIT Goa Hostel Portal — Your OTP";
  const text = `Your OTP for ${recipientLabel} verification is: ${otp}\n\nThis code expires in 5 minutes.`;

  const { transporter: mailer, resendClient: resend } = await getTransporter();

  if (resend) {
    await resend.emails.send({
      from: process.env.SMTP_FROM || "onboarding@resend.dev",
      to,
      subject,
      text,
    });
    return;
  }

  if (mailer) {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return;
  }

  console.log(`[DEV OTP] OTP email for ${to} (${recipientLabel}): ${otp}`);
}


export async function sendVerificationLinkEmail(to, link, recipientLabel) {
  const subject = `NIT Goa Hostel Portal — Verify Email (${recipientLabel})`;
  const text = `Click the link below to verify your email as ${recipientLabel}:\n\n${link}\n\nThis link expires shortly and can only be used once.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #2563eb; margin-top: 0;">NIT Goa Hostel Portal</h2>
      <p style="font-size: 15px; color: #374151;">Hello,</p>
      <p style="font-size: 15px; color: #374151;">Please click the button below to verify your email address as <strong>${recipientLabel}</strong>:</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${link}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Or copy and paste this verification URL into your web browser:</p>
      <p style="word-break: break-all; font-size: 13px;"><a href="${link}" style="color: #2563eb;">${link}</a></p>
    </div>
  `;

  try {
    const { transporter: mailer, resendClient: resend } = await getTransporter();

    if (resend) {
      const from = process.env.SMTP_FROM || "onboarding@resend.dev";
      const { data, error } = await resend.emails.send({ from, to, subject, html, text });
      if (error) {
        throw new Error(`[Resend API Error]: ${error.message || JSON.stringify(error)}`);
      }
      console.log(`[Resend] Email dispatched to ${to} (ID: ${data?.id})`);
      return;
    }

    if (mailer) {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER;
      const info = await mailer.sendMail({ from, to, subject, text, html });
      console.log(`[SMTP] Email dispatched to ${to} (MessageID: ${info.messageId})`);
      return;
    }

    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL NOT SENT TO INBOX - SMTP NOT CONFIGURED IN .ENV]`);
    console.log(`Verification link for ${to} (${recipientLabel}):`);
    console.log(`👉 ${link}`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`Failed to dispatch email to ${to}:`, err.message);
    console.log(`\n======================================================`);
    console.log(`⚠️  [SMTP DELIVERY FAILED - NETWORK TIMEOUT OR CONFIG ERROR]`);
    console.log(`Fallback Verification Link for ${to} (${recipientLabel}):`);
    console.log(`👉 ${link}`);
    console.log(`======================================================\n`);
  }
}