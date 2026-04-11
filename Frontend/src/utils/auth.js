// utils/auth.js
import {jwtDecode} from "jwt-decode";

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