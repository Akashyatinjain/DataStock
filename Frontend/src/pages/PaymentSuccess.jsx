import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Crown,
} from "lucide-react";
import { getSubscriptionStatus, syncPaymentReturn } from "../api/payment.api";
import { getProfile } from "../api/auth.api";
import {
  normalizePlan,
  notifySubscriptionUpdated,
  plansMatch,
  refreshCachedUser,
} from "../utils/subscription";
import ThemeToggle from "../components/ui/ThemeToggle";

const PLAN_DETAILS = {
  PRO: {
    name: "Pro",
    storage: "2 TB",
    color: "from-emerald-500 to-green-600",
    icon: Sparkles,
    features: [
      "2TB secure storage",
      "Smart Sync",
      "Priority 24/7 support",
      "30-day version history",
    ],
  },
  FAMILY: {
    name: "Family",
    storage: "5 TB",
    color: "from-violet-500 to-purple-600",
    icon: Crown,
    features: [
      "5TB secure storage",
      "Up to 6 users",
      "Family room folder",
      "Centralized billing",
    ],
  },
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const planKey = normalizePlan(searchParams.get("plan") || "PRO");
  const subscriptionId = searchParams.get("subscription_id");
  const paymentId = searchParams.get("payment_id");
  const paymentStatus = searchParams.get("status");

  const plan = PLAN_DETAILS[planKey] || PLAN_DETAILS.PRO;
  const PlanIcon = plan.icon;

  const [showContent, setShowContent] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [activationState, setActivationState] = useState("checking");

  const returnParams = useMemo(
    () => ({
      subscriptionId,
      paymentId,
      status: paymentStatus,
      plan: planKey,
    }),
    [subscriptionId, paymentId, paymentStatus, planKey]
  );

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 400);
    const t2 = setTimeout(() => setShowFeatures(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let retryTimer;

    const markActive = async (subscription) => {
      if (cancelled) return;
      setActivationState("active");
      notifySubscriptionUpdated(subscription);
      await refreshCachedUser(getProfile);
    };

    const trySyncFromReturnUrl = async () => {
      if (!returnParams.status && !returnParams.subscriptionId && !returnParams.paymentId) {
        return false;
      }

      try {
        const syncResult = await syncPaymentReturn(returnParams);
        if (syncResult.success && plansMatch(syncResult.subscription?.plan, planKey)) {
          await markActive(syncResult.subscription);
          return true;
        }
      } catch (err) {
        console.warn("Payment return sync failed:", err.response?.data?.message || err.message);
      }

      return false;
    };

    const checkSubscription = async () => {
      attempts += 1;

      try {
        if (attempts === 1) {
          const synced = await trySyncFromReturnUrl();
          if (synced) {
            return;
          }
        }

        const result = await getSubscriptionStatus();
        const backendPlan = result.subscription?.plan;

        if (cancelled) return;

        if (result.success && plansMatch(backendPlan, planKey)) {
          await markActive(result.subscription);
          return;
        }

        if (attempts >= 8) {
          setActivationState("pending");
          return;
        }

        retryTimer = setTimeout(checkSubscription, 1500);
      } catch (err) {
        console.error("Subscription refresh after payment failed:", err);
        if (!cancelled) {
          setActivationState(attempts >= 3 ? "pending" : "checking");
          if (attempts < 8) {
            retryTimer = setTimeout(checkSubscription, 1500);
          }
        }
      }
    };

    checkSubscription();

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [planKey, returnParams]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 font-['Inter'] overflow-hidden relative transition-colors duration-200">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-green-400/5 rounded-full blur-[150px]" />
      </div>

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-5%",
            backgroundColor: ["#34d399", "#10b981", "#6ee7b7", "#a78bfa", "#f59e0b", "#ec4899"][i % 6],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-lg w-full">
        <div
          className={`text-center mb-8 transition-all duration-700 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative inline-flex items-center justify-center mb-6">
            <div
              className="absolute w-24 h-24 bg-green-500/20 rounded-full animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <div className="absolute w-20 h-20 bg-green-500/30 rounded-full animate-pulse" />
            <div className="relative w-16 h-16 bg-linear-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Welcome to DataStock{" "}
            <span className="text-slate-900 dark:text-white font-semibold">{plan.name}</span>
          </p>
        </div>

        <div
          className={`bg-white/90 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700/50 p-8 shadow-2xl transition-all duration-700 delay-200 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700/50">
            <div
              className={`w-14 h-14 rounded-2xl bg-linear-to-br ${plan.color} flex items-center justify-center shadow-lg`}
            >
              <PlanIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name} Plan</h2>
              <p className="text-green-600 dark:text-green-400 font-semibold">
                {plan.storage} of secure storage
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {plan.features.map((feature, i) => (
              <div
                key={feature}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  showFeatures ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: `${i * 100 + 600}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              activationState === "active"
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-200"
                : activationState === "pending"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-100"
            }`}
          >
            <div className="flex items-start gap-3">
              {activationState === "active" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
              ) : activationState === "pending" ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              ) : (
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-sky-300" />
              )}
              <span>
                {activationState === "active"
                  ? "Your plan is active. Dashboard and pricing will now show your upgraded storage."
                  : activationState === "pending"
                    ? "Payment is complete. Plan activation is still syncing. Open pricing again in a moment or refresh the page."
                    : "Confirming your upgraded plan with the backend..."}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600/50"
            >
              View Pricing
            </button>
          </div>
        </div>

        <p
          className={`text-center text-sm text-gray-500 dark:text-gray-400 mt-6 transition-all duration-700 delay-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          A confirmation email has been sent to your registered email address.
        </p>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
