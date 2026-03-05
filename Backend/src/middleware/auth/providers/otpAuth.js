import { deleteExistingOTP, findValidOTP } from "../auth.repository.js";
import { sendOTPEmail } from "../../../utils/email.util.js";
import { createOTP,deleteOTP } from "../auth.repository.js";

export const OtpGenerator=(req,res)=>{
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendOTP=async(email)=>{
    if (!email) {
    throw new Error("Email is required");
  }

    const otp = OtpGenerator();
    await deleteExistingOTP(email);
    const expiresAt= new Date(Date.now() + 5*60*1000);
      console.log("Generated OTP:", otp);
  console.log("Expiry:", expiresAt);
    await  createOTP(email,otp,expiresAt);
    await sendOTPEmail(email,otp);
    return {message:`OTP sent successfully on ${email}`};
};

export const verifyOTP = async(email,otp)=>{
    const record = await findValidOTP(email,otp);
    if(!record){
        throw new Error("Invalid or expired OTP");
    }else{
        await deleteOTP(email);
        return { message: "OTP verified successfully" };
    }
}