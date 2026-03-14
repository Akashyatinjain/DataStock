// SignupPage.jsx
import React, { useState } from 'react';
import { 
  Cloud, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  ArrowRight,
  Check,
  Github,
  Chrome
} from 'lucide-react';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    return newErrors;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const newErrors = validateForm();

  if (Object.keys(newErrors).length !== 0) {
    setErrors(newErrors);
    return;
  }

  try {

    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username: formData.fullName,   // 🔥 IMPORTANT FIX
        email: formData.email,
        password: formData.password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    console.log(data);

    // redirect
    window.location.href = "/dashboard";

  } catch (err) {
    setErrors({ email: err.message });
  }
};
   // Handle Google login
 const handleGoogleLogin = () => {
  window.location.href = "http://localhost:5000/api/auth/google";
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
              href="/login" 
              className="text-gray-600 hover:text-black transition flex items-center space-x-1"
            >
              <span>Already have an account?</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Side - Benefits */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="inline-flex items-center bg-green-50 px-4 py-2 rounded-full mb-6">
                  <Cloud className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-600">Join 50,000+ users</span>
                </div>

                <h1 className="text-4xl font-bold text-black mb-6">
                  Start your free 
                  <br />
                  <span className="text-green-600">cloud storage</span>
                  <br />
                  journey today
                </h1>

                <p className="text-lg text-gray-600 mb-8">
                  Get 10 GB free storage when you sign up. No credit card required.
                </p>

                {/* Benefits List */}
                <div className="space-y-4 mb-8">
                  {[
                    'Secure end-to-end encryption',
                    'Access from any device',
                    'Easy file sharing',
                    '30-day version history',
                    '24/7 customer support'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <div className="flex items-center space-x-1 mb-3">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "DataStock has completely changed how I manage my files. So simple and secure!"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="font-medium text-black">Sarah Johnson</p>
                      <p className="text-sm text-gray-600">Product Designer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="lg:max-w-md lg:mx-auto w-full">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-black mb-2">Create your account</h2>
                <p className="text-gray-600 mb-6">Get started with your free 10 GB storage</p>

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

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-12 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="#" className="text-green-600 hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <p className="text-sm text-red-500">{errors.agreeTerms}</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center space-x-2 font-medium"
                  >
                    <span>Create account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Free Storage Note */}
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm text-green-800 text-center">
                    🎉 <span className="font-medium">10 GB free storage</span> on signup. 
                    No credit card needed!
                  </p>
                </div>

                {/* Login Link for Mobile */}
                <p className="mt-6 text-center text-sm text-gray-600 lg:hidden">
                  Already have an account?{' '}
                  <a href="/login" className="text-green-600 font-medium hover:underline">
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Star component for testimonials
const Star = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default SignupPage;