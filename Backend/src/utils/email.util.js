import nodemailer  from "nodemailer";
// export const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,        // false for port 587
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  const response = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is ${otp}`,
  });

  console.log(response);
};
// transporter.verify((error, success) => {
//   if (error) {
//     console.log("SMTP ERROR:", error);
//   } else {
//     console.log("SMTP READY");
//   }
// });
// export const sendOTPEmail = async (email, otp) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Your OTP Verification Code",
//     text: `Your OTP for login is ${otp}`,
//   });
// };

// export const sendOTPEmail = async (email, otp) => {
//   try {
//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your OTP Verification Code",
//       text: `Your OTP for login is ${otp}`,
//     });

//     console.log("Mail sent:", info.messageId);
//   } catch (error) {
//     console.error("Mail error:", error);
//     throw error;
//   }
// };
