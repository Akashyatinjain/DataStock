import { deleteExistingOTP, findValidOTP, createOTP, deleteOTP, incrementOTPAttempts } from "../auth.repository.js";
import { sendOTPEmail } from "../../../utils/email.util.js";
import bcrypt from "bcrypt";

const MAX_OTP_ATTEMPTS = 5;

export const OtpGenerator = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = OtpGenerator();

  await deleteExistingOTP(normalizedEmail);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const hashedOTP = await bcrypt.hash(otp, 12);

  await createOTP(normalizedEmail, hashedOTP, expiresAt);
  await sendOTPEmail(normalizedEmail, otp);

  return {
    message: `OTP sent successfully to ${normalizedEmail}`,
  };
};

export const verifyOTP = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await findValidOTP(normalizedEmail);

  if (!record) {
    throw new Error("OTP expired or not found");
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await deleteOTP(normalizedEmail);
    throw new Error("Too many invalid OTP attempts. Request a new OTP.");
  }

  const isMatch = await bcrypt.compare(otp, record.otp);

  if (!isMatch) {
    await incrementOTPAttempts(record.id, record.attempts + 1);
    throw new Error("Invalid OTP");
  }

  await deleteOTP(normalizedEmail);

  return { message: "OTP verified successfully" };
};
