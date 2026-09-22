import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  bootstrapAuthSession,
  clearStoredAuth,
  consumeAuthHash,
  getStoredUser,
  getToken,
  isAuthenticated,
  setupAutoLogout,
} from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      // OAuth tokens arrive in the hash — read before touching the URL.
      const hashSession = consumeAuthHash();
      if (hashSession?.token) {
        setupAutoLogout(hashSession.token);
        if (!getStoredUser()) {
          await bootstrapAuthSession();
        }
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (!cancelled) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get("auth")) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      if (isAuthenticated()) {
        setupAutoLogout(getToken());
        if (!cancelled) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      const session = await bootstrapAuthSession();
      if (!cancelled) {
        setAllowed(Boolean(session));
        setChecking(false);
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!allowed) {
    if (!isAuthenticated()) {
      clearStoredAuth();
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
