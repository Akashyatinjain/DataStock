// ProfilePage.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mail,
  Calendar,
  HardDrive,
  Pencil,
  Save,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/user";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // =========================
  // GET PROFILE
  // =========================
  const fetchProfile = async () => {
    try {
      setLoading(true);

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
      console.error(error.message);
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
    try {
      setUpdating(true);

      const response = await fetch(`${API_BASE_URL}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Update failed");
      }

      setUser(data.user);
    } catch (error) {
      console.error(error.message);
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

      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);

      const response = await fetch(
        `${API_BASE_URL}/upload-profile`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setUser((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
      }));
    } catch (error) {
      console.error(error.message);
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

    return `${gb.toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#f5f7fb] flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* HEADER */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* PROFILE IMAGE */}
          <div className="relative w-fit">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
              <img
                src={
                  user?.imageUrl ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="profile"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-2 right-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition"
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
          </div>

          {/* USER DETAILS */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                My Profile
              </h1>

              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Active User
              </div>
            </div>

            {/* USERNAME */}
            <div className="mb-6">
              <label className="text-sm text-gray-500 font-medium">
                Username
              </label>

              <div className="mt-2 flex gap-3">
                <div className="relative flex-1">
                  <Pencil
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl flex items-center gap-2 transition"
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

            {/* INFO GRID */}
            <div className="grid md:grid-cols-3 gap-5">
              {/* EMAIL */}
              <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Mail className="text-blue-600" size={18} />
                  </div>

                  <p className="text-sm text-gray-500">Email</p>
                </div>

                <p className="font-semibold text-gray-800 break-all">
                  {user?.email}
                </p>
              </div>

              {/* STORAGE */}
              <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-xl">
                    <HardDrive className="text-green-600" size={18} />
                  </div>

                  <p className="text-sm text-gray-500">
                    Storage Used
                  </p>
                </div>

                <p className="font-semibold text-gray-800">
                  {formatStorage(user?.storageUsed)}
                </p>
              </div>

              {/* JOIN DATE */}
              <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-xl">
                    <Calendar
                      className="text-purple-600"
                      size={18}
                    />
                  </div>

                  <p className="text-sm text-gray-500">
                    Joined
                  </p>
                </div>

                <p className="font-semibold text-gray-800">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STORAGE SECTION */}
      <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-800">
            Storage Overview
          </h2>

          <span className="text-sm text-green-600 font-semibold">
            Mini Drive
          </span>
        </div>

        <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{
              width: `${Math.min(
                (user?.storageUsed /
                  (100 * 1024 * 1024 * 1024)) *
                  100,
                100
              )}%`,
            }}
          />
        </div>

        <div className="flex justify-between mt-3 text-sm text-gray-500">
          <span>{formatStorage(user?.storageUsed)} used</span>
          <span>100 GB Total</span>
        </div>
      </div>
    </div>
  );
}