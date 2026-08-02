import React, { useState, useEffect } from 'react';
import {
  Cloud,
  HardDrive,
  Share2,
  Lock,
  Users,
  Clock,
  Download,
  Upload,
  Folder,
  File,
  Image as ImageIcon,
  Menu,
  X,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Play,
  FileText,
  Search,
  Sparkles,
  Eye,
  Trash2,
  Check,
  HelpCircle,
  Mail,
  MessageSquare,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Server,
  LockKeyhole
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { startCheckout } from "../store/slices/paymentSlice";
import useSubscription from "../hooks/useSubscription";
import ThemeToggle from "../components/ui/ThemeToggle";
import { fetchProfile } from "../store/slices/authSlice";
import { fetchAllFiles } from "../store/slices/filesSlice";
import { fetchFolders } from "../store/slices/foldersSlice";

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const allFiles = useSelector((state) => state.files.allFiles || []);
  const folders = useSelector((state) => state.folders.folders || []);

  const checkoutLoading = useSelector((state) => state.payment.checkoutLoading);
  const checkoutPlan = useSelector((state) => state.payment.checkoutPlan);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Product Showcase Tab state
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('dashboard'); // 'dashboard' | 'upload' | 'folders' | 'preview'

  // Modals state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const { currentPlanKey } = useSubscription({ enabled: isLoggedIn });

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchProfile());
      dispatch(fetchAllFiles());
      dispatch(fetchFolders());
    }
  }, [dispatch, isLoggedIn]);

  // Demo auto-advance interval
  useEffect(() => {
    let timer;
    if (showDemoModal && isPlayingDemo) {
      timer = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 4);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [showDemoModal, isPlayingDemo]);

  const formatStorage = (bytes) => {
    if (!bytes) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.01) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const getFileIcon = (filename) => {
    if (!filename) return File;
    const ext = filename.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return ImageIcon;
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return FileText;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return Play;
    return File;
  };

  const getFileColorClasses = (filename) => {
    if (!filename) return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-[#334155]' };
    const ext = filename.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return { color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' };
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' };
    return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-[#334155]' };
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const storageUsed = isLoggedIn && user ? user.storageUsed : 4.5 * 1024 * 1024 * 1024;
  const storageLimit = isLoggedIn && user ? Number(user.storageLimit) : 10 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min((storageUsed / (storageLimit || 1)) * 100, 100);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleDashboardClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handlePlanSelect = async (planKey) => {
    const normalizedKey = planKey.toLowerCase();

    if (normalizedKey === 'basic') {
      navigate(isLoggedIn ? '/dashboard' : '/signup');
      return;
    }

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (currentPlanKey === normalizedKey) {
      navigate('/dashboard');
      return;
    }

    try {
      setCheckoutError("");
      const result = await dispatch(startCheckout(normalizedKey));
      if (startCheckout.fulfilled.match(result) && result.payload.success && result.payload.checkoutUrl) {
        window.location.assign(result.payload.checkoutUrl);
        return;
      }
      setCheckoutError(result.payload || "Failed to start checkout. Please try again.");
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError('Failed to start checkout. Please try again.');
    }
  };

  const demoSteps = [
    {
      title: "1. Drag & Drop Instant Upload",
      desc: "Drop files anywhere in your browser. Automatic background hashing, compression, and AES-256 encryption guarantee maximum speed and security.",
      badge: "Fast & Encrypted",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "2. AI Semantic Search & Smart Tagging",
      desc: "Find files using natural language. Query 'find my Q3 revenue presentation' or 'contracts signed last month' and get instant AI results.",
      badge: "AI Powered",
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "3. Intelligent Folder Organization",
      desc: "Create dynamic nested folder hierarchies, label files with color tags, and maintain complete control over team workspace permissions.",
      badge: "Clean Workspaces",
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "4. One-Click Instant Public & Private Share",
      desc: "Share single files or whole folders with expiration dates, password protection, and granular access controls.",
      badge: "Instant Links",
      color: "from-amber-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] font-['Inter'] selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-[#3B82F6] dark:selection:text-[#F8FAFC] overflow-x-hidden transition-colors duration-200">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-xl border-b border-gray-200/80 dark:border-[#334155] shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src="/datastock-logo.svg" 
                alt="DataStock Logo" 
                className="w-10 h-10 rounded-xl transform group-hover:scale-105 transition-transform duration-300 shadow-md shadow-blue-500/20" 
              />
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-[#F8FAFC]">Data<span className="text-[#3B82F6]">Stock</span></span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-7">
              <button 
                onClick={handleDashboardClick}
                className="text-gray-700 dark:text-[#94A3B8] hover:text-[#3B82F6] font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                {isLoggedIn && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
              </button>
              <a href="#features" className="text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] font-medium transition-colors">Features</a>
              <a href="#security" className="text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] font-medium transition-colors flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Security</span>
              </a>
              <button onClick={() => navigate('/help')} className="text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] font-medium transition-colors">Docs</button>
              <a href="#pricing" className="text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] font-medium transition-colors">Pricing</a>
              <button onClick={() => setShowContactModal(true)} className="text-gray-600 dark:text-[#94A3B8] hover:text-[#3B82F6] font-medium transition-colors">Contact</button>

              <div className="flex items-center space-x-3 ml-2 pl-4 border-l border-gray-200 dark:border-[#334155]">
                <ThemeToggle />
                {isLoggedIn ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white font-semibold hover:bg-[#2563EB] transform hover:-translate-y-0.5 transition-all duration-200 shadow-md shadow-[#3B82F6]/25 flex items-center space-x-2"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="px-4 py-2.5 text-gray-700 dark:text-[#94A3B8] font-semibold hover:text-[#3B82F6] transition-colors"
                    >
                      Log in
                    </button>
                    <button
                      onClick={handleSignup}
                      className="px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white font-semibold hover:bg-[#2563EB] transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-[#3B82F6]/30"
                    >
                      Get Started Free
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-[#F8FAFC]" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-[#F8FAFC]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute w-full bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-[#334155] shadow-xl transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-120 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-4 py-6 space-y-3 flex flex-col">
            <button onClick={() => { setIsMenuOpen(false); handleDashboardClick(); }} className="px-4 py-2 text-left text-gray-800 dark:text-[#F8FAFC] font-semibold hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg">Dashboard</button>
            <a href="#features" className="px-4 py-2 text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#security" className="px-4 py-2 text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg font-medium flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Security</span>
            </a>
            <button onClick={() => { setIsMenuOpen(false); navigate('/help'); }} className="px-4 py-2 text-left text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg font-medium">Docs</button>
            <a href="#pricing" className="px-4 py-2 text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <button onClick={() => { setIsMenuOpen(false); setShowContactModal(true); }} className="px-4 py-2 text-left text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg font-medium">Contact</button>

            <div className="h-px bg-gray-100 dark:bg-[#334155] my-2"></div>

            {isLoggedIn ? (
              <button
                onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}
                className="w-full px-4 py-3 bg-[#3B82F6] text-white rounded-xl font-semibold hover:bg-[#2563EB] shadow-md flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setIsMenuOpen(false); handleLogin(); }}
                  className="w-full text-left px-4 py-3 text-gray-900 dark:text-[#F8FAFC] font-semibold hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg"
                >
                  Log in
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); handleSignup(); }}
                  className="w-full px-4 py-3 bg-[#3B82F6] text-white rounded-xl font-semibold hover:bg-[#2563EB] shadow-md"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#3B82F6]/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-48 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-[#1E293B] px-4 py-2 rounded-full border border-blue-200 dark:border-[#334155] shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-[#60A5FA]">
                Next-Gen Cloud Storage Platform
              </span>
            </div>

            {/* Main Practical Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-[#F8FAFC] tracking-tight mb-8 leading-[1.15]">
              Store, organize and share <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#3B82F6] via-blue-500 to-indigo-600 dark:from-[#60A5FA] dark:to-indigo-400">
                your files securely.
              </span>
            </h1>

            {/* Practical Unique Subtitle */}
            <p className="text-lg sm:text-2xl text-gray-600 dark:text-[#94A3B8] mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Store files securely. Share instantly. Access anywhere.
            </p>

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={handleSignup}
                className="w-full sm:w-auto px-8 py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl font-bold text-lg transform hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 group"
              >
                <span>Start for free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-[#F8FAFC] rounded-2xl font-semibold text-lg border border-gray-200 dark:border-[#334155] hover:border-[#3B82F6] dark:hover:border-[#3B82F6] hover:text-[#3B82F6] dark:hover:text-[#3B82F6] transition-all duration-200 shadow-sm flex items-center justify-center space-x-2.5 group"
              >
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-current text-[#3B82F6] ml-0.5" />
                </div>
                <span>See how it works</span>
              </button>
            </div>
            <p className="mt-5 text-sm text-gray-500 dark:text-[#94A3B8] font-medium flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 inline" />
              <span>No credit card required. 10GB free forever.</span>
            </p>
          </div>

          {/* ======================================================== */}
          {/* HUGE PRODUCT SCREENSHOT / GLASSMORPHISM SHOWCASE */}
          {/* ======================================================== */}
          <div className="mt-16 relative max-w-6xl mx-auto px-1 sm:px-0">
            {/* Multi-Tab Switcher Controls Bar */}
            <div className="flex justify-center mb-6 overflow-x-auto py-2 px-2 no-scrollbar">
              <div className="inline-flex p-1.5 rounded-2xl bg-gray-200/70 dark:bg-[#1E293B]/90 backdrop-blur-lg border border-gray-300/60 dark:border-[#334155] shadow-inner gap-1">
                {[
                  { id: 'dashboard', label: '🖥️ Dashboard View', icon: HardDrive },
                  { id: 'upload', label: '📤 Drag & Drop Upload', icon: Upload },
                  { id: 'folders', label: '📁 Folder Management', icon: Folder },
                  { id: 'preview', label: '👁️ AI File Preview', icon: Sparkles }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveShowcaseTab(tab.id)}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                      activeShowcaseTab === tab.id
                        ? 'bg-white dark:bg-[#3B82F6] text-blue-600 dark:text-white shadow-md'
                        : 'text-gray-600 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Glass effect main container */}
            <div className="relative group">
              {/* Outer Glow Halo */}
              <div className="absolute -inset-1 bg-linear-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              {/* Main Glass Shell */}
              <div className="relative bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl rounded-3xl border border-gray-200/90 dark:border-[#334155] shadow-2xl overflow-hidden transition-all duration-300">
                
                {/* Window Bar Header */}
                <div className="bg-gray-100/90 dark:bg-[#0F172A]/90 px-4 py-3 flex items-center justify-between border-b border-gray-200/80 dark:border-[#334155] select-none">
                  <div className="flex space-x-2 shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400/90 hover:bg-red-500 transition-colors"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/90 hover:bg-yellow-500 transition-colors"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-green-400/90 hover:bg-green-500 transition-colors"></div>
                  </div>

                  <div className="bg-white/90 dark:bg-[#1E293B]/90 text-xs font-mono font-medium text-gray-500 dark:text-[#94A3B8] px-6 sm:px-16 py-1.5 rounded-lg border border-gray-200 dark:border-[#334155] truncate max-w-xs sm:max-w-md w-full text-center flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>datastock.app/dashboard/{activeShowcaseTab}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="hidden sm:inline">256-Bit Encrypted</span>
                  </div>
                </div>

                {/* TAB 1: DASHBOARD VIEW */}
                {activeShowcaseTab === 'dashboard' && (
                  <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-[#0F172A]/60 flex flex-col md:flex-row gap-6">
                    {/* Mock Sidebar */}
                    <div className="hidden md:block w-60 bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-200/70 dark:border-[#334155] shadow-sm">
                      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100 dark:border-[#334155]">
                        <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <Cloud className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-[#F8FAFC] text-sm">My Drive</p>
                          <p className="text-[11px] text-gray-400">Main Vault</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {[
                          { name: 'All Files', icon: HardDrive, active: true },
                          { name: 'Starred', icon: Sparkles, active: false },
                          { name: 'Shared Link', icon: Share2, active: false },
                          { name: 'Trash Recovery', icon: Trash2, active: false },
                        ].map((item, i) => (
                          <div key={i} className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${item.active ? 'bg-blue-50 dark:bg-[#3B82F6]/15 text-[#3B82F6]' : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155]'}`}>
                            <div className="flex items-center space-x-2.5">
                              <item.icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </div>
                            {item.active && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>}
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-[#334155]">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-500 dark:text-[#94A3B8] font-medium">Storage Quota</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {formatStorage(storageUsed)} / 10 GB
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden">
                          <div className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${storagePercentage}%` }}></div>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Free tier active
                        </p>
                      </div>
                    </div>

                    {/* Main Mock Area */}
                    <div className="flex-1 bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-6 border border-gray-200/70 dark:border-[#334155] shadow-sm">
                      {/* Search Bar with AI Prompt */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-6">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            readOnly
                            value="AI Search: 'Find Q3 quarterly financial deck & budget'"
                            className="w-full pl-10 pr-24 py-2 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-[#334155] rounded-xl text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium focus:outline-none"
                          />
                          <span className="absolute right-2 top-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-[#3B82F6] dark:text-blue-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Active
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm shrink-0"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload File</span>
                        </button>
                      </div>

                      {/* Folder Grid */}
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Folders</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                        {[
                          { name: 'Product Specs', count: '12 files', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                          { name: 'Brand Assets', count: '48 files', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                          { name: 'Financial Reports', count: '8 files', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' }
                        ].map((f, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-gray-100 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer bg-gray-50/50 dark:bg-[#0F172A]/40 flex items-center space-x-3">
                            <div className={`p-2.5 rounded-lg ${f.bg}`}>
                              <Folder className={`w-5 h-5 ${f.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{f.name}</p>
                              <p className="text-[10px] text-gray-400">{f.count}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recent Files Grid */}
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Files</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { name: 'Q3_Financial_Deck.pdf', size: '4.2 MB', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                          { name: 'App_Architecture.png', size: '8.1 MB', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                          { name: 'Product_Demo.mp4', size: '24.5 MB', icon: Play, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' }
                        ].map((file, i) => {
                          const Icon = file.icon;
                          return (
                            <div key={i} className="p-3.5 rounded-xl border border-gray-100 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer bg-gray-50/50 dark:bg-[#0F172A]/40 group">
                              <div className="flex justify-between items-start mb-3">
                                <div className={`p-2.5 rounded-lg ${file.bg}`}>
                                  <Icon className={`w-5 h-5 ${file.color}`} />
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">Synced</span>
                              </div>
                              <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1 truncate">{file.name}</h4>
                              <p className="text-[10px] text-gray-400">{file.size} • Encrypted</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: DRAG & DROP UPLOAD INTERFACE */}
                {activeShowcaseTab === 'upload' && (
                  <div className="p-6 bg-slate-50/50 dark:bg-[#0F172A]/60">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 sm:p-8 border-2 border-dashed border-blue-400/70 dark:border-blue-500/50 shadow-sm text-center relative overflow-hidden">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
                        <Upload className="w-8 h-8 text-[#3B82F6] animate-bounce" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Drop your files here to upload
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Supports images, documents, videos, and zip files. Automatically encrypted with AES-256 before storing.
                      </p>

                      {/* Active Uploading Progress Simulation */}
                      <div className="max-w-xl mx-auto space-y-3 text-left">
                        <div className="p-3.5 bg-gray-50 dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-[#334155]">
                          <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                            <span className="truncate">Uploading Design_System_v2.fig</span>
                            <span className="text-[#3B82F6]">84% • 3.2 MB/s</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-[#334155] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full w-[84%] transition-all duration-300"></div>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-[#334155] flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Marketing_Roadmap.pdf</span>
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">12.4 MB • Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FOLDER MANAGEMENT */}
                {activeShowcaseTab === 'folders' && (
                  <div className="p-6 bg-slate-50/50 dark:bg-[#0F172A]/60">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-gray-200/70 dark:border-[#334155]">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Workspace Folders</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Organize files by team, client, or personal projects</p>
                        </div>
                        <button className="bg-blue-50 dark:bg-blue-900/30 text-[#3B82F6] dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                          <Folder className="w-4 h-4" /> + New Folder
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { name: '🚀 Launch Assets', items: '24 files', size: '1.4 GB', shared: 'Team Access' },
                          { name: '📄 Client Contracts', items: '15 files', size: '240 MB', shared: 'Encrypted' },
                          { name: '🎨 UI Mockups', items: '82 files', size: '3.8 GB', shared: 'Shared Link' },
                          { name: '📊 Q4 Analytics', items: '9 files', size: '180 MB', shared: 'Private' }
                        ].map((folder, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-[#334155] bg-gray-50/70 dark:bg-[#0F172A]/50 hover:border-blue-400 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-[#3B82F6]">
                                <Folder className="w-6 h-6 fill-current" />
                              </div>
                              <span className="text-[10px] font-semibold bg-gray-200 dark:bg-[#334155] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                {folder.shared}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{folder.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{folder.items} • {folder.size}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: AI FILE PREVIEW */}
                {activeShowcaseTab === 'preview' && (
                  <div className="p-6 bg-slate-50/50 dark:bg-[#0F172A]/60">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-gray-200/70 dark:border-[#334155] flex flex-col md:flex-row gap-6">
                      <div className="flex-1 bg-gray-100 dark:bg-[#0F172A] rounded-xl p-6 border border-gray-200 dark:border-[#334155] flex flex-col items-center justify-center min-h-60 text-center">
                        <FileText className="w-16 h-16 text-emerald-500 mb-3" />
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-base">Q3_Executive_Summary.pdf</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2.8 MB • Adobe PDF Document</p>
                      </div>

                      <div className="w-full md:w-80 bg-blue-50/60 dark:bg-[#0F172A]/80 rounded-xl p-5 border border-blue-200 dark:border-[#334155]">
                        <div className="flex items-center space-x-2 text-[#3B82F6] font-bold text-xs uppercase tracking-wider mb-3">
                          <Sparkles className="w-4 h-4" />
                          <span>AI Smart Insights</span>
                        </div>
                        <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Automated Executive Summary</h5>
                        <p className="text-xs text-gray-600 dark:text-[#94A3B8] leading-relaxed mb-4">
                          "Revenue grew 34% YoY. Key cost reductions achieved in infrastructure. Product launch scheduled for Q4 with 10k beta users."
                        </p>
                        <div className="space-y-2 pt-3 border-t border-blue-200/60 dark:border-[#334155]">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span>Key Tags</span>
                            <span className="font-bold text-[#3B82F6]">Finance, Q3, Strategy</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span>Access Level</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Team Restricted</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 border-t border-b border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">
            TRUSTED BY OVER 100,000+ CREATORS AND INNOVATIVE TEAMS WORLDWIDE
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 dark:opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-xl sm:text-2xl font-black tracking-tight text-gray-800 dark:text-gray-300">ACME CORP</div>
            <div className="text-xl sm:text-2xl font-extrabold italic text-gray-800 dark:text-gray-300">GlobalTech</div>
            <div className="text-xl sm:text-2xl font-medium tracking-widest text-gray-800 dark:text-gray-300">NEXUS</div>
            <div className="text-xl sm:text-2xl font-black lowercase text-gray-800 dark:text-gray-300">horizon</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-300 flex items-center">
              <Cloud className="w-5 h-5 mr-1 text-[#3B82F6]" /> Vertex
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED SECURITY & TRUST SECTION */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-900/50 border border-blue-700/50 px-3.5 py-1.5 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise Grade Security</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Your files are guarded with bank-grade encryption.
            </h2>
            <p className="text-lg text-slate-400">
              We put security and privacy at the core of DataStock. Your data is encrypted before it ever leaves your device.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: LockKeyhole,
                title: "256-Bit AES Encryption",
                desc: "All files are encrypted both in transit (TLS 1.3) and at rest using military-grade 256-bit AES algorithms."
              },
              {
                icon: Shield,
                title: "Zero-Knowledge Architecture",
                desc: "Your data is yours alone. Not even our team or system administrators can read your private files."
              },
              {
                icon: Clock,
                title: "30-Day Version Recovery",
                desc: "Accidentally overwritten or deleted files can be restored instantly with 30-day complete history."
              },
              {
                icon: Server,
                title: "Global Redundancy",
                desc: "Files are mirrored across multi-region server clusters guaranteeing 99.99% uptime and zero data loss."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/80 border border-slate-700/70 p-6 rounded-2xl hover:border-blue-500 transition-colors">
                <div className="w-12 h-12 bg-blue-600/20 text-[#3B82F6] rounded-xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowSecurityModal(true)}
              className="inline-flex items-center space-x-2 text-blue-400 font-bold hover:text-blue-300 transition-colors text-sm"
            >
              <span>Explore complete security architecture whitepaper</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Explanation / Why DataStock */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0F172A]/40 border-b border-gray-200 dark:border-[#334155] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold text-[#3B82F6] tracking-wide uppercase mb-3">Why Choose DataStock?</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mb-6 leading-tight">
                More than storage. <br />It's your central digital hub.
              </h3>
              <p className="text-lg text-gray-600 dark:text-[#94A3B8] mb-8">
                DataStock brings together intelligent indexing, seamless cloud backup, and instant team collaboration into one simple interface.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Upload, title: 'Effortless Syncing', desc: 'Drag and drop files to instantly back them up to the cloud. Access them on mobile, tablet, or desktop.' },
                  { icon: Shield, title: 'Uncompromising Security', desc: 'Protected with 256-bit AES encryption. Only you hold access to your encryption keys.' },
                  { icon: Zap, title: 'Lightning Fast Speeds', desc: 'Experience instantaneous upload and download speeds, powered by our high-performance global network.' }
                ].map((item, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-[#F8FAFC] mb-1">{item.title}</h4>
                      <p className="text-gray-600 dark:text-[#94A3B8] text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-[#3B82F6] rounded-3xl transform rotate-3 scale-105 opacity-10"></div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000"
                alt="Person using cloud storage on laptop"
                className="rounded-3xl shadow-2xl relative z-10 object-cover h-130 w-full border border-gray-200 dark:border-[#334155]"
              />

              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-[#1E293B] p-5 rounded-2xl shadow-xl z-20 border border-gray-200 dark:border-[#334155] flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#94A3B8] font-medium">Backup Complete</p>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F8FAFC]">1,240 files active & synced</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-[#0F172A] px-4 sm:px-6 lg:px-8 relative border-b border-gray-200 dark:border-[#334155]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mb-6 tracking-tight">
              Powerful features, elegantly simple.
            </h2>
            <p className="text-xl text-gray-600 dark:text-[#94A3B8]">
              Everything you need to manage your digital life, without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[
              { icon: Cloud, title: 'Ubiquitous Access', desc: 'Access your files anywhere. Seamless sync across web, desktop, and mobile devices.' },
              { icon: Share2, title: 'Smart Link Sharing', desc: 'Create secure, expiring links with custom password protection for easy external file sharing.' },
              { icon: Users, title: 'Shared Workspaces', desc: 'Collaborate with team members using shared folders with strict role-based access control.' },
              { icon: Clock, title: 'Rewind & Versioning', desc: 'Accidentally modified or deleted a file? Restore previous versions up to 30 days back.' },
              { icon: HardDrive, title: 'Smart Storage Sync', desc: 'Stream files on demand without consuming local hard drive storage until you need them.' },
              { icon: Download, title: 'Offline Mode', desc: 'Pin key files to your device for guaranteed access even without an internet connection.' }
            ].map((feature, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="w-14 h-14 bg-gray-50 dark:bg-[#1E293B] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#3B82F6] transition-colors duration-300 shadow-sm border border-gray-200 dark:border-[#334155]">
                  <feature.icon className="w-7 h-7 text-gray-700 dark:text-[#94A3B8] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC] mb-3 group-hover:text-[#3B82F6] transition-colors">{feature.title}</h3>
                <p className="text-gray-600 dark:text-[#94A3B8] leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 dark:bg-[#0F172A] px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-gray-800 dark:border-[#334155]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-[#3B82F6]/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
              Simple, transparent pricing.
            </h2>
            <p className="text-xl text-gray-400">
              Start for free today. Upgrade anytime as your storage needs grow.
            </p>
            {checkoutError && (
              <p className="mt-4 text-sm text-red-400 font-semibold">{checkoutError}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Basic',
                price: '$0',
                period: 'forever',
                storage: '10 GB',
                description: 'Perfect for personal file backup.',
                features: ['10 GB Secure Cloud Storage', 'Basic Link Sharing', 'Access on all web devices', 'Standard encryption']
              },
              {
                name: 'Pro',
                price: '$9',
                period: '/month',
                storage: '2 TB',
                description: 'For power users and creators.',
                features: ['2 TB Ultra-Fast Storage', 'AI Semantic Search & Summaries', 'Password-Protected Links', '30-day version history', 'Priority 24/7 Support'],
                popular: true
              },
              {
                name: 'Family',
                price: '$19',
                period: '/month',
                storage: '5 TB',
                description: 'For teams and family members.',
                features: ['5 TB Total Shared Storage', 'Private accounts for 6 users', 'Team shared workspace', 'Centralized storage billing']
              }
            ].map((plan, i) => {
              const planKey = plan.name.toLowerCase();
              const isCurrentPlan = isLoggedIn && currentPlanKey === planKey;

              return (
                <div key={i} className={`relative bg-slate-800 dark:bg-[#1E293B] rounded-3xl p-8 border hover:scale-[1.02] transition-transform duration-300 ${isCurrentPlan
                  ? 'border-[#3B82F6] shadow-xl shadow-[#3B82F6]/20'
                  : plan.popular
                    ? 'border-[#3B82F6] shadow-2xl shadow-[#3B82F6]/20 transform md:-translate-y-4'
                    : 'border-slate-700 dark:border-[#334155]'
                  }`}>
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-[#3B82F6] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  <div className="flex items-end mb-6">
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2 mb-1 text-sm">{plan.period}</span>
                  </div>

                  <div className="bg-slate-900/50 dark:bg-[#0F172A]/50 rounded-xl p-4 mb-8 border border-slate-700/50 dark:border-[#334155]/50">
                    <span className="text-[#3B82F6] font-bold text-xl">{plan.storage}</span>
                    <span className="text-gray-400 ml-2 text-sm">cloud storage</span>
                  </div>

                  <ul className="space-y-3.5 mb-10">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start text-gray-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2.5 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanSelect(plan.name)}
                    disabled={(checkoutLoading && checkoutPlan === plan.name.toLowerCase()) || isCurrentPlan}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${isCurrentPlan
                      ? 'bg-slate-700 text-slate-300 cursor-default'
                      : plan.popular
                        ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-[#3B82F6]/30'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}>
                    {(checkoutLoading && checkoutPlan === plan.name.toLowerCase()) ? (
                      <><RefreshCw className="animate-spin h-5 w-5" /> Redirecting...</>
                    ) : isCurrentPlan ? (
                      'Current Active Plan'
                    ) : plan.name === 'Basic' ? (
                      isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'
                    ) : (
                      'Upgrade to ' + plan.name
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-[#1E293B] relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-linear-to-b from-[#3B82F6]/5 to-transparent pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-[#F8FAFC] mb-8 tracking-tight">
            Ready to take control of <br /> your digital life?
          </h2>
          <p className="text-xl text-gray-600 dark:text-[#94A3B8] mb-10 max-w-2xl mx-auto">
            Join thousands of users who trust DataStock to keep their files safe, accessible, and organized.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleSignup}
              className="px-10 py-5 bg-[#3B82F6] text-white rounded-2xl font-bold text-xl hover:bg-[#2563EB] transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/30 flex items-center space-x-3 group"
            >
              <span>Create your free account</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-[#94A3B8]">Takes less than 30 seconds. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-[#0F172A] pt-20 pb-10 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-[#334155] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img 
                  src="/datastock-logo.svg" 
                  alt="DataStock Logo" 
                  className="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200" 
                />
                <span className="font-extrabold text-xl text-gray-900 dark:text-[#F8FAFC]">Data<span className="text-[#3B82F6]">Stock</span></span>
              </div>
              <p className="text-gray-500 dark:text-[#94A3B8] mb-6 max-w-xs leading-relaxed text-sm">
                The most secure, beautiful, and intelligent home for all your files. Built for modern teams and creators.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-[#F8FAFC] mb-5 uppercase text-xs tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Features</a></li>
                <li><a href="#security" className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Security</a></li>
                <li><a href="#pricing" className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Pricing</a></li>
                <li><button onClick={handleDashboardClick} className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Dashboard</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-[#F8FAFC] mb-5 uppercase text-xs tracking-wider">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => navigate('/help')} className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Help & Docs</button></li>
                <li><button onClick={() => setShowDemoModal(true)} className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Product Tour</button></li>
                <li><button onClick={() => setShowContactModal(true)} className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Contact Support</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-[#F8FAFC] mb-5 uppercase text-xs tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Terms of Service</a></li>
                <li><a href="#" className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 dark:text-[#94A3B8] hover:text-[#3B82F6]">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-[#334155] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 dark:text-[#94A3B8] font-medium text-xs">© {new Date().getFullYear()} DataStock Inc. All rights reserved.</p>
            <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-[#94A3B8]">
              <span>Made with</span>
              <span className="text-red-500">♥</span>
              <span>for cloud data security</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* INTERACTIVE DEMO / PRODUCT TOUR MODAL */}
      {/* ======================================================== */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-4xl w-full border border-gray-200 dark:border-[#334155] shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#334155] flex justify-between items-center bg-gray-50 dark:bg-[#0F172A]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">DataStock Interactive Product Tour</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Step {demoStep + 1} of 4</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-[#334155] text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tour Steps Navigation */}
            <div className="grid grid-cols-4 border-b border-gray-200 dark:border-[#334155] bg-gray-100/50 dark:bg-[#0F172A]/50">
              {demoSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDemoStep(idx); setIsPlayingDemo(false); }}
                  className={`p-3 text-center border-b-2 font-bold text-xs transition-all ${
                    demoStep === idx
                      ? 'border-[#3B82F6] text-[#3B82F6] bg-white dark:bg-[#1E293B]'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">{step.badge}</span>
                  <span className="sm:hidden">Step {idx + 1}</span>
                </button>
              ))}
            </div>

            {/* Main Interactive Demo Area */}
            <div className="p-6 sm:p-8">
              <div className={`p-6 sm:p-10 rounded-2xl bg-gradient-to-r ${demoSteps[demoStep].color} text-white shadow-xl mb-6 relative overflow-hidden min-h-64 flex flex-col justify-center`}>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold w-fit mb-3">
                  {demoSteps[demoStep].badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">{demoSteps[demoStep].title}</h3>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-xl">
                  {demoSteps[demoStep].desc}
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#0F172A] text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#334155] hover:bg-gray-200 dark:hover:bg-[#334155] transition"
                  >
                    {isPlayingDemo ? 'Pause Autoplay' : 'Play Autoplay'}
                  </button>
                  <div className="flex space-x-1.5">
                    {demoSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          demoStep === i ? 'w-6 bg-[#3B82F6]' : 'w-2 bg-gray-300 dark:bg-gray-700'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setDemoStep((prev) => (prev - 1 + 4) % 4)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 dark:border-[#334155] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155]"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setDemoStep((prev) => (prev + 1) % 4)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3B82F6] text-white hover:bg-blue-600 shadow-md"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTACT SUPPORT MODAL */}
      {/* ======================================================== */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-200 dark:border-[#334155] shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-[#3B82F6] rounded-xl flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Contact DataStock</h3>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-[#94A3B8] mb-6">
              Have questions about security, enterprise plans, or features? Send us a message and our team will reply within 2 hours.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully! Our team will reach out to you shortly.'); setShowContactModal(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
                <input required type="email" placeholder="name@company.com" className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-[#334155] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea required rows={4} placeholder="How can we help you?" className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-[#334155] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md transition">
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECURITY WHITEPAPER MODAL */}
      {/* ======================================================== */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gray-200 dark:border-[#334155] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Security Architecture</h3>
              </div>
              <button onClick={() => setShowSecurityModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-gray-600 dark:text-[#94A3B8] leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-[#334155]">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">1. Encryption In Transit & At Rest</h4>
                <p>Data is protected using 256-bit Advanced Encryption Standard (AES). All transfers leverage TLS 1.3 encryption with strict PFS (Perfect Forward Secrecy).</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-[#334155]">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">2. Zero-Knowledge Access Controls</h4>
                <p>Private user data is stored such that only authorized token holders can decipher file contents. Passwords and encryption keys are never stored in plaintext.</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-[#334155]">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">3. Automated Redundancy & Recovery</h4>
                <p>Every file uploaded is fragmented and backed up across multiple geographically isolated cloud data centers with 99.999999999% durability.</p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setShowSecurityModal(false)} className="px-5 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl hover:bg-blue-600 transition">
                Close Architecture Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;
