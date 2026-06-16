import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../config/api.js";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const REFRESH_TOKEN_KEY = "refreshToken";

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const persistAuth = ({ token, user, refreshToken }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuth = async () => {
  try {
    await fetch(apiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: getToken() ? `Bearer ${getToken()}` : undefined,
      },
    });
  } catch {
    // Continue clearing client state even if logout API fails.
  }

  clearStoredAuth();
  window.location.href = "/login";
};

export const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  return Boolean(token && !isTokenExpired(token));
};

/**
 * OAuth redirect lands with tokens in the URL hash (cross-origin cookies blocked).
 * Must run before any history.replaceState that strips the hash.
 */
export const consumeAuthHash = () => {
  const rawHash = window.location.hash;
  if (!rawHash || rawHash.length < 2) {
    return null;
  }

  const params = new URLSearchParams(rawHash.slice(1));
  const token = params.get("at") || params.get("token");
  const refreshToken = params.get("rt") || params.get("refreshToken");

  if (!token || isTokenExpired(token)) {
    return null;
  }

  persistAuth({ token, refreshToken });

  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState({}, document.title, cleanUrl);

  return { token, refreshToken };
};

export const authFetch = (url, options = {}) => {
  const token = getToken();
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

let autoLogoutTimer;

export const setupAutoLogout = (token, logoutFn = clearAuth) => {
  if (autoLogoutTimer) {
    clearTimeout(autoLogoutTimer);
  }

  try {
    const decoded = jwtDecode(token);
    const timeout = decoded.exp * 1000 - Date.now();

    if (timeout > 0) {
      autoLogoutTimer = setTimeout(() => {
        logoutFn();
      }, timeout);
    } else {
      logoutFn();
    }
  } catch {
    logoutFn();
  }
};

export const bootstrapAuthSession = async () => {
  try {
    const response = await fetch(apiUrl("/auth/session"), {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: getToken() ? `Bearer ${getToken()}` : undefined,
      },
    });

    if (!response.ok) {
      throw new Error("Session unavailable");
    }

    const data = await response.json();
    const { token, user, success, refreshToken } = data || {};

    if (success && token && user) {
      persistAuth({ token, user, refreshToken });
      setupAutoLogout(token);
      return { token, user };
    }

    if (isAuthenticated()) {
      setupAutoLogout(getToken());
      return { token: getToken(), user: getStoredUser() };
    }

    clearStoredAuth();
    return null;
  } catch {
    if (isAuthenticated()) {
      setupAutoLogout(getToken());
      return { token: getToken(), user: getStoredUser() };
    }

    clearStoredAuth();
  }

  return null;
};
