// App.jsx
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
  FileText
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
    if (!filename) return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-slate-800' };
    const ext = filename.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return { color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' };
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' };
    return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-slate-800' };
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

  const activeItems = isLoggedIn && (folders.length > 0 || allFiles.length > 0)
    ? [
      ...folders.slice(0, 1).map(folder => ({
        name: folder.name,
        type: 'folder',
        size: 'Folder',
        icon: Folder,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950/20'
      })),
      ...allFiles.slice(0, 2).map(file => {
        const colors = getFileColorClasses(file.name);
        return {
          name: file.name,
          type: 'file',
          size: formatStorage(file.size),
          icon: getFileIcon(file.name),
          color: colors.color,
          bg: colors.bg
        };
      })
    ].slice(0, 3)
    : [
      { name: 'Project Alpha', type: 'folder', size: '1.2 GB', icon: Folder, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
      { name: 'Q3 Financials.xlsx', type: 'file', size: '2.4 MB', icon: File, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
      { name: 'Campaign Banner.png', type: 'image', size: '4.1 MB', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    ];

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Inter'] selection:bg-green-200 selection:text-green-900 dark:selection:bg-emerald-400 dark:selection:text-slate-950 overflow-hidden transition-colors duration-200">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
              <div className="w-10 h-10 bg-black dark:bg-emerald-500 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-md">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">DataStock</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-green-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-green-600 font-medium transition-colors">How it works</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-green-600 font-medium transition-colors">Pricing</a>

              <div className="flex items-center space-x-4 ml-4">
                <ThemeToggle />
                <button
                  onClick={handleLogin}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-semibold hover:text-green-600 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={handleSignup}
                  className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-green-600/30"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute w-full bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 shadow-lg transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-4 py-6 space-y-4 flex flex-col">
            <a href="#features" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <div className="h-px bg-gray-100 dark:bg-slate-800 my-2"></div>
            <button
              onClick={handleLogin}
              className="w-full text-left px-4 py-3 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg"
            >
              Log in
            </button>
            <button
              onClick={handleSignup}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-md"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-400/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-48 -left-24 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-green-100 shadow-sm mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-700">Introducing DataStock</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.1]">
              The intelligent home for your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-400">digital life.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Never lose a file again. Store, organize, and securely share your documents, photos, and projects from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={handleSignup}
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black transform hover:-translate-y-1 transition-all duration-200 shadow-xl shadow-gray-900/20 flex items-center justify-center space-x-2 group"
              >
                <span>Start for free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-green-600 hover:text-green-600 transition-all duration-200 shadow-sm flex items-center justify-center space-x-2 group">
                <Play className="w-5 h-5 fill-current text-green-600" />
                <span>See how it works</span>
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-500">No credit card required. 10GB free forever.</p>
          </div>

          {/* Interactive UI Preview */}
          <div className="mt-20 relative max-w-5xl mx-auto px-2 sm:px-0">
            {/* Ambient background glow behind browser */}
            <div className="absolute -inset-4 bg-linear-to-r from-green-500/10 to-emerald-500/15 rounded-3xl blur-2xl opacity-75 dark:opacity-40 pointer-events-none"></div>

            <div className="bg-white dark:bg-slate-900 rounded-t-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-2 transform transition-transform hover:scale-[1.01] duration-500 relative z-10">
              {/* Browser Header Bar */}
              <div className="bg-gray-50 dark:bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-gray-200/80 dark:border-slate-800/80 rounded-t-2xl select-none">
                <div className="flex space-x-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="bg-white dark:bg-slate-900 text-xs text-gray-400 dark:text-gray-500 px-6 sm:px-16 py-1.5 rounded-lg border border-gray-200/60 dark:border-slate-800/60 font-mono truncate max-w-xs sm:max-w-md w-full text-center">
                  datastock.com/dashboard
                </div>
                <div className="w-12"></div> {/* Spacer to keep URL centered */}
              </div>

              <div className="bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                {/* Mock Sidebar */}
                <div className="hidden md:block w-64 bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Cloud className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-white">My Storage</span>
                  </div>
                  <div className="space-y-1">
                    {['Recent', 'Starred', 'Shared', 'Trash'].map((item, i) => (
                      <div key={i} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${i === 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Storage Usage</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${storagePercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Mock Main Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-slate-800/80 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Files</h3>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center"><Menu className="w-4 h-4 text-gray-500 dark:text-gray-400" /></div>
                      <button
                        onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeItems.map((file, i) => {
                      const Icon = file.icon;
                      return (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800/80 hover:border-green-200 dark:hover:border-green-800 hover:shadow-md transition-all cursor-pointer group bg-gray-50/50 dark:bg-slate-950/30 hover:bg-white dark:hover:bg-slate-900">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${file.bg}`}>
                              <Icon className={`w-6 h-6 ${file.color}`} />
                            </div>
                            <button className="text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><Menu className="w-4 h-4" /></button>
                          </div>
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-1 truncate">{file.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{file.size} • Active</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Social Proof */}
      <section className="py-10 border-t border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 dark:hover:opacity-80 transition-all duration-500">
            {/* Fake logos using text for layout */}
            <div className="text-2xl font-bold font-serif text-gray-800 dark:text-gray-205">Acme Corp</div>
            <div className="text-2xl font-extrabold italic text-gray-800 dark:text-gray-205">GlobalTech</div>
            <div className="text-2xl font-medium tracking-widest text-gray-800 dark:text-gray-205">NEXUS</div>
            <div className="text-2xl font-black lowercase text-gray-800 dark:text-gray-205">horizon</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-205 flex items-center"><Cloud className="w-6 h-6 mr-1 text-green-500" /> Vertex</div>
          </div>
        </div>
      </section>

      {/* Explanation / What is it? */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950/40 border-b border-gray-100 dark:border-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold text-green-600 dark:text-green-400 tracking-wide uppercase mb-3">Why DataStock?</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                More than just storage. <br />It's your central hub.
              </h3>
              <p className="text-lg text-gray-600 dark:text-slate-400 mb-8">
                In a world scattered with devices and apps, DataStock brings everything together. We provide a single, secure place for your photos, documents, and creative projects.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Upload, title: 'Effortless Syncing', desc: 'Drag and drop files to instantly back them up to the cloud. Access them on your phone, tablet, or PC.' },
                  { icon: Shield, title: 'Uncompromising Security', desc: 'Your data is protected with 256-bit AES encryption. Only you hold the keys.' },
                  { icon: Zap, title: 'Lightning Fast', desc: 'Experience incredibly fast upload and download speeds, powered by our global server network.' }
                ].map((item, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Decorative background shape */}
              <div className="absolute inset-0 bg-green-600 rounded-3xl transform rotate-3 scale-105 opacity-10"></div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000"
                alt="Person using cloud storage on laptop"
                className="rounded-3xl shadow-2xl relative z-10 object-cover h-150 w-full"
              />

              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl z-20 border border-gray-100 dark:border-slate-800 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-550 dark:bg-green-950/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Backup Complete</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">1,240 files synced</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950 px-4 sm:px-6 lg:px-8 relative border-b border-gray-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              Powerful features, elegantly simple.
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400">
              Everything you need to manage your digital life, without the clutter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[
              {
                icon: Cloud,
                title: 'Ubiquitous Access',
                desc: 'Your files are always with you. Access them from our web app, desktop client, or mobile apps.'
              },
              {
                icon: Share2,
                title: 'Smart Sharing',
                desc: 'Create secure, expiring links to share files with anyone, even if they don\'t use DataStock.'
              },
              {
                icon: Users,
                title: 'Shared Workspaces',
                desc: 'Create shared folders with your family or team. Collaborate seamlessly in real-time.'
              },
              {
                icon: Clock,
                title: 'Rewind History',
                desc: 'Accidentally deleted a file? Modified the wrong document? Restore previous versions up to 30 days.'
              },
              {
                icon: HardDrive,
                title: 'Smart Sync',
                desc: 'See all your files on your computer without taking up hard drive space until you open them.'
              },
              {
                icon: Download,
                title: 'Offline Mode',
                desc: 'Pin critical files to your device for guaranteed access even when you are off the grid.'
              }
            ].map((feature, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="w-14 h-14 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300 shadow-sm border border-gray-100 dark:border-slate-800">
                  <feature.icon className="w-7 h-7 text-gray-700 dark:text-slate-300 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-gray-800 dark:border-slate-900">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-green-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
              Simple pricing. No surprises.
            </h2>
            <p className="text-xl text-gray-400">
              Start for free, upgrade when you need more space.
            </p>
            {checkoutError && (
              <p className="mt-4 text-sm text-red-300">{checkoutError}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Basic',
                price: '$0',
                period: 'forever',
                storage: '10 GB',
                description: 'Perfect for getting started.',
                features: ['Secure cloud storage', 'Basic file sharing', 'Access on 3 devices', 'Standard support']
              },
              {
                name: 'Pro',
                price: '$9',
                period: '/month',
                storage: '2 TB',
                description: 'For power users and professionals.',
                features: ['Everything in Basic', 'Smart Sync technology', 'Advanced sharing controls', '30-day version history', 'Priority 24/7 support'],
                popular: true
              },
              {
                name: 'Family',
                price: '$19',
                period: '/month',
                storage: '5 TB',
                description: 'Share with up to 6 members.',
                features: ['Everything in Pro', 'Private accounts for 6 users', 'Family room folder', 'Centralized billing']
              }
            ].map((plan, i) => {
              const planKey = plan.name.toLowerCase();
              const isCurrentPlan = isLoggedIn && currentPlanKey === planKey;

              return (
                <div key={i} className={`relative bg-slate-800 dark:bg-slate-900 rounded-3xl p-8 border hover:scale-[1.02] transition-transform duration-300 ${isCurrentPlan
                  ? 'border-green-400 shadow-xl shadow-green-900/20'
                  : plan.popular
                    ? 'border-green-500 shadow-2xl shadow-green-950/50 transform md:-translate-y-4'
                    : 'border-slate-700 dark:border-slate-800'
                  }`}>
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-white text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  <div className="flex items-end mb-6">
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2 mb-1">{plan.period}</span>
                  </div>

                  <div className="bg-slate-900/50 dark:bg-slate-950/50 rounded-xl p-4 mb-8 border border-slate-700/50 dark:border-slate-800/50">
                    <span className="text-green-400 dark:text-green-300 font-bold text-xl">{plan.storage}</span>
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
                    onClick={() => handlePlanSelect(plan.name)}
                    disabled={(checkoutLoading && checkoutPlan === plan.name.toLowerCase()) || isCurrentPlan}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-200 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${isCurrentPlan
                      ? 'bg-slate-700 text-slate-300 cursor-default'
                      : plan.popular
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}>
                    {(checkoutLoading && checkoutPlan === plan.name.toLowerCase()) ? (
                      <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Redirecting...</>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.name === 'Basic' ? (
                      isLoggedIn ? 'Go to Dashboard' : 'Get Started'
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
      <section className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-linear-to-b from-green-500/5 to-transparent pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
            Ready to take control of <br /> your digital life?
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Join the millions of people who trust DataStock to keep their files safe, accessible, and perfectly organized.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleSignup}
              className="px-10 py-5 bg-black dark:bg-emerald-500 text-white dark:text-slate-950 rounded-2xl font-bold text-xl hover:bg-green-600 dark:hover:bg-emerald-400 transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center space-x-3 group"
            >
              <span>Create your free account</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Takes less than 30 seconds. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-950 pt-20 pb-10 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-black dark:bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white dark:text-slate-950" />
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">DataStock</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
                The most secure, beautiful, and intelligent home for all your files. Built for the modern digital life.
              </p>
              <div className="flex space-x-4">
                {/* Social placeholders */}
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-950/30 flex items-center justify-center transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                  <span className="font-bold text-sm">Tw</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-950/30 flex items-center justify-center transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                  <span className="font-bold text-sm">In</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-950/30 flex items-center justify-center transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                  <span className="font-bold text-sm">Li</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 uppercase text-sm tracking-wider">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Download', 'Security', 'Pricing', 'Releases'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 dark:text-gray-450 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 uppercase text-sm tracking-wider">Company</h4>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Press', 'Blog', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 dark:text-gray-405 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-5 uppercase text-sm tracking-wider">Legal</h4>
              <ul className="space-y-3">
                {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Compliance'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 dark:text-gray-450 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 dark:text-slate-500 font-medium text-sm">© {new Date().getFullYear()} DataStock Inc. All rights reserved.</p>
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-slate-500">
              <span>Made with</span>
              <span className="text-red-500">♥</span>
              <span>for your data</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
