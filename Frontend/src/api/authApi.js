import axios from "axios";
import { Aperture } from "lucide-react";

const API = axios.create({
    baseURL:"http://localhost:5000/api",
    withCredentials:true
})

export const signup = (data)=>
    API.post("/auth/signup", data);

export const login = (data)=>
    API.post("/auth/login", data);

export const sendOtp = (email) =>
  API.post("/auth/send-otp", { email });

export const verifyOtp = (email, otp) =>
  API.post("/auth/verify-otp", { email, otp });

export const logout = () =>
  API.post("/auth/logout");

export const getProfile = () =>
  API.get("/user/profile");

export default API;