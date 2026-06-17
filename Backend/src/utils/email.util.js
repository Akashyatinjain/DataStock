import SibApiV3Sdk from "sib-api-v3-sdk";

const isDev = process.env.NODE_ENV !== "production";

/* ─── Production: Brevo transactional email ─── */
let emailApi;
if (!isDev) {
  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
  emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
}

export const sendOTPEmail = async (email, otp) => {
  /* ── Dev mode: just log to console, skip real email ── */
  if (isDev) {
    console.log("\n╔══════════════════════════════════════╗");
    console.log("║       📧  DEV MODE — OTP EMAIL       ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  To:   ${email}`);
    console.log(`║  OTP:  ${otp}`);
    console.log("╚══════════════════════════════════════╝\n");
    return;
  }

  /* ── Production: send via Brevo ── */
  await emailApi.sendTransacEmail({
    sender: {
      email: process.env.EMAIL_FROM,
      name: "DataStock",
    },
    to: [{ email }],
    subject: "DataStock OTP Verification",
    htmlContent: `
      <h2>Verify Your Account</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};