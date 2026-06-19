import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  HelpCircle,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  FileQuestion,
  BookOpen,
  Settings,
  CreditCard,
  Upload,
  Users,
  FolderKanban,
  HardDrive,
  LifeBuoy,
  FileText,
  MessageSquare,
  Star,
  Shield,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Share2,
  Trash2,
  Cloud,
} from 'lucide-react';

import Header from '../components/dashboard/layout/Header';
import ThemeToggle from '../components/ui/ThemeToggle';

const HELP_ARTICLES = [
  {
    id: 1,
    title: 'Getting started with DataStock',
    description: 'Learn the basics of uploading, organizing, and sharing your files.',
    category: 'Getting Started',
    icon: BookOpen,
    readTime: '5 min read',
    popular: true,
    content: [
      'DataStock gives you 10 GB of free cloud storage to upload, organize, and access your files from anywhere.',
      'To upload a file, open My Drive and click Upload File, or use the + New button in the sidebar.',
      'Create folders from the sidebar to keep projects organized. Drag-and-drop support is coming soon.',
      'Use the grid or list view toggle in the top-right to switch how files are displayed.',
    ],
  },
  {
    id: 2,
    title: 'How to reset your password',
    description: 'Step-by-step guide to resetting your account password securely.',
    category: 'Account & Security',
    icon: Settings,
    readTime: '3 min read',
    popular: true,
    content: [
      'Go to the Login page and click Forgot password.',
      'Enter the email linked to your account. You will receive a one-time password (OTP) if OTP login is enabled.',
      'Alternatively, sign in with Google if you linked your Google account during signup.',
      'For account recovery issues, email support@datastock.app with your registered email address.',
    ],
  },
  {
    id: 3,
    title: 'Understanding storage plans and limits',
    description: 'Compare plans, upgrade storage, and manage your subscription.',
    category: 'Billing & Plans',
    icon: CreditCard,
    readTime: '4 min read',
    popular: false,
    content: [
      'Every account starts with 10 GB of free storage. Your usage is shown on the Dashboard under Storage Usage.',
      'Storage is calculated from all files across My Drive and every folder.',
      'When you reach 90% capacity, consider deleting unused files or moving them to Trash.',
      'Paid plans with expanded storage will be available soon — check back on the Profile page for updates.',
    ],
  },
  {
    id: 4,
    title: 'Sharing files and folders with teams',
    description: "Collaborate effectively using DataStock's sharing features.",
    category: 'File Management',
    icon: Users,
    readTime: '6 min read',
    popular: true,
    content: [
      'Open any file in My Drive and click the Share icon on the file card or row.',
      'Enter the recipient\'s email address and choose a permission level: View or Edit.',
      'Shared files appear under the Shared tab in your sidebar for easy access.',
      'You can also generate a public link to share files with anyone — no account required.',
      'Manage existing shares from the Share modal by revoking access at any time.',
    ],
  },
  {
    id: 5,
    title: 'Recovering deleted files',
    description: 'How to restore files from the trash within the retention period.',
    category: 'File Management',
    icon: Trash2,
    readTime: '2 min read',
    popular: false,
    content: [
      'Deleted files are moved to Trash, accessible from the More section in the sidebar.',
      'Open Trash, find your file, and click Restore to return it to its original location.',
      'Files in Trash are permanently deleted after 30 days and cannot be recovered.',
      'To delete immediately, select the file in Trash and choose Delete forever.',
    ],
  },
  {
    id: 6,
    title: 'Two-factor authentication setup',
    description: 'Secure your account with an extra layer of protection.',
    category: 'Account & Security',
    icon: Shield,
    readTime: '4 min read',
    popular: false,
    content: [
      'Two-factor authentication (2FA) adds a verification step when signing in.',
      'Go to Profile → Account Settings and look for the Security section.',
      'Enable 2FA and follow the prompts to link an authenticator app or phone number.',
      'Save your backup codes in a safe place in case you lose access to your device.',
    ],
  },
  {
    id: 7,
    title: 'Uploading large files',
    description: 'Tips and best practices for uploading large media files.',
    category: 'File Management',
    icon: Upload,
    readTime: '3 min read',
    popular: false,
    content: [
      'DataStock supports images, videos, PDFs, archives, and most common file types.',
      'For large uploads, use a stable internet connection and avoid closing the browser tab.',
      'If an upload fails, try again — partial uploads are not saved.',
      'Check your remaining storage on the Dashboard before uploading very large files.',
    ],
  },
  {
    id: 8,
    title: 'Billing and invoice FAQs',
    description: 'Common questions about invoices, receipts, and payment methods.',
    category: 'Billing & Plans',
    icon: FileText,
    readTime: '5 min read',
    popular: false,
    content: [
      'DataStock is currently free for all users with the default 10 GB plan.',
      'When paid plans launch, invoices will be available under Profile → Billing.',
      'We accept major credit cards and UPI for Indian users.',
      'Contact billing@datastock.app for any payment or refund questions.',
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do I invite team members to shared folders?',
    answer:
      "Open a file or folder, click Share, enter their email, and set permission to View or Edit. They'll receive a notification and the file will appear under their Shared tab.",
  },
  {
    question: 'What file types are supported for preview?',
    answer:
      'DataStock supports preview for images (JPEG, PNG, GIF, WebP), videos (MP4, MOV), PDFs, and plain text files. Other types can be downloaded.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Files are stored securely on Cloudinary with encrypted HTTPS transfer. Your account is protected by password or Google OAuth sign-in.',
  },
  {
    question: 'How do I star a file for quick access?',
    answer:
      'Hover over any file in My Drive and click the star icon. Starred files appear under the Starred tab in the sidebar.',
  },
  {
    question: 'What happens when I reach my storage limit?',
    answer:
      "You'll see your usage on the Dashboard progress bar. New uploads may fail once you hit 10 GB — delete unused files or empty Trash to free space.",
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Topics', icon: HelpCircle },
  { id: 'Getting Started', name: 'Getting Started', icon: BookOpen },
  { id: 'Account & Security', name: 'Account & Security', icon: Settings },
  { id: 'Billing & Plans', name: 'Billing & Plans', icon: CreditCard },
  { id: 'File Management', name: 'File Management', icon: FolderKanban },
];

const SUPPORT_EMAIL = 'support@datastock.app';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 bg-gray-900/95 text-sm font-medium text-white min-w-[280px] animate-slide-in">
    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    <span className="flex-1 text-gray-100">{message}</span>
    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
      <X className="w-4 h-4" />
    </button>
  </div>
);

const ArticleModal = ({ article, onClose }) => {
  if (!article) return null;
  const Icon = article.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-up">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                {article.category}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{article.title}</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{article.readTime}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-4">
          {article.content.map((paragraph, i) => (
            <p key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const ContactModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    await onSubmit(form);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Contact Support</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">We typically reply within 4 hours</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Message</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none"
              placeholder="Describe your issue..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition"
          >
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

const HelpPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [toast, setToast] = useState(null);

  const isLoggedIn = !!localStorage.getItem('token');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const categoryCounts = useMemo(() => {
    const counts = { all: HELP_ARTICLES.length };
    HELP_ARTICLES.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return HELP_ARTICLES.filter((article) => {
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.description.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const popularArticles = HELP_ARTICLES.filter((a) => a.popular).slice(0, 3);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=DataStock%20Support%20Request`;
  };

 const handleContactSubmit = async (formData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/contact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (data.success) {
      showToast(
        "Message sent! Our team will get back to you soon."
      );
    } else {
      showToast("Failed to send message");
    }
  } catch (error) {
    console.error(error);
    showToast("Something went wrong");
  }
};

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-gray-950 transition-colors duration-200">
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(2rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease forwards; }
        .animate-fade-up  { animation: fade-up 0.35s ease forwards; }
      `}</style>

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="pt-14 sm:pt-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              {isLoggedIn && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 mb-2 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              )}
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Help Center</h1>
              <p className="text-gray-400 dark:text-gray-500 mt-1 text-sm">Find answers, guides, and support for DataStock</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm" />
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 rounded-xl">
                <LifeBuoy className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Support Hub</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside
              className={`${
                isMobileMenuOpen ? 'block' : 'hidden'
              } lg:block w-full lg:w-72 shrink-0`}
            >
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden sticky top-20">
                <div className="p-4 border-b border-gray-50 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Categories</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{HELP_ARTICLES.length} articles available</p>
                </div>

                <nav className="p-3">
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const count = categoryCounts[category.id] || 0;
                    const isActive = activeCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(category.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition mb-1 text-sm font-medium ${
                          isActive
                            ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                          <span>{category.name}</span>
                        </div>
                        <span className={`text-xs ${isActive ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                <div className="m-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Time</span>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">&lt; 4 hrs</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Average for all plans</p>
                  <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '75%',
                        background: 'linear-gradient(90deg, #22c55e, #10b981)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 space-y-6">
              {/* Hero search */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">How can we help you?</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Search guides, FAQs, and troubleshooting tips</p>
                  </div>
                </div>
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Popular guides — hide when searching */}
              {!searchQuery && activeCategory === 'all' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Popular guides</h2>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Most viewed</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {popularArticles.map((article) => {
                      const Icon = article.icon;
                      return (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-left hover:border-green-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-950/60 transition">
                              <Icon className="w-5 h-5 text-green-600" />
                            </div>
                            <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">{article.title}</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{article.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{article.readTime}</span>
                            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-0.5 transition" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Articles grid */}
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : activeCategory === 'all'
                        ? 'All help articles'
                        : activeCategory}
                    {' '}
                    — {filteredArticles.length}
                  </h2>
                  {activeCategory !== 'all' && (
                    <button
                      onClick={() => setActiveCategory('all')}
                      className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                    >
                      Clear filter <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {filteredArticles.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
                    <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-700 dark:text-gray-200 font-semibold">No articles found</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term or browse categories</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                      className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => {
                      const Icon = article.icon;
                      return (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-left hover:border-green-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-green-50 dark:group-hover:bg-green-950/40 transition shrink-0">
                              <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                                  {article.category}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{article.readTime}</span>
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{article.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{article.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-green-400 shrink-0 mt-1 transition" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FAQ */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-green-600" />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Frequently asked questions</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {FAQ_ITEMS.map((item, idx) => (
                    <div key={idx} className="px-6 py-4">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between text-left font-medium text-gray-900 dark:text-gray-100 hover:text-green-700 dark:hover:text-green-400 transition gap-4"
                      >
                        <span className="text-sm">{item.question}</span>
                        {openFaqIndex === idx ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                        )}
                      </button>
                      {openFaqIndex === idx && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-l-2 border-green-200 dark:border-green-900 pl-4">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact support */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Still need help?</h3>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">Our support team is ready to assist you</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleEmailSupport}
                      className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 transition flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email Support
                    </button>
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contact Us
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Upload files', icon: Upload, action: () => navigate(isLoggedIn ? '/dashboard' : '/login') },
                  { label: 'Share files', icon: Share2, action: () => setSelectedArticle(HELP_ARTICLES.find((a) => a.id === 4)) },
                  { label: 'My Drive', icon: HardDrive, action: () => navigate(isLoggedIn ? '/dashboard' : '/login') },
                  { label: 'Sign up free', icon: Cloud, action: () => navigate('/signup') },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-green-200 hover:shadow-sm transition text-center"
                  >
                    <div className="w-9 h-9 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                  </button>
                ))}
              </div>
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-4">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-green-600" />
              <span>© 2026 DataStock. All rights reserved.</span>
            </div>
            <div className="flex gap-4">
              <button onClick={() => navigate('/')} className="hover:text-gray-700 dark:hover:text-gray-200 transition">Home</button>
              <button onClick={() => navigate('/login')} className="hover:text-gray-700 dark:hover:text-gray-200 transition">Login</button>
              <button onClick={() => navigate('/signup')} className="hover:text-gray-700 dark:hover:text-gray-200 transition">Sign Up</button>
            </div>
          </div>
        </footer>
      </div>

      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      {showContactModal && (
        <ContactModal
          onClose={() => setShowContactModal(false)}
          onSubmit={handleContactSubmit}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HelpPage;
