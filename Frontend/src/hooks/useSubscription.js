import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { applySubscription, fetchSubscriptionStatus } from "../store/slices/paymentSlice";
import { fetchProfile } from "../store/slices/authSlice";
import {
  notifySubscriptionUpdated,
  SUBSCRIPTION_UPDATED_EVENT,
} from "../utils/subscription";

export default function useSubscription({ enabled = true } = {}) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentPlan, subscription, loading, error } = useSelector(
    (state) => state.payment
  );

  const refreshSubscription = useCallback(async () => {
    if (!enabled) {
      return null;
    }

    const result = await dispatch(fetchSubscriptionStatus());
    if (fetchSubscriptionStatus.fulfilled.match(result) && result.payload.success) {
      notifySubscriptionUpdated(result.payload.subscription);
      return result.payload.subscription;
    }
    return null;
  }, [dispatch, enabled]);

  const refreshUserAndSubscription = useCallback(async () => {
    await dispatch(fetchProfile());
    return refreshSubscription();
  }, [dispatch, refreshSubscription]);

  useEffect(() => {
    if (enabled) {
      refreshSubscription();
    }
  }, [refreshSubscription, location.pathname, enabled]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleFocus = () => {
      refreshSubscription();
    };

    const handleSubscriptionUpdated = (event) => {
      dispatch(applySubscription(event.detail));
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
  }, [dispatch, enabled, refreshSubscription]);

  return {
    currentPlan,
    currentPlanKey: currentPlan.toLowerCase(),
    subscription,
    loading: enabled ? loading : false,
    error: enabled ? error : "",
    refreshSubscription,
    refreshUserAndSubscription,
  };
}
