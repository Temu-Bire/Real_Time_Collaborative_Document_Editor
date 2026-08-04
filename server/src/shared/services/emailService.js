// Email delivery service.
//
// Sends transactional emails (email verification, password reset) via an SMTP
// relay. Configuration comes from environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
//
// If no SMTP credentials are configured the service does not fail: the email
// content (including the action link) is logged instead, so the flows remain
// testable during development. Set SMTP_HOST/SMTP_USER/SMTP_PASS to enable
// real delivery (e.g. Gmail app password, Brevo, SendGrid, Mailgun, Zoho).
const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

let transporter = null;

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const getFromAddress = () => {
  return process.env.MAIL_FROM || `SyncWrite <${process.env.SMTP_USER || "noreply@syncwrite.app"}>`;
};

// Derives the single base URL used to build action links inside emails.
// CLIENT_URL may hold a comma-separated list of CORS origins, so prefer an
// explicit CLIENT_ORIGIN when available. Otherwise use the first CLIENT_URL
// entry, never choosing a localhost origin in production (a deployed app must
// link back to itself, not to a local dev server).
const getClientOrigin = () => {
  if (process.env.CLIENT_ORIGIN) {
    return process.env.CLIENT_ORIGIN.trim().replace(/\/+$/, "");
  }
  const isLocalhost = (url) =>
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$|\/)/i.test(url);

  const candidates = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (process.env.NODE_ENV === "production") {
    return candidates.find((candidate) => !isLocalhost(candidate)) || "http://localhost:5173";
  }
  return candidates[0] || "http://localhost:5173";
};

const buildLayout = (title, heading, bodyHtml, actionUrl, actionLabel) => {
  const origin = getClientOrigin();
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f1f5f9;padding:32px 16px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:#4f46e5;padding:20px 28px;">
          <div style="color:#ffffff;font-size:20px;font-weight:700;">SyncWrite</div>
        </div>
        <div style="padding:28px;">
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:12px;">${heading}</div>
          <div style="font-size:14px;line-height:1.6;color:#475569;margin-bottom:20px;">${bodyHtml}</div>
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${actionUrl}"
               style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
              ${actionLabel}
            </a>
          </div>
          <div style="font-size:12px;color:#94a3b8;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:16px;">
            If the button does not work, copy and paste this link into your browser:<br/>
            <a href="${actionUrl}" style="color:#4f46e5;word-break:break-all;">${actionUrl}</a>
          </div>
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#94a3b8;">You received this email from ${origin}.</p>
    </div>
  `;
};

const sendMail = async ({ to, subject, text, html }) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn(
      { to, subject },
      "SMTP not configured - email not sent. Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable delivery."
    );
    return { skipped: true };
  }
  try {
    const info = await transport.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
    });
    logger.info({ to, messageId: info.messageId }, "Email sent");
    return { skipped: false, messageId: info.messageId };
  } catch (error) {
    logger.error({ to, error: error.message }, "Email send failed");
    throw error;
  }
};

const sendVerificationEmail = async (to, verificationToken) => {
  const verificationUrl = `${getClientOrigin()}/verify-email?token=${verificationToken}`;
  logger.info({ to, verificationUrl }, "Verification email prepared");
  return sendMail({
    to,
    subject: "Verify your SyncWrite email address",
    text: `Welcome to SyncWrite!\n\nPlease verify your email address by clicking this link:\n${verificationUrl}\n\nIf you did not create this account, you can ignore this email.`,
    html: buildLayout(
      "Verify your email",
      "Verify your email address",
      "Thanks for signing up for SyncWrite! Please confirm your email address to activate your account. This link expires in 24 hours.",
      verificationUrl,
      "Verify Email"
    ),
  });
};

const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${getClientOrigin()}/reset-password?token=${resetToken}`;
  logger.info({ to, resetUrl }, "Password reset email prepared");
  return sendMail({
    to,
    subject: "Reset your SyncWrite password",
    text: `We received a request to reset your SyncWrite password.\n\nClick this link to choose a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.`,
    html: buildLayout(
      "Reset your password",
      "Reset your password",
      "We received a request to reset your SyncWrite password. Click the button below to choose a new one. This link expires in 1 hour.",
      resetUrl,
      "Reset Password"
    ),
  });
};

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  isSmtpConfigured,
  getClientOrigin,
};
