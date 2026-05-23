// src/pages/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { 
  Camera, 
  Mail, 
  Calendar, 
  HardDrive, 
  Pencil, 
  Save, 
  Loader2,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Folder,
  Image as ImageIcon,
  FileText,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api/user";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  // =========================
  // GET PROFILE
  // =========================
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setUser(data.user);
      setUsername(data.user.username);
    } catch (error) {
      console.error("Fetch profile error:", error.message);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =========================
  // UPDATE USERNAME
  // =========================
  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      setErrorMessage("Username cannot be empty");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setUpdating(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Update failed");
      }

      setUser(data.user);
      setSuccessMessage("Username updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Update error:", error.message);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setUpdating(false);
    }
  };

  // =========================
  // UPLOAD PROFILE IMAGE
  // =========================
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please upload an image file");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size should be less than 5MB");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/upload-profile`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setUser((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
      }));
      
      setSuccessMessage("Profile picture updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Upload error:", error.message);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // STORAGE FORMATTER
  // =========================
  const formatStorage = (bytes) => {
    if (!bytes) return "0 GB";
    
    const gb = bytes / (1024 * 1024 * 1024);
    
    if (gb < 0.01) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    }
    
    return `${gb.toFixed(2)} GB`;
  };

  // =========================
  // GO BACK TO DASHBOARD
  // =========================
  const goBack = () => {
    navigate("/dashboard");
  };

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR STATE
  // =========================
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
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slide-down">
          <div className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slide-down">
          <div className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors mb-4 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Profile Image Section */}
            <div className="relative w-fit">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-green-500 shadow-lg bg-gray-100">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user?.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                    <User className="text-white" size={48} />
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Camera size={18} />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              {uploading && (
                <p className="text-xs text-green-600 text-center mt-2">Uploading...</p>
              )}
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>

              {/* Username Edit */}
              <div className="mb-6">
                <label className="text-sm text-gray-500 font-medium block mb-2">
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
                      className="w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
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

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-5">
                {/* Email */}
                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Mail className="text-blue-600" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm break-all">
                    {user?.email}
                  </p>
                </div>

                {/* Storage */}
                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <HardDrive className="text-green-600" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Storage Used
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {formatStorage(user?.storageUsed)}
                  </p>
                </div>

                {/* Join Date */}
                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Calendar className="text-purple-600" size={16} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Member Since
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">
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

        {/* Storage Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Storage Overview</h3>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
              Mini Drive
            </span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  ((user?.storageUsed || 0) / (100 * 1024 * 1024 * 1024)) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="flex justify-between mt-3 text-sm">
            <span className="text-gray-600">{formatStorage(user?.storageUsed)} used</span>
            <span className="text-gray-400">100 GB Total</span>
          </div>

          {/* Upgrade Prompt */}
          {((user?.storageUsed || 0) / (100 * 1024 * 1024 * 1024)) * 100 > 85 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                ⚠️ You're running low on storage! Consider upgrading to Pro for 1TB storage.
              </p>
            </div>
          )}

          {/* Quick Access Items */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <Clock size={14} />
              QUICK ACCESS
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: "Project Proposal.pdf", type: "pdf" },
                { name: "Design Assets", type: "folder" },
                { name: "Team Photo.jpg", type: "image" },
                { name: "Q4 Report.xlsx", type: "sheet" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-green-50 transition">
                    {item.type === "folder" ? (
                      <Folder size={16} className="text-gray-500" />
                    ) : item.type === "image" ? (
                      <ImageIcon size={16} className="text-gray-500" />
                    ) : (
                      <FileText size={16} className="text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 truncate flex-1">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this CSS to your index.css or App.css if you haven't already
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
`;
document.head.appendChild(style);