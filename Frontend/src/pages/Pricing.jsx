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
  Lock,
  X
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
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    period: "forever",
    storage: "10 GB",
    description: "Essential storage for individuals.",
    features: [
      "10 GB secure cloud storage",
      "Standard link sharing",
      "Access on all web devices",
      "Standard encryption"
    ],
    ctaText: "Start Free Plan",
    icon: Cloud,
    gradient: "from-slate-600 to-slate-700",
    buttonStyle: "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600",
    cardBorder: "border-gray-200 dark:border-[#334155]",
    glow: "shadow-md hover:shadow-xl hover:border-slate-400 dark:hover:border-slate-600",
    badge: null
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: "₹149",
    yearlyPrice: "₹119",
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
    ctaText: "Unlock Pro Today",
    popular: true,
    icon: Zap,
    gradient: "from-[#3B82F6] to-blue-600",
    buttonStyle: "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/25",
    cardBorder: "border-[#3B82F6] dark:border-[#3B82F6]",
    glow: "shadow-xl shadow-blue-500/20 dark:shadow-blue-500/30",
    badge: "Most Popular"
  },
  {
    key: "family",
    name: "Family",
    monthlyPrice: "₹299",
    yearlyPrice: "₹239",
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
    ctaText: "Get Family Pass",
    icon: Crown,
    gradient: "from-purple-600 to-indigo-600",
    buttonStyle: "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30",
    cardBorder: "border-purple-500 dark:border-purple-500",
    glow: "shadow-xl shadow-purple-500/25 dark:shadow-purple-500/35",
    badge: "Best Value"
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const checkoutLoading = useSelector((state) => state.payment.checkoutLoading);
  const checkoutPlan = useSelector((state) => state.payment.checkoutPlan);
  
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
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
              <img 
                src="/datastock-logo.svg" 
                alt="DataStock Logo" 
                className="w-10 h-10 rounded-xl transform group-hover:scale-105 transition-transform duration-300 shadow-md shadow-blue-500/20" 
              />
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-[#F8FAFC]">
                Data<span className="text-[#3B82F6]">Stock</span>
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
      <section className="relative z-10 pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          
          {/* Hero Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
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
            <p className="text-base sm:text-lg text-gray-600 dark:text-[#94A3B8]">
              Start for free today. Upgrade anytime as your storage needs grow.
            </p>
          </div>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center p-1 bg-gray-200/80 dark:bg-[#1E293B] rounded-2xl border border-gray-300 dark:border-[#334155] shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-[#3B82F6] text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-[#3B82F6] text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Save 20%
                </span>
              </button>
            </div>
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

              {/* Animated Progress Bar */}
              <div className="w-full h-3 bg-gray-100 dark:bg-[#0F172A] rounded-full overflow-hidden mb-2.5 relative">
                <div
                  className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ width: `${usagePercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-1">
                <span>Current Plan: <strong className="text-gray-900 dark:text-white font-bold">{currentPlan ? currentPlan.name : 'Basic'}</strong></span>
                <span>{displayLimitStorage} Total Capacity</span>
              </div>
            </div>
          )}

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const isLoading = checkoutLoading && checkoutPlan === plan.key;
              const isCurrentPlan = isLoggedIn && currentPlanKey === plan.key;
              
              const priceDisplay = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

              const buttonStyle = isCurrentPlan
                ? "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-default"
                : plan.buttonStyle;

              return (
                <div
                  key={plan.key}
                  className={`relative group bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 ${plan.glow} ${
                    isCurrentPlan
                      ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/20 shadow-xl"
                      : plan.popular
                      ? `${plan.cardBorder} shadow-lg`
                      : `${plan.cardBorder}`
                  }`}
                >
                  {/* Badges */}
                  {plan.badge && !isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
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
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Consistent Icon Style Container */}
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
                        {priceDisplay}
                      </span>
                      <span className="text-gray-500 dark:text-[#94A3B8] ml-1.5 mb-1 text-sm font-medium">
                        {plan.period}
                      </span>
                      {billingCycle === 'yearly' && plan.key !== 'basic' && (
                        <span className="ml-auto text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          Billed yearly
                        </span>
                      )}
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
                  </div>

                  {/* Action Button */}
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
                      isLoggedIn ? "Go to Dashboard" : plan.ctaText
                    ) : (
                      plan.ctaText
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* FEATURE COMPARISON MATRIX TABLE */}
          {/* ======================================================== */}
          <div className="mt-24 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                Detailed Feature Comparison
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed comparison of capabilities across all DataStock plans.
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-xl">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0F172A] border-b border-gray-200 dark:border-[#334155]">
                    <th className="p-4 sm:p-5 text-sm font-extrabold text-gray-900 dark:text-white w-2/5">Features</th>
                    <th className="p-4 sm:p-5 text-sm font-extrabold text-gray-700 dark:text-gray-300 text-center w-1/5">Basic</th>
                    <th className="p-4 sm:p-5 text-sm font-extrabold text-[#3B82F6] text-center w-1/5">Pro</th>
                    <th className="p-4 sm:p-5 text-sm font-extrabold text-purple-600 dark:text-purple-400 text-center w-1/5">Family</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#334155]/60 text-xs sm:text-sm">
                  {[
                    { section: "Storage & Performance" },
                    { feature: "Cloud Storage Quota", basic: "10 GB", pro: "2 TB", family: "5 TB" },
                    { feature: "Max File Upload Size", basic: "100 MB", pro: "10 GB", family: "50 GB" },
                    { feature: "Upload / Download Speed", basic: "Standard", pro: "Ultra-Fast", family: "High Priority" },
                    
                    { section: "Security & Backup" },
                    { feature: "256-Bit AES Encryption", basic: "✓", pro: "✓", family: "✓" },
                    { feature: "File Version History", basic: "7 Days", pro: "30 Days", family: "90 Days" },
                    { feature: "Zero-Knowledge Privacy", basic: "✓", pro: "✓", family: "✓" },
                    
                    { section: "Collaboration & Workspaces" },
                    { feature: "Password Protected Links", basic: "—", pro: "✓", family: "✓" },
                    { feature: "Multi-User Accounts", basic: "1 User", pro: "1 User", family: "Up to 6 Users" },
                    { feature: "Team Shared Room Vault", basic: "—", pro: "—", family: "✓" },

                    { section: "AI & Support" },
                    { feature: "AI Search & Summarization", basic: "Basic", pro: "Full AI", family: "Unlimited AI" },
                    { feature: "Support SLA", basic: "Community", pro: "24/7 Priority", family: "Dedicated Admin" }
                  ].map((item, idx) => (
                    item.section ? (
                      <tr key={idx} className="bg-gray-100/70 dark:bg-[#0F172A]/40 font-extrabold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <td colSpan={4} className="py-2.5 px-4 sm:px-5">{item.section}</td>
                      </tr>
                    ) : (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-[#0F172A]/20 transition-colors">
                        <td className="p-4 sm:p-5 font-semibold text-gray-800 dark:text-gray-200">{item.feature}</td>
                        <td className="p-4 sm:p-5 text-center font-bold text-gray-600 dark:text-gray-400">{item.basic}</td>
                        <td className="p-4 sm:p-5 text-center font-extrabold text-[#3B82F6]">{item.pro}</td>
                        <td className="p-4 sm:p-5 text-center font-extrabold text-purple-600 dark:text-purple-400">{item.family}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate("/")}>
              <img 
                src="/datastock-logo.svg" 
                alt="DataStock Logo" 
                className="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200" 
              />
              <span className="font-extrabold text-xl text-gray-900 dark:text-white">Data<span className="text-[#3B82F6]">Stock</span></span>
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
