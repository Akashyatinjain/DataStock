import axios from "axios";
import { API_BASE_URL } from "../config/api.js";
import {
  clearStoredAuth,
  getRefreshToken,
  getToken,
  persistAuth,
  setupAutoLogout,
} from "../utils/auth";

export { API_BASE_URL, BACKEND_BASE_URL } from "../config/api.js";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

const PUBLIC_PATHS = ["/login", "/signup", "/", "/pricing", "/help"];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/signup") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/session");

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = API.post("/auth/refresh", {
          refreshToken: getRefreshToken(),
        })
          .then((response) => {
            const { token, user, success, refreshToken } = response.data || {};
            if (success && token) {
              persistAuth({ token, user, refreshToken });
              setupAutoLogout(token);
            }
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const token = await refreshPromise;
      if (!token) {
        throw new Error("Unable to refresh session");
      }

      originalRequest.headers.Authorization = `Bearer ${token}`;
      return API(originalRequest);
    } catch (refreshError) {
      clearStoredAuth();

      if (!isPublicPath(window.location.pathname)) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default API;
