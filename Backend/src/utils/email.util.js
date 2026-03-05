import nodemailer  from "nodemailer";
import { OtpGenerator } from "../middleware/auth/providers/otpAuth";
export const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
});

export const sendOTPEmail = async (email,otp)=>{
    await transporter.sendMail({
        from:process.env.EMAIL_USER,
        to:email,
        subject:"Your OTP Verification Code",
        text:`Your otp for login is ${OtpGenerator}`
    })
}