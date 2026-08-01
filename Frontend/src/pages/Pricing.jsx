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
  Github,
  Lock
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { startCheckout } from "../store/slices/paymentSlice";
import useSubscription from "../hooks/useSubscription";
import ThemeToggle from "../components/ui/ThemeToggle";
import { getToken } from "../utils/auth";

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: "₹0",
    period: "forever",
    storage: "10 GB",
    description: "Essential storage for individuals.",
    features: [
      "10 GB secure cloud storage",
      "Standard link sharing",
      "Access on all web devices",
      "Standard encryption"
    ],
    icon: Cloud,
    gradient: "from-slate-600 to-slate-700",
    buttonStyle: "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600",
    cardBorder: "border-slate-300 dark:border-slate-700",
    glow: "",
    badge: null
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹149",
    period: "/month",
    storage: "2 TB",
    description: "For power users & creators.",
    features: [
      "Everything in Basic",
      "2 TB high-speed storage",
      "Smart Sync technology",
      "30-day version history",
      "Priority 24/7 support"
    ],
    popular: true,
    icon: Zap,
    gradient: "from-[#3B82F6] to-blue-600",
    buttonStyle: "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/30",
    cardBorder: "border-[#3B82F6] dark:border-[#3B82F6]",
    glow: "shadow-xl shadow-blue-500/15 dark:shadow-blue-500/25",
    badge: "Most Popular"
  },
  {
    key: "family",
    name: "Family",
    price: "₹299",
    period: "/month",
    storage: "5 TB",
    description: "Full workspace for up to 6 members.",
    features: [
      "Everything in Pro",
      "5 TB total shared vault",
      "Private accounts for 6 users",
      "Shared team room folder",
      "Centralized billing & admin"
    ],
    icon: Crown,
    gradient: "from-purple-600 to-indigo-600",
    buttonStyle: "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30",
    cardBorder: "border-purple-500 dark:border-purple-500/80",
    glow: "shadow-xl shadow-purple-500/20 dark:shadow-purple-500/30",
    badge: "Best Value"
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const checkoutLoading = useSelector((state) => state.payment.checkoutLoading);
  const checkoutPlan = useSelector((state) => state.payment.checkoutPlan);
  const [error, setError] = useState("");

  const token = getToken();
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
        window.location.assign(result.payload.checkoutUrl);
        return;
      }

      setError(result.payload || "Failed to create checkout session. Please try again.");
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  const displayError = error || subscriptionError;
  const user = useSelector((state) => state.auth.user);

  const formatStorage = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return "0 GB";
    const num = Number(bytes);
    if (num <= 0) return "0 GB";
    const gb = num / (1024 * 1024 * 1024);
    if (gb < 0.01) {
      const mb = num / (1024 * 1024);
      return `${Math.max(0, mb).toFixed(1)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const currentPlan = PLANS.find((p) => p.key === currentPlanKey);

  const storageUsed = Math.max(0, Number(user?.storageUsed) || 0);
  const storageLimit = Number(user?.storageLimit) && !isNaN(user.storageLimit) && user.storageLimit > 0
    ? Number(user.storageLimit)
    : (currentPlanKey === 'pro' ? 2 * 1024 * 1024 * 1024 * 1024 : currentPlanKey === 'family' ? 5 * 1024 * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024);

  const usagePercentage = Math.max(0, Math.min(Math.round((storageUsed / storageLimit) * 100), 100));

  const displayUsedStorage = formatStorage(storageUsed);
  const displayLimitStorage = formatStorage(storageLimit);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] font-['Inter'] selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden transition-colors duration-200">
      
      {/* NAVBAR */}
      <nav className="relative z-20 bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-xl border-b border-gray-200 dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-linear-to-tr from-blue-600 to-blue-400 dark:from-[#3B82F6] dark:to-blue-400 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-md shadow-blue-500/20">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-[#F8FAFC]">
                DataStock
              </span>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isLoggedIn && (
                <button
                  onClick={refreshUserAndSubscription}
                  disabled={subscriptionLoading}
                  className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] dark:hover:text-[#F8FAFC] font-semibold transition-colors disabled:opacity-60"
                >
                  {subscriptionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                  )}
                  Refresh plan
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] dark:hover:text-[#F8FAFC] font-semibold transition-colors group"
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
      <section className="relative z-10 pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          
          {/* Hero Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-[#1E293B] px-4 py-1.5 rounded-full border border-blue-200 dark:border-[#334155] shadow-xs mb-4">
              <Shield className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-[#60A5FA]">
                Transparent Pricing • Cancel Anytime
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mb-4 tracking-tight leading-tight">
              Simple pricing.{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#3B82F6] to-indigo-500">
                No surprises.
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-[#94A3B8]">
              Start for free today. Upgrade anytime as your storage needs grow.
            </p>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="max-w-md mx-auto mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-5 py-3 text-red-700 dark:text-red-300 text-xs sm:text-sm text-center shadow-sm font-medium">
              {displayError}
            </div>
          )}

          {/* Storage usage widget (if logged in) */}
          {isLoggedIn && (
            <div className="max-w-xl mx-auto mb-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-[#334155] p-5 shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#3B82F6] shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Storage Usage</span>
                    <p className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                      {displayUsedStorage} / {displayLimitStorage}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg">
                    {usagePercentage}% used
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-gray-100 dark:bg-[#0F172A] rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-1">
                <span>Current Plan: <strong className="text-gray-900 dark:text-white font-bold">{currentPlan ? currentPlan.name : 'Basic'}</strong></span>
                <span>{displayLimitStorage} Total Capacity</span>
              </div>
            </div>
          )}

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const isLoading = checkoutLoading && checkoutPlan === plan.key;
              const isCurrentPlan = isLoggedIn && currentPlanKey === plan.key;
              const buttonStyle = isCurrentPlan
                ? "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-default"
                : plan.buttonStyle;

              return (
                <div
                  key={plan.key}
                  className={`relative group bg-white dark:bg-[#1E293B] rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 ${plan.glow} ${
                    isCurrentPlan
                      ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/20 shadow-xl"
                      : plan.popular
                      ? `${plan.cardBorder} shadow-lg`
                      : `${plan.cardBorder} hover:border-gray-300 dark:hover:border-slate-600`
                  }`}
                >
                  {/* Badges */}
                  {plan.badge && !isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className={`text-white text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 ${
                        plan.key === 'family'
                          ? 'bg-linear-to-r from-purple-600 to-indigo-600'
                          : 'bg-[#3B82F6]'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl bg-linear-to-br ${plan.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform duration-300`}
                  >
                    <PlanIcon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 dark:text-[#94A3B8] text-xs mb-5">{plan.description}</p>

                  <div className="flex items-end mb-5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-[#F8FAFC] tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 dark:text-[#94A3B8] ml-1.5 mb-1 text-sm font-medium">{plan.period}</span>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0F172A]/70 rounded-xl p-3.5 mb-6 border border-gray-200/80 dark:border-[#334155]/60 flex items-center justify-between">
                    <span className={`font-extrabold text-lg ${plan.key === 'family' ? 'text-purple-600 dark:text-purple-400' : 'text-[#3B82F6]'}`}>
                      {plan.storage}
                    </span>
                    <span className="text-gray-500 dark:text-[#94A3B8] text-xs font-medium">cloud storage</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-xs sm:text-sm text-gray-700 dark:text-[#94A3B8]">
                        <CheckCircle2 className={`w-4 h-4 mr-2.5 shrink-0 mt-0.5 ${plan.key === 'family' ? 'text-purple-500' : 'text-[#3B82F6]'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.key)}
                    disabled={isLoading || subscriptionLoading || isCurrentPlan}
                    className={`w-full py-3.5 rounded-xl font-extrabold transition-all duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${buttonStyle}`}
                  >
                    {subscriptionLoading && !checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.key === "basic" ? (
                      isLoggedIn ? "Go to Dashboard" : "Get Started Free"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-6 text-gray-500 dark:text-[#94A3B8]">
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-4 py-2 rounded-full border border-gray-200 dark:border-[#334155] shadow-2xs">
              <Shield className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs font-semibold">256-bit AES encryption</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-4 py-2 rounded-full border border-gray-200 dark:border-[#334155] shadow-2xs">
              <HardDrive className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs font-semibold">99.9% uptime SLA</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-4 py-2 rounded-full border border-gray-200 dark:border-[#334155] shadow-2xs">
              <Clock className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs font-semibold">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-4 py-2 rounded-full border border-gray-200 dark:border-[#334155] shadow-2xs">
              <Users className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs font-semibold">24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white dark:bg-[#0F172A] border-t border-gray-200 dark:border-[#334155] pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-[#334155]">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-9 h-9 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-md">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl text-gray-900 dark:text-white">DataStock</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-semibold text-gray-600 dark:text-[#94A3B8]">
              <button onClick={() => navigate("/help")} className="hover:text-[#3B82F6] transition">Docs</button>
              <button onClick={() => navigate("/help")} className="hover:text-[#3B82F6] transition">Security</button>
              <button onClick={() => navigate("/help")} className="hover:text-[#3B82F6] transition">Privacy</button>
              <button onClick={() => navigate("/help")} className="hover:text-[#3B82F6] transition">Terms</button>
              <button onClick={() => navigate("/help")} className="hover:text-[#3B82F6] transition">Contact</button>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#3B82F6] transition flex items-center gap-1">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
            <p>© {new Date().getFullYear()} DataStock Inc. All rights reserved.</p>
            <p className="flex items-center gap-1 font-medium">
              <span>Made with</span> <span className="text-red-500">♥</span> <span>for secure cloud data</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
