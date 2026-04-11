// LoginPage.jsx
import React, { useState } from 'react';
import { 
  Cloud, 
  Mail, 
  Lock, 
  ArrowRight,
  Shield,
  Smartphone,
  Key,
  Chrome,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { login,sendOtp,verifyOtp } from "../api/authApi";
import { useNavigate } from "react-router-dom";

import { setupAutoLogout } from "../utils/auth";

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};


const LoginPage = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('login'); // 'login', 'otp-verification', 'success'
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Handle OTP input
const handleOtpRequest = async (e) => {
  e.preventDefault();

  try {

    setIsLoading(true);

    await sendOtp(email);

    setStep("otp-verification");

  } catch (err) {

    setErrors({
      email: err.response?.data?.message || "OTP failed"
    });

  } finally {
    setIsLoading(false);
  }
};

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle email/password login
const handlePasswordLogin = async (e) => {
  e.preventDefault();

  try {
    setIsLoading(true);

    const res = await login({ email, password });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    // ✅ AUTO LOGOUT HERE
    setupAutoLogout(res.data.token, logout);

    setStep("success");

    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);

  } catch (err) {
    setErrors({
      password: err.response?.data?.message || "Login failed"
    });
  } finally {
    setIsLoading(false);
  }
};
const handleOtpChange = (index, value) => {
  if (value.length > 1) return;

  const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);

  if (value && index < 5) {
    const nextInput = document.getElementById(`otp-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};
  // Handle OTP request
const handleOtpVerification = async (e) => {
  e.preventDefault();

  const otpValue = otp.join("");

  try {
    setIsLoading(true);

    const res = await verifyOtp(email, otpValue);

    console.log(res.data);
if (res.data.token) {
  localStorage.setItem("token", res.data.token);

  // ✅ correct place
  setupAutoLogout(res.data.token, logout);
}
    // save user if backend sends it
    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    setStep("success");

    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);

  } catch (err) {

    setErrors({
      otp: err.response?.data?.message || "Invalid OTP"
    });

  } finally {
    setIsLoading(false);
  }
};
  // Handle OTP verification


  // Handle Google login
 const handleGoogleLogin = () => {
  window.location.href = "http://localhost:5000/api/auth/google";
};

  // Resend OTP
  const handleResendOtp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Show resend success message
      alert('OTP resent successfully!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Simple Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-black">DataStock</span>
            </div>
            <a 
              href="/signup" 
              className="text-gray-600 hover:text-black transition flex items-center space-x-1"
            >
              <span>Need an account?</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-md mx-auto w-full">
          {/* Success State */}
          {step === 'success' ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Login Successful!</h2>
              <p className="text-gray-600 mb-6">Redirecting you to your dashboard...</p>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xl">
              {/* Header */}
              <div className="text-center mb-8">
                {step === 'otp-verification' && (
                  <button 
                    onClick={() => setStep('login')}
                    className="absolute top-6 left-6 text-gray-400 hover:text-black transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="inline-flex items-center bg-green-50 px-4 py-2 rounded-full mb-4">
                  <Shield className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-600">Secure Login</span>
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">
                  {step === 'otp-verification' ? 'Enter Verification Code' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {step === 'otp-verification' 
                    ? `We've sent a 6-digit code to ${email}`
                    : 'Choose your preferred login method'}
                </p>
              </div>

              {/* OTP Verification Step */}
              {step === 'otp-verification' ? (
                <form onSubmit={handleOtpVerification} className="space-y-6">
                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Enter 6-digit OTP
                    </label>
                    <div className="flex justify-center space-x-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition"
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="mt-2 text-sm text-red-500 text-center">{errors.otp}</p>
                    )}
                  </div>

                  {/* Resend OTP */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Didn't receive code?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-green-600 font-medium hover:underline"
                      >
                        Resend OTP
                      </button>
                    </p>
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <Shield className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Login Step */
                <>
                  {/* Google Sign In Button */}
                 {/* Google Sign In Button */}
<button
  onClick={handleGoogleLogin}
  className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 mb-6 hover:border-green-600 hover:text-green-600 transition font-medium"
>
  {/* Google Icon */}
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.9 2.7 30.3 0 24 0 14.6 0 6.5 5.5 2.6 13.5l8.1 6.3C12.5 13.5 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.7-.2-3.3-.5-4.9H24v9.3h12.4c-.5 2.8-2.1 5.1-4.5 6.7l7 5.4c4.1-3.8 6.4-9.4 6.4-16.5z"/>
    <path fill="#FBBC05" d="M10.7 28.1c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-8.1-6.3C.9 16.4 0 20 0 23.7s.9 7.3 2.6 10.7l8.1-6.3z"/>
    <path fill="#34A853" d="M24 47c6.3 0 11.6-2.1 15.4-5.7l-7-5.4c-2 1.4-4.6 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-8.1 6.3C6.5 42.5 14.6 47 24 47z"/>
  </svg>

  Continue with Google
</button>

                  {/* Login Method Toggle */}
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button
                      onClick={() => setLoginMethod('password')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2 ${
                        loginMethod === 'password' 
                          ? 'bg-white text-black shadow' 
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Key className="w-4 h-4" />
                      <span>Password</span>
                    </button>
                    <button
                      onClick={() => setLoginMethod('otp')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2 ${
                        loginMethod === 'otp' 
                          ? 'bg-white text-black shadow' 
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>OTP</span>
                    </button>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleOtpRequest} className="space-y-5">
                    {/* Email Field (Common for both methods) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition`}
                          placeholder="you@example.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Password Field (Only for password method) */}
                    {loginMethod === 'password' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition`}
                            placeholder="••••••••"
                          />
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                        )}
                      </div>
                    )}

                    {/* Remember Me & Forgot Password (Only for password method) */}
                    {loginMethod === 'password' && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                          />
                          <span className="ml-2 text-sm text-gray-600">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-green-600 hover:underline">
                          Forgot password?
                        </a>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-black text-white py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Please wait...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {loginMethod === 'password' ? 'Login with Password' : 'Send OTP'}
                          </span>
                          {loginMethod === 'password' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Smartphone className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>
                  </form>

                  {/* Security Note */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Your security is our priority. All logins are protected with enterprise-grade encryption.
                    </p>
                  </div>

                  {/* Signup Link for Mobile */}
                  <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <a href="/signup" className="text-green-600 font-medium hover:underline">
                      Sign up free
                    </a>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Features Preview */}
          {step !== 'success' && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: Shield, text: 'Secure' },
                { icon: Cloud, text: '10GB Free' },
                { icon: Key, text: 'Encrypted' }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mb-2">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;