// utils/auth.js
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../api/axios";

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
};

export const setupAutoLogout = (token, logout) => {
  try {
    const decoded = jwtDecode(token);

    const expiryTime = decoded.exp * 1000; // convert to ms
    const currentTime = Date.now();

    const timeout = expiryTime - currentTime;

    if (timeout > 0) {
      setTimeout(() => {
        logout();
      }, timeout);
    } else {
      logout(); // already expired
    }
  } catch (err) {
    logout();
  }
};
