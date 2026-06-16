import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSubscriptionStatus } from "../api/payment.api";
import { getProfile } from "../api/auth.api";
import {
  normalizePlan,
  notifySubscriptionUpdated,
  refreshCachedUser,
  SUBSCRIPTION_UPDATED_EVENT,
} from "../utils/subscription";

export default function useSubscription({ enabled = true } = {}) {
  const location = useLocation();
  const [currentPlan, setCurrentPlan] = useState("BASIC");
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  const applySubscription = useCallback((nextSubscription) => {
    const plan = normalizePlan(nextSubscription?.plan || "BASIC");
    setCurrentPlan(plan);
    setSubscription(nextSubscription ? { ...nextSubscription, plan } : null);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!enabled) {
      setCurrentPlan("BASIC");
      setSubscription(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getSubscriptionStatus();

      if (result.success) {
        applySubscription(result.subscription);
        notifySubscriptionUpdated(result.subscription);
        return result.subscription;
      }

      setError(result.message || "Could not load subscription status.");
      return null;
    } catch (err) {
      console.error("Subscription status error:", err);
      setError(
        err.response?.data?.message ||
          "Could not load subscription status. Please refresh."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [applySubscription, enabled]);

  const refreshUserAndSubscription = useCallback(async () => {
    await refreshCachedUser(getProfile);
    return refreshSubscription();
  }, [refreshSubscription]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription, location.pathname]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleFocus = () => {
      refreshSubscription();
    };

    const handleSubscriptionUpdated = (event) => {
      applySubscription(event.detail);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        SUBSCRIPTION_UPDATED_EVENT,
        handleSubscriptionUpdated
      );
    };
  }, [applySubscription, enabled, refreshSubscription]);

  return {
    currentPlan,
    currentPlanKey: currentPlan.toLowerCase(),
    subscription,
    loading,
    error,
    refreshSubscription,
    refreshUserAndSubscription,
    setCurrentPlan,
    applySubscription,
  };
}
