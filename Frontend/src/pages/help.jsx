import React, { useState, useMemo } from 'react';
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
  CheckCircle,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
// Helper component for Shield icon (since not imported initially)
// const Shield = () => (
//   <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//     <path d="M12 8v4" />
//     <path d="M12 16h.01" />
//   </svg>
// );
// Mock data for help articles
const helpArticles = [
  {
    id: 1,
    title: "Getting started with DataStock",
    description: "Learn the basics of uploading, organizing, and sharing your files.",
    category: "Getting Started",
    icon: BookOpen,
    readTime: "5 min read",
    popular: true,
  },
  {
    id: 2,
    title: "How to reset your password",
    description: "Step-by-step guide to resetting your account password securely.",
    category: "Account & Security",
    icon: Settings,
    readTime: "3 min read",
    popular: true,
  },
  {
    id: 3,
    title: "Understanding storage plans and limits",
    description: "Compare plans, upgrade storage, and manage your subscription.",
    category: "Billing & Plans",
    icon: CreditCard,
    readTime: "4 min read",
    popular: false,
  },
  {
    id: 4,
    title: "Sharing files and folders with teams",
    description: "Collaborate effectively using DataStock's sharing features.",
    category: "File Management",
    icon: Users,
    readTime: "6 min read",
    popular: true,
  },
  {
    id: 5,
    title: "Recovering deleted files",
    description: "How to restore files from the trash within the retention period.",
    category: "File Management",
    icon: FolderKanban,
    readTime: "2 min read",
    popular: false,
  },
  {
    id: 6,
    title: "Two-factor authentication setup",
    description: "Secure your account with an extra layer of protection.",
    category: "Account & Security",
    icon: Shield,
    readTime: "4 min read",
    popular: false,
  },
  {
    id: 7,
    title: "Uploading large files via desktop app",
    description: "Tips and best practices for uploading large media files.",
    category: "File Management",
    icon: Upload,
    readTime: "3 min read",
    popular: false,
  },
  {
    id: 8,
    title: "Billing and invoice FAQs",
    description: "Common questions about invoices, receipts, and payment methods.",
    category: "Billing & Plans",
    icon: FileText,
    readTime: "5 min read",
    popular: false,
  },
];

// Mock data for FAQ accordion
const faqItems = [
  {
    question: "How do I invite team members to shared folders?",
    answer: "Navigate to any folder you own, click the 'Share' button, enter email addresses, and set permission levels (view, comment, or edit). They'll receive an invitation email.",
  },
  {
    question: "What file types are supported for preview?",
    answer: "DataStock supports preview for images (JPEG, PNG, GIF, SVG), videos (MP4, MOV), documents (PDF, DOCX, XLSX, PPTX), and text files (TXT, CSV, MD).",
  },
  {
    question: "How is my data protected?",
    answer: "All files are encrypted at rest using AES-256 and in transit using TLS 1.3. We also offer optional client-side encryption for enterprise customers.",
  },
  {
    question: "Can I access my files offline?",
    answer: "Yes, with our desktop and mobile apps, you can mark specific files or folders for offline access. They'll sync automatically when you're back online.",
  },
  {
    question: "What happens when I reach my storage limit?",
    answer: "You'll receive notifications when you're at 90% and 100% capacity. New uploads will be blocked until you free up space or upgrade your plan.",
  },
];

// Help category list for sidebar
const categories = [
  { id: "all", name: "All Topics", icon: HelpCircle, count: 8 },
  { id: "Getting Started", name: "Getting Started", icon: BookOpen, count: 1 },
  { id: "Account & Security", name: "Account & Security", icon: Settings, count: 2 },
  { id: "Billing & Plans", name: "Billing & Plans", icon: CreditCard, count: 2 },
  { id: "File Management", name: "File Management", icon: FolderKanban, count: 3 },
];



// Main Help Page Component
const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    return helpArticles.filter((article) => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || article.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Popular articles for quick access
  const popularArticles = helpArticles.filter(article => article.popular).slice(0, 3);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar - Matches DataStock style */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              DataStock
            </span>
          </div>

          {/* Search Bar - Center */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Right Icons - Help button */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
              <LifeBuoy className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Help Center</span>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </header>

      {/* Main Layout - Sidebar + Content */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 py-6 md:px-6 gap-6">
        {/* Sidebar - Left Navigation (Matches DataStock folder style) */}
        <aside className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} 
          md:block w-full md:w-72 flex-shrink-0
          bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden
          transition-all duration-200
        `}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support Hub</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Knowledge Base</span>
              <span className="text-gray-400">{helpArticles.length} articles</span>
            </div>
          </div>

          <nav className="p-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all mb-1
                  ${activeCategory === category.id 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <category.icon className={`w-4 h-4 ${activeCategory === category.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm">{category.name}</span>
                </div>
                <span className={`text-xs ${activeCategory === category.id ? 'text-blue-500' : 'text-gray-400'}`}>
                  {category.count}
                </span>
              </button>
            ))}
          </nav>

          {/* Support Status Card - Similar to Storage Usage in original design */}
          <div className="m-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Response Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">&lt; 4 hrs</div>
            <div className="text-xs text-gray-500 mt-1">Average for all plans</div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Priority support</span>
              <span>24/7</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">How can we help you?</h1>
            <p className="text-blue-100 mb-5">Find answers, guides, and support resources for DataStock</p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </div>

          {/* Popular Articles Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-800">Popular guides</h2>
              </div>
              <span className="text-xs text-gray-400">Most viewed this week</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularArticles.map((article) => (
                <div key={article.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                      <article.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-3 mb-1">{article.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{article.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{article.readTime}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtered Articles Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {searchQuery ? `Search results for "${searchQuery}"` : "All help articles"}
              </h2>
              {activeCategory !== "all" && (
                <button
                  onClick={() => setActiveCategory("all")}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Clear filter <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-600 font-medium">No articles found</h3>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or browse categories</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition">
                        <article.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {article.category}
                          </span>
                          <span className="text-xs text-gray-400">{article.readTime}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{article.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQ Accordion Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-800">Frequently asked questions</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {faqItems.map((item, idx) => (
                <div key={idx} className="px-6 py-4">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left font-medium text-gray-800 hover:text-blue-600 transition"
                  >
                    <span>{item.question}</span>
                    {openFaqIndex === idx ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="mt-3 pl-0 text-sm text-gray-500 leading-relaxed border-l-2 border-blue-200 pl-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Still need help?</h3>
                  <p className="text-gray-300 text-sm">Our support team is ready to assist you</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Support
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Live Chat
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-5 md:px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>© 2026 DataStock. All rights reserved.</span>
          </div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-gray-700">Terms</a>
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;