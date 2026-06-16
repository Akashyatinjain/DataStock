import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Cloud, Sparkles, Crown } from "lucide-react";

const PLAN_DETAILS = {
  PRO: {
    name: "Pro",
    storage: "2 TB",
    color: "from-emerald-500 to-green-600",
    icon: Sparkles,
    features: ["2TB secure storage", "Smart Sync", "Priority 24/7 support", "30-day version history"],
  },
  FAMILY: {
    name: "Family",
    storage: "5 TB",
    color: "from-violet-500 to-purple-600",
    icon: Crown,
    features: ["5TB secure storage", "Up to 6 users", "Family room folder", "Centralized billing"],
  },
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan") || "PRO";
  const plan = PLAN_DETAILS[planKey] || PLAN_DETAILS.PRO;
  const PlanIcon = plan.icon;

  const [showContent, setShowContent] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 400);
    const t2 = setTimeout(() => setShowFeatures(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-4 font-['Inter'] overflow-hidden relative">
      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/5 rounded-full blur-[150px]" />
      </div>

      {/* Confetti particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            backgroundColor: ["#34d399", "#10b981", "#6ee7b7", "#a78bfa", "#f59e0b", "#ec4899"][i % 6],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-lg w-full">
        {/* Success checkmark animation */}
        <div className={`text-center mb-8 transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 bg-green-500/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute w-20 h-20 bg-green-500/30 rounded-full animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-gray-400 text-lg">
            Welcome to DataStock <span className="text-white font-semibold">{plan.name}</span>
          </p>
        </div>

        {/* Plan card */}
        <div className={`bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 shadow-2xl transition-all duration-700 delay-200 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Plan header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700/50">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
              <PlanIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{plan.name} Plan</h2>
              <p className="text-green-400 font-semibold">{plan.storage} of secure storage</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {plan.features.map((feature, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${showFeatures ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                style={{ transitionDelay: `${i * 100 + 600}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-gray-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-full py-3 bg-gray-700/50 text-gray-300 rounded-2xl font-semibold hover:bg-gray-700 transition-all duration-200 border border-gray-600/50"
            >
              View Profile
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className={`text-center text-sm text-gray-500 mt-6 transition-all duration-700 delay-500 ${showContent ? "opacity-100" : "opacity-0"}`}>
          A confirmation email has been sent to your registered email address.
        </p>
      </div>

      {/* CSS Animations */}
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
