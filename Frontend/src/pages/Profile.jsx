// src/pages/Profile.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera, Mail, Calendar, HardDrive, Pencil, Save, Loader2,
  User, CheckCircle, AlertCircle, Clock, Folder, Image as ImageIcon,
  FileText, ArrowLeft, Copy, Trash2, BarChart3, UploadCloud,
  Settings, Star, Gift
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SUBSCRIPTION_UPDATED_EVENT } from "../utils/subscription";
import ThemeToggle from "../components/ui/ThemeToggle";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateUserProfile, uploadProfileImage, deleteProfileImage } from "../store/slices/authSlice";
import { fetchAllFiles } from "../store/slices/filesSlice";
import { fetchFolders } from "../store/slices/foldersSlice";

const ProfileSkeleton = () => (
  <div className="h-full animate-pulse p-6 max-w-5xl mx-auto space-y-6">
    <div className="h-8 w-40 bg-gray-200 rounded" />
    <div className="h-6 w-64 bg-gray-200 rounded" />
    <div className="bg-white rounded-2xl p-8 flex flex-col lg:flex-row gap-10">
      <div className="w-40 h-40 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="grid md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
    <div className="h-32 bg-gray-200 rounded-2xl" />
  </div>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const updating = useSelector((state) => state.auth.updating);
  const uploading = useSelector((state) => state.auth.uploading);
  const deletingImage = useSelector((state) => state.auth.deletingImage);
  const allFiles = useSelector((state) => state.files.allFiles);
  const folders = useSelector((state) => state.folders.folders);

  const [username, setUsername] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  const fetchProfileData = useCallback(async () => {
    try {
      setErrorMessage("");
      const resultAction = await dispatch(fetchProfile());
      if (fetchProfile.fulfilled.match(resultAction)) {
        const u = resultAction.payload.user || resultAction.payload.data?.user || resultAction.payload;
        if (u) {
          setUsername(u.username || "");
        }
      } else {
        setErrorMessage(resultAction.payload || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Fetch profile error:", error.message);
      setErrorMessage(error.message);
    }
  }, [dispatch]);

  const fetchStats = useCallback(() => {
    dispatch(fetchAllFiles());
    dispatch(fetchFolders());
  }, [dispatch]);

  const stats = { files: allFiles.length, folders: folders.length };

  useEffect(() => {
    fetchProfileData();
    fetchStats();
  }, [fetchProfileData, fetchStats]);

  useEffect(() => {
    const handleSubscriptionUpdated = () => {
      fetchProfileData();
    };

    const handleFocus = () => {
      fetchProfileData();
    };

    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchProfileData]);

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      setErrorMessage("Username cannot be empty");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setErrorMessage("");
      const resultAction = await dispatch(updateUserProfile({ username: username.trim() }));
      if (updateUserProfile.fulfilled.match(resultAction)) {
        setSuccessMessage("Username updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(resultAction.payload || "Update failed");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Update error:", error.message);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please upload an image file");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size should be less than 5MB");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setErrorMessage("");
      const resultAction = await dispatch(uploadProfileImage(formData));
      if (uploadProfileImage.fulfilled.match(resultAction)) {
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(resultAction.payload || "Upload failed");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Upload error:", error.message);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!user?.imageUrl) return;

    try {
      setErrorMessage("");
      const resultAction = await dispatch(deleteProfileImage());
      if (deleteProfileImage.fulfilled.match(resultAction)) {
        setSuccessMessage("Profile picture removed.");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(resultAction.payload || "Deletion failed");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const copyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email).then(() => {
      setSuccessMessage("Email copied to clipboard!");
      setTimeout(() => setSuccessMessage(""), 2000);
    });
  };

  
  
  const formatStorage = (bytes) => {
    if (!bytes) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.01) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  
  
  if (loading) {
    return <ProfileSkeleton />;
  }

  
  
  if (errorMessage && !user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Profile</h3>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-linear-to-br from-gray-50 to-green-50 dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      {/* ---------- Success Toast ---------- */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slide-down">
          <div className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* ---------- Error Toast ---------- */}
      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slide-down">
          <div className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        {/* ---------- Header with Back Button ---------- */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors mb-4 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white dark:text-white">My Profile</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
          </div>
          <ThemeToggle />
        </div>

        {/*  MAIN PROFILE CARD  */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-8 transition-colors duration-200">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* ---------- Avatar Section ---------- */}
            <div className="relative w-fit mx-auto lg:mx-0">
              {/* Avatar */}
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-green-500 shadow-lg bg-gray-100 dark:bg-slate-800 relative group/avatar">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user?.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-green-400 to-green-600">
                    <User className="text-white" size={48} />
                  </div>
                )}

                {/* Upload overlay */}
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full"
                >
                  <UploadCloud className="text-white" size={24} />
                </button>
              </div>

              {/* Bottom buttons */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload new picture"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
                {user?.imageUrl && (
                  <button
                    onClick={handleDeleteImage}
                    disabled={deletingImage}
                    className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-lg transition disabled:opacity-50"
                    title="Remove picture"
                  >
                    {deletingImage ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* ---------- Profile Info ---------- */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white dark:text-white">Profile Information</h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Active
                </span>
                {user?.subscriptionPlan && user.subscriptionPlan !== 'BASIC' && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.subscriptionPlan === 'PRO'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {user.subscriptionPlan} Plan
                  </span>
                )}
              </div>

              {/* Username edit row */}
              <div className="mb-6">
                <label className="text-sm text-gray-500 dark:text-gray-400 font-medium block mb-2">
                  Username
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Pencil
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-12 rounded-xl border border-gray-200 dark:border-slate-700 pl-11 pr-4 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white dark:bg-slate-800 dark:text-white"
                      placeholder="Enter username"
                    />
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Save size={18} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid md:grid-cols-3 gap-5">
                {/* Email */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 hover:shadow-md transition relative group/card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Mail className="text-blue-600" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm break-all">
                    {user?.email}
                  </p>
                  <button
                    onClick={copyEmail}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-white shadow opacity-0 group-hover/card:opacity-100 transition"
                    title="Copy email"
                  >
                    <Copy size={14} className="text-gray-500" />
                  </button>
                </div>

                {/* Storage */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <HardDrive className="text-green-600" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Storage Used</p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">
                    {formatStorage(user?.storageUsed)}
                  </p>
                </div>

                {/* Member Since */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Calendar className="text-purple-600" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*  STORAGE & STATS SECTION  */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {/* Storage Overview */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white dark:text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-green-600" />
                Storage Overview
              </h3>
              <span className="text-xs text-green-600 dark:text-emerald-400 font-semibold bg-green-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
                Mini Drive
              </span>
            </div>

            <div className="w-full h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-linear-to-r from-green-400 to-green-600 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(
                    ((user?.storageUsed || 0) / (Number(user?.storageLimit) || 10 * 1024 * 1024 * 1024)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {formatStorage(user?.storageUsed)} used
              </span>
              <span className="text-gray-400 dark:text-gray-500">{formatStorage(Number(user?.storageLimit) || 10 * 1024 * 1024 * 1024)} Total</span>
            </div>

            {((user?.storageUsed || 0) / (Number(user?.storageLimit) || 10 * 1024 * 1024 * 1024)) * 100 > 85 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-700">
                  You're running low on storage! Consider upgrading to Pro for 1TB of space.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats (requires optional backend route) */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-200">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white dark:text-white flex items-center gap-2 mb-4">
              <Folder size={20} className="text-green-600" />
              Quick Stats
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl p-4 text-center">
                <FileText size={24} className="mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-white dark:text-white">{stats.files}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Files</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl p-4 text-center">
                <Folder size={24} className="mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-white dark:text-white">{stats.folders}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Folders</p>
              </div>
            </div>
          </div>
        </div>

        {/*  QUICK ACTIONS  */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/pricing')}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition flex items-center gap-3 group">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Star size={20} className="text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-white dark:text-white group-hover:text-green-600 transition">
                {user?.subscriptionPlan === 'BASIC' ? 'Upgrade to Pro' : 'Manage Plan'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.subscriptionPlan === 'BASIC' ? 'Get 2TB & premium support' : `Current: ${user?.subscriptionPlan || 'BASIC'} plan`}
              </p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400 dark:text-gray-500" />
          </button>

          <button className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition flex items-center gap-3 group">
            <div className="p-2 bg-pink-100 rounded-xl">
              <Gift size={20} className="text-pink-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-white dark:text-white group-hover:text-green-600 transition">Refer a Friend</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Earn extra storage</p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400 dark:text-gray-500" />
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition flex items-center gap-3 group"
          >
            <div className="p-2 bg-gray-200 rounded-xl">
              <Settings size={20} className="text-gray-700" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-white dark:text-white group-hover:text-green-600 transition">Account Settings</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Privacy, security & more</p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CSS for toast animation (add to your global styles if not already present) ---
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
`;
if (!document.querySelector('style[data-profile-anim]')) {
  style.setAttribute('data-profile-anim', 'true');
  document.head.appendChild(style);
}
