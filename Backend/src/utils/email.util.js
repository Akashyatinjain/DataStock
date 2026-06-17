import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

/* ─── Production: Nodemailer SMTP (Gmail) ─── */
let transporter;
if (!isDev) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export const sendOTPEmail = async (email, otp) => {
  /* ── Dev mode: just log to console ── */
  if (isDev) {
    console.log("\n╔══════════════════════════════════════╗");
    console.log("║       📧  DEV MODE — OTP EMAIL       ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  To:   ${email}`);
    console.log(`║  OTP:  ${otp}`);
    console.log("╚══════════════════════════════════════╝\n");
    return;
  }

  /* ── Production: send via Nodemailer ── */
  await transporter.sendMail({
    from: `"DataStock" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "DataStock OTP Verification Code",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Verify Your Account</h2>
        <p>Your OTP is:</p>
        <h1 style="font-size: 32px; color: #4F46E5; letter-spacing: 2px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `,
  });
};