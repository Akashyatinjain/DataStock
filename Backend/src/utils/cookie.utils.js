// SameSite=None + Secure is required for cross-origin SPA auth (e.g. Vercel → Render).
// Secure cookies are also accepted on http://localhost in modern browsers.
const baseCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export const setAccessCookie = (res, token) => {
  res.cookie("token", token, {
    ...baseCookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
};

export const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: "/api/auth",
  });
};

export const setAuthCookie = (res, token) => {
  setAccessCookie(res, token);
};

export const clearAuthCookies = (res) => {
  res.clearCookie("token", baseCookieOptions);
  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    path: "/api/auth",
  });
};

export const clearAuthCookie = clearAuthCookies;
