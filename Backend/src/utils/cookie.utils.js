const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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
