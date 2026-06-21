import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cloud,
  CheckCircle2,
  Zap,
  Crown,
  ArrowLeft,
  Loader2,
  Shield,
  Users,
  HardDrive,
  Clock,
  Database,
  Sparkles,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { startCheckout } from "../store/slices/paymentSlice";
import useSubscription from "../hooks/useSubscription";
import ThemeToggle from "../components/ui/ThemeToggle";

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: "₹0",
    period: "forever",
    storage: "10 GB",
    description: "Perfect for getting started.",
    features: [
      "Secure cloud storage",
      "Basic file sharing",
      "Access on 3 devices",
      "Standard support",
    ],
    icon: Cloud,
    gradient: "from-slate-600 to-slate-700",
    buttonStyle: "bg-white text-slate-900 hover:bg-slate-100",
    cardBorder: "border-slate-700",
    badge: null,
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹10",
    period: "/month",
    storage: "2 TB",
    description: "For power users and professionals.",
    features: [
      "Everything in Basic",
      "Smart Sync technology",
      "Advanced sharing controls",
      "30-day version history",
      "Priority 24/7 support",
    ],
    popular: true,
    icon: Zap,
    gradient: "from-emerald-500 to-green-600",
    buttonStyle:
      "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30",
    cardBorder: "border-emerald-500/50",
    badge: "Most Popular",
  },
  {
    key: "family",
    name: "Family",
    price: "₹20",
    period: "/month",
    storage: "5 TB",
    description: "Share with up to 6 members.",
    features: [
      "Everything in Pro",
      "Private accounts for 6 users",
      "Family room folder",
      "Centralized billing",
    ],
    icon: Crown,
    gradient: "from-violet-500 to-purple-600",
    buttonStyle: "bg-white text-slate-900 hover:bg-slate-100",
    cardBorder: "border-slate-700",
    badge: null,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const checkoutLoading = useSelector((state) => state.payment.checkoutLoading);
  const checkoutPlan = useSelector((state) => state.payment.checkoutPlan);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const {
    currentPlanKey,
    loading: subscriptionLoading,
    error: subscriptionError,
    refreshUserAndSubscription,
  } = useSubscription({ enabled: isLoggedIn });

  const handleSelectPlan = async (planKey) => {
    if (isLoggedIn && currentPlanKey === planKey) {
      return;
    }

    if (planKey === "basic") {
      if (isLoggedIn) {
        navigate("/dashboard");
      } else {
        navigate("/signup");
      }
      return;
    }

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      setError("");
      const result = await dispatch(startCheckout(planKey));

      if (startCheckout.fulfilled.match(result) && result.payload.success && result.payload.checkoutUrl) {
        window.location.href = result.payload.checkoutUrl;
        return;
      }

      setError(result.payload || "Failed to create checkout session. Please try again.");
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  const displayError = error || subscriptionError;

  // Determine current plan details for storage bar
  const currentPlan = PLANS.find((p) => p.key === currentPlanKey);
  // Simulate usage – in real app you'd fetch this from backend
  const usagePercentage = 15; // 15% used, just for visual
  const usedStorage = currentPlan ? (currentPlan.storage.includes("TB") 
    ? (parseFloat(currentPlan.storage) * 1024 * (usagePercentage / 100)).toFixed(1) + " GB"
    : (parseFloat(currentPlan.storage) * (usagePercentage / 100)).toFixed(1) + " GB"
  ) : "0 GB";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] font-['Inter'] selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden transition-colors duration-200">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjMzNDQiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20 pointer-events-none" />

      {/* NAVBAR */}
      <nav className="relative z-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-emerald-500/20">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                DataStock
              </span>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isLoggedIn && (
                <button
                  onClick={refreshUserAndSubscription}
                  disabled={subscriptionLoading}
                  className="hidden sm:inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-white font-medium transition-colors disabled:opacity-60"
                >
                  {subscriptionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Refresh plan
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-white font-medium transition-colors group"
              >
                <ArrowLeft
                  size={18}
                  className="group-hover:-translate-x-1 transition-transform duration-200"
                />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-300 h-150 bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg mb-6">
              <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                30-day money back guarantee
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Simple pricing.{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">
                No surprises.
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Start for free, upgrade when you need more space.
            </p>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="max-w-md mx-auto mb-8 bg-red-50 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-700/50 rounded-xl px-6 py-4 text-red-700 dark:text-red-300 text-sm text-center shadow-lg">
              {displayError}
            </div>
          )}

          {/* Storage usage widget (if logged in) */}
          {isLoggedIn && currentPlan && (
            <div className="max-w-3xl mx-auto mb-12 bg-white/90 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Your storage</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {usedStorage} used of {currentPlan.storage}
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-w-50">
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span>{usagePercentage}% used</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Plan: <span className="text-emerald-400 font-medium">{currentPlan.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const isLoading = checkoutLoading && checkoutPlan === plan.key;
              const isCurrentPlan = isLoggedIn && currentPlanKey === plan.key;
              const buttonStyle = isCurrentPlan
                ? "bg-slate-700 text-slate-300 cursor-default hover:bg-slate-700"
                : plan.buttonStyle;

              return (
                <div
                  key={plan.key}
                  className={`relative group bg-white/90 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    isCurrentPlan
                      ? "border-emerald-400/60 shadow-emerald-200/30 dark:shadow-emerald-900/30 shadow-xl"
                      : plan.popular
                      ? `${plan.cardBorder} shadow-lg shadow-emerald-200/20 dark:shadow-emerald-900/20`
                      : `${plan.cardBorder} hover:border-slate-300 dark:hover:border-slate-600`
                  }`}
                >
                  {/* Badges */}
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-linear-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold px-5 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold px-5 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-linear-to-br ${plan.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300`}
                  >
                    <PlanIcon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{plan.description}</p>

                  <div className="flex items-end mb-6">
                    <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2 mb-1">{plan.period}</span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-4 mb-8 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold text-xl">
                      {plan.storage}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-sm">secure storage</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-3 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.key)}
                    disabled={isLoading || subscriptionLoading || isCurrentPlan}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-200 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${buttonStyle} ${
                      !isCurrentPlan && plan.key !== "basic"
                        ? "hover:shadow-lg hover:shadow-emerald-500/20"
                        : ""
                    }`}
                  >
                    {subscriptionLoading && !checkoutLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Redirecting...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.key === "basic" ? (
                      isLoggedIn ? "Go to Dashboard" : "Get Started"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700/30">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">256-bit AES encryption</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700/30">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">99.9% uptime SLA</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700/30">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700/30">
              <Users className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/60 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} DataStock Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
