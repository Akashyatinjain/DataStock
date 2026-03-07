import { deleteExistingOTP, findValidOTP, createOTP, deleteOTP } from "../auth.repository.js";
import { sendOTPEmail } from "../../../utils/email.util.js";
import bcrypt from "bcrypt";

export const OtpGenerator = () => {
   return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (email) => {

   if (!email) {
      throw new Error("Email is required");
   }

   const otp = OtpGenerator();

   await deleteExistingOTP(email);

   const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

   console.log("Generated OTP:", otp);
   console.log("Expiry:", expiresAt);

   // hash OTP
   const hashedOTP = await bcrypt.hash(otp, 10);

   // store hashed OTP
   await createOTP(email, hashedOTP, expiresAt);

   // send real OTP to user
   await sendOTPEmail(email, otp);

   return {
      message: `OTP sent successfully to ${email}`
   };
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