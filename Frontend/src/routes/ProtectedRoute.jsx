import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  bootstrapAuthSession,
  clearStoredAuth,
  getToken,
  isAuthenticated,
  persistAuth,
  setupAutoLogout,
} from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      const params = new URLSearchParams(window.location.search);
      const authProvider = params.get("auth");

      if (authProvider) {
        window.history.replaceState({}, document.title, window.location.pathname);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Checking session...
      </div>
    );
  }

  if (!allowed) {
    clearStoredAuth();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
