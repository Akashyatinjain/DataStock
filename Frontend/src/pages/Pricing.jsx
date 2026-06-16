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
} from "lucide-react";
import { createCheckoutSession } from "../api/payment.api";

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
    gradient: "from-gray-600 to-gray-700",
    buttonStyle: "bg-white text-gray-900 hover:bg-gray-100",
    cardBorder: "border-gray-700",
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
    gradient: "from-green-500 to-emerald-600",
    buttonStyle:
      "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30",
    cardBorder: "border-green-500",
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
    buttonStyle: "bg-white text-gray-900 hover:bg-gray-100",
    cardBorder: "border-gray-700",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const handleSelectPlan = async (planKey) => {
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
      setLoadingPlan(planKey);
      setError("");
      const result = await createCheckoutSession(planKey);

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError("Failed to create checkout session. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-['Inter'] selection:bg-green-200 selection:text-green-900">
      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-md">
                <Cloud className="w-6 h-6 text-gray-900" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">
                DataStock
              </span>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Go Back
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700 shadow-sm mb-6">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                30-day money back guarantee
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Simple pricing.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                No surprises.
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Start for free, upgrade when you need more space.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="max-w-md mx-auto mb-8 bg-red-900/40 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const isLoading = loadingPlan === plan.key;

              return (
                <div
                  key={plan.key}
                  className={`relative bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                    plan.popular
                      ? `${plan.cardBorder} shadow-2xl shadow-green-900/30 transform md:-translate-y-4`
                      : `${plan.cardBorder} hover:border-gray-600`
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <PlanIcon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  <div className="flex items-end mb-6">
                    <span className="text-5xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 ml-2 mb-1">
                      {plan.period}
                    </span>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-4 mb-8 border border-gray-700/50">
                    <span className="text-green-400 font-bold text-xl">
                      {plan.storage}
                    </span>
                    <span className="text-gray-400 ml-2">secure storage</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.key)}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-200 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${plan.buttonStyle}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Redirecting...
                      </>
                    ) : plan.key === "basic" ? (
                      isLoggedIn ? (
                        "Current Plan"
                      ) : (
                        "Get Started"
                      )
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">
                256-bit AES encryption
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">99.9% uptime SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} DataStock Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
