// src/pages/Profile.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera, Mail, Calendar, HardDrive, Pencil, Save, Loader2,
  User, CheckCircle, AlertCircle, Clock, Folder, Image as ImageIcon,
  FileText, ArrowLeft, Copy, Trash2, BarChart3, UploadCloud,
  Settings, Star, Gift, ShieldAlert, ShieldCheck, Lock, Unlock, Eye, EyeOff, Key
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SUBSCRIPTION_UPDATED_EVENT } from "../utils/subscription";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useCrypto } from "../context/CryptoContext";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateUserProfile, uploadProfileImage, deleteProfileImage } from "../store/slices/authSlice";
import { fetchAllFiles } from "../store/slices/filesSlice";
import { fetchFolders } from "../store/slices/foldersSlice";

const ProfileSkeleton = () => (
  <div className="h-full animate-pulse p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
    <div className="h-8 w-40 bg-gray-200 rounded" />
    <div className="h-6 w-64 bg-gray-200 rounded" />
    <div className="bg-white rounded-2xl p-4 sm:p-8 flex flex-col lg:flex-row gap-10">
      <div className="w-40 h-40 rounded-full bg-gray-200 mx-auto lg:mx-0" />
      <div className="flex-1 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

  // E2EE hooks and states
  const {
    isE2eeSetup,
    isE2eeUnlocked,
    setupE2ee,
    unlockE2ee,
    lockE2ee,
    loading: cryptoLoading,
    error: cryptoError,
  } = useCrypto();

  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [cryptoSuccess, setCryptoSuccess] = useState("");
  const [cryptoErr, setCryptoErr] = useState("");

  const handleSetupE2ee = async (e) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setCryptoErr("Passphrase cannot be empty");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setCryptoErr("Passphrases do not match");
      return;
    }
    setCryptoErr("");
    setCryptoSuccess("");
    try {
      await setupE2ee(passphrase.trim());
      setCryptoSuccess("End-to-End Encryption enabled successfully!");
      setPassphrase("");
      setConfirmPassphrase("");
      
      // Download backup JSON credentials
      const backupData = {
        app: "DataStock E2EE Backup",
        email: user?.email,
        createdAt: new Date().toISOString(),
        note: "Store this credentials config file safely. If passphrase is lost, your encrypted files cannot be recovered.",
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `datastock-e2ee-backup-${user?.email || "user"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setCryptoErr(err.message || "Failed to set up E2EE keys");
    }
  };

  const handleUnlockE2ee = async (e) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setCryptoErr("Passphrase is required");
      return;
    }
    setCryptoErr("");
    setCryptoSuccess("");
    try {
      await unlockE2ee(passphrase.trim());
      setCryptoSuccess("Secure storage unlocked successfully!");
      setPassphrase("");
    } catch (err) {
      setCryptoErr(err.message || "Decryption failed. Try again.");
    }
  };

  const handleLockE2ee = () => {
    lockE2ee();
    setCryptoSuccess("Secure storage locked.");
    setCryptoErr("");
  };

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

    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);

    return () => {
      window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);
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

  
  
  if (loading && !user) {
    return <ProfileSkeleton />;
  }

  
  
  if (errorMessage && !user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Profile</h3>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={fetchProfileData}
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
          <div className="flex items-center gap-2 bg-[#3B82F6] text-white px-5 py-3 rounded-xl shadow-lg">
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

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* ---------- Header with Back Button ---------- */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors mb-4 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-[#F8FAFC]">My Profile</h1>
            <p className="text-gray-500 dark:text-[#94A3B8] mt-1">Manage your account settings and preferences</p>
          </div>
          <div className="self-end sm:self-start shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/*  MAIN PROFILE CARD  */}
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-[#334155] p-4 sm:p-8 transition-colors duration-200">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* ---------- Avatar Section ---------- */}
            <div className="relative w-fit mx-auto lg:mx-0">
              {/* Avatar */}
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#3B82F6] shadow-lg bg-gray-100 dark:bg-[#334155] relative group/avatar">
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
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white p-2.5 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-[#F8FAFC]">Profile Information</h2>
                <span className="bg-blue-100 text-[#3B82F6] px-3 py-1 rounded-full text-xs font-semibold">
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
                <label className="text-sm text-gray-500 dark:text-[#94A3B8] font-medium block mb-2">
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
                      className="w-full h-12 rounded-xl border border-gray-200 dark:border-[#334155] pl-11 pr-4 outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition bg-white dark:bg-[#334155] dark:text-[#F8FAFC]"
                      placeholder="Enter username"
                    />
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 sm:px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Email */}
                <div className="bg-gray-50 dark:bg-[#334155] rounded-xl p-4 hover:shadow-md transition relative group/card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 dark:bg-blue-950/30 p-2 rounded-lg shrink-0">
                      <Mail className="text-blue-600 dark:text-blue-400" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-[#F8FAFC] text-sm break-all">
                    {user?.email}
                  </p>
                  <button
                    onClick={copyEmail}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-[#334155] shadow opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition duration-200"
                    title="Copy email"
                  >
                    <Copy size={14} className="text-gray-500 dark:text-[#94A3B8]" />
                  </button>
                </div>

                {/* Storage */}
                <div className="bg-gray-50 dark:bg-[#334155] rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 dark:bg-[#3B82F6]/10 p-2 rounded-lg shrink-0">
                      <HardDrive className="text-[#3B82F6] dark:text-[#3B82F6]" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Storage Used</p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-[#F8FAFC] text-sm">
                    {formatStorage(user?.storageUsed)}
                  </p>
                </div>

                {/* Member Since */}
                <div className="bg-gray-50 dark:bg-[#334155] rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-100 dark:bg-purple-950/30 p-2 rounded-lg shrink-0">
                      <Calendar className="text-purple-600 dark:text-purple-400" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-[#F8FAFC] text-sm">
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
          <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-[#334155] p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-[#F8FAFC] dark:text-[#F8FAFC] flex items-center gap-2">
                <BarChart3 size={20} className="text-[#3B82F6]" />
                Storage Overview
              </h3>
              <span className="text-xs text-[#3B82F6] dark:text-[#3B82F6] font-semibold bg-blue-50 dark:bg-[#3B82F6]/10 px-3 py-1 rounded-full">
                Mini Drive
              </span>
            </div>

            <div className="w-full h-4 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden shadow-inner">
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
              <span className="text-gray-600 dark:text-[#94A3B8] font-medium">
                {formatStorage(user?.storageUsed)} used
              </span>
              <span className="text-gray-400 dark:text-[#94A3B8]">{formatStorage(Number(user?.storageLimit) || 10 * 1024 * 1024 * 1024)} Total</span>
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
          <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-[#334155] p-6 transition-colors duration-200">
            <h3 className="text-lg font-bold text-gray-800 dark:text-[#F8FAFC] dark:text-[#F8FAFC] flex items-center gap-2 mb-4">
              <Folder size={20} className="text-[#3B82F6]" />
              Quick Stats
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-[#334155] dark:bg-[#334155] rounded-xl p-4 text-center">
                <FileText size={24} className="mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-[#F8FAFC] dark:text-[#F8FAFC]">{stats.files}</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Files</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#334155] dark:bg-[#334155] rounded-xl p-4 text-center">
                <Folder size={24} className="mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-[#F8FAFC] dark:text-[#F8FAFC]">{stats.folders}</p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Folders</p>
              </div>
            </div>
          </div>
        </div>

        {/* E2EE SECURITY CENTER CARD */}
        <div className="mt-6 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-[#334155] p-6 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl shrink-0 ${isE2eeSetup ? (isE2eeUnlocked ? 'bg-green-100 dark:bg-green-950/30' : 'bg-amber-100 dark:bg-amber-950/30') : 'bg-gray-100 dark:bg-gray-800'}`}>
              {isE2eeSetup ? (
                isE2eeUnlocked ? (
                  <ShieldCheck className="text-green-600 dark:text-green-400" size={24} />
                ) : (
                  <Lock className="text-amber-600 dark:text-amber-400" size={24} />
                )
              ) : (
                <ShieldAlert className="text-gray-500 dark:text-[#94A3B8]" size={24} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-[#F8FAFC]">
                End-to-End Encryption Security Center
              </h3>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                Keep your private files safe with client-side zero-knowledge encryption.
              </p>
            </div>
          </div>

          {cryptoSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm animate-slide-down">
              <CheckCircle size={16} />
              <span>{cryptoSuccess}</span>
            </div>
          )}

          {cryptoErr && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm animate-slide-down">
              <AlertCircle size={16} />
              <span>{cryptoErr}</span>
            </div>
          )}

          {/* Setup, Lock, or Unlock UI */}
          {!isE2eeSetup ? (
            <form onSubmit={handleSetupE2ee} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-[#94A3B8]">
                Set up a secure E2EE passphrase. Your files will be encrypted in your browser using AES-256 before upload. 
                <strong> Warning:</strong> We do not store your passphrase on the server. If lost, your encrypted files cannot be recovered.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#334155] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-[#F8FAFC] rounded-xl px-4 py-2 text-sm focus:outline-[#3B82F6] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 dark:text-[#94A3B8] hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Confirm Passphrase"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#334155] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-[#F8FAFC] rounded-xl px-4 py-2 text-sm focus:outline-[#3B82F6] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={cryptoLoading}
                className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                {cryptoLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating Keys...
                  </>
                ) : (
                  <>
                    <Key size={16} /> Enable E2EE & Download Recovery Backup
                  </>
                )}
              </button>
            </form>
          ) : isE2eeUnlocked ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-center gap-3">
                <ShieldCheck className="text-green-600 dark:text-green-400 shrink-0" size={20} />
                <div className="text-sm">
                  <p className="font-semibold text-green-800 dark:text-green-400">
                    E2EE Safe Storage is Unlocked
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-500">
                    Your master key is in-memory. You can upload and decrypt your secure files.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLockE2ee}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <Lock size={16} /> Lock Secure Storage
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlockE2ee} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-[#94A3B8]">
                End-to-End Encryption is active, but your secure vault is currently locked. Enter your passphrase to decrypt your files and upload new ones.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <div className="relative flex-1">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#334155] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-[#F8FAFC] rounded-xl px-4 py-2 text-sm focus:outline-[#3B82F6] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 dark:text-[#94A3B8] hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={cryptoLoading}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  {cryptoLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Unlock size={16} />
                  )}
                  <span>Unlock Vault</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/*  QUICK ACTIONS  */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/pricing')}
            className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-[#334155] shadow-xl hover:shadow-2xl transition flex items-center gap-3 group w-full text-left">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-xl shrink-0">
              <Star size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-[#F8FAFC] group-hover:text-[#3B82F6] dark:group-hover:text-[#3B82F6] transition truncate">
                {user?.subscriptionPlan === 'BASIC' ? 'Upgrade to Pro' : 'Manage Plan'}
              </p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">
                {user?.subscriptionPlan === 'BASIC' ? 'Get 2TB & premium support' : `Current: ${user?.subscriptionPlan || 'BASIC'} plan`}
              </p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400 dark:text-[#94A3B8] shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-[#334155] shadow-xl hover:shadow-2xl transition flex items-center gap-3 group w-full text-left">
            <div className="p-2 bg-pink-100 dark:bg-pink-950/30 rounded-xl shrink-0">
              <Gift size={20} className="text-pink-600 dark:text-pink-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-[#F8FAFC] group-hover:text-[#3B82F6] dark:group-hover:text-[#3B82F6] transition truncate">Refer a Friend</p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">Earn extra storage</p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400 dark:text-[#94A3B8] shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-[#334155] shadow-xl hover:shadow-2xl transition flex items-center gap-3 group w-full text-left"
          >
            <div className="p-2 bg-gray-200 dark:bg-[#334155] rounded-xl shrink-0">
              <Settings size={20} className="text-gray-700 dark:text-[#94A3B8]" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-[#F8FAFC] group-hover:text-[#3B82F6] dark:group-hover:text-[#3B82F6] transition truncate">Account Settings</p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">Privacy, security & more</p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400 dark:text-[#94A3B8] shrink-0 group-hover:translate-x-1 transition-transform" />
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
