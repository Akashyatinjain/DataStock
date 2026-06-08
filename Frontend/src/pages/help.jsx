import { useState } from "react";
import {
  Search,
  Upload,
  FolderPlus,
  Share2,
  Star,
  HardDrive,
  Settings,
  ChevronDown,
} from "lucide-react";

export default function HelpPage() {
  const [open, setOpen] = useState(null);

  const faqs = [
    {
      q: "How do I upload files?",
      a: "Click the Upload File button in the top-right corner and select files from your device.",
    },
    {
      q: "How do I share files?",
      a: "Open the file menu and choose Share to generate a secure sharing link.",
    },
    {
      q: "What are starred files?",
      a: "Starred files help you quickly access important documents.",
    },
    {
      q: "How can I increase storage?",
      a: "Upgrade to a premium plan from the billing section.",
    },
  ];

  const topics = [
    {
      title: "Upload Files",
      icon: Upload,
      desc: "Learn how to upload and manage files.",
    },
    {
      title: "Folders",
      icon: FolderPlus,
      desc: "Create and organize folders.",
    },
    {
      title: "Sharing",
      icon: Share2,
      desc: "Share files securely with others.",
    },
    {
      title: "Starred Files",
      icon: Star,
      desc: "Access important files faster.",
    },
    {
      title: "Storage",
      icon: HardDrive,
      desc: "Monitor your storage usage.",
    },
    {
      title: "Settings",
      icon: Settings,
      desc: "Manage account preferences.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold text-slate-900">
            Help Center
          </h1>

          <p className="mt-4 text-slate-500 text-lg">
            Find answers, guides and support for DataStock.
          </p>

          <div className="mt-8 relative max-w-2xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8">
          Popular Topics
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {topics.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border hover:shadow-lg transition"
              >
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                  <Icon className="text-green-600" />
                </div>

                <h3 className="mt-4 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-2 text-slate-500">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Getting Started */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl p-10 text-white">
          <h2 className="text-3xl font-bold">
            Getting Started
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div>
              <span className="text-4xl font-bold">1</span>
              <h3 className="font-semibold mt-2">
                Upload Files
              </h3>
              <p className="text-green-100 mt-2">
                Upload documents, images, videos and more.
              </p>
            </div>

            <div>
              <span className="text-4xl font-bold">2</span>
              <h3 className="font-semibold mt-2">
                Organize
              </h3>
              <p className="text-green-100 mt-2">
                Create folders and manage files easily.
              </p>
            </div>

            <div>
              <span className="text-4xl font-bold">3</span>
              <h3 className="font-semibold mt-2">
                Share
              </h3>
              <p className="text-green-100 mt-2">
                Generate secure links and collaborate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpen(open === index ? null : index)
                }
                className="w-full p-5 flex justify-between items-center"
              >
                <span className="font-medium">
                  {faq.q}
                </span>

                <ChevronDown
                  className={`transition ${
                    open === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open === index && (
                <div className="px-5 pb-5 text-slate-500">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Support */}
      <section className="bg-white border-t">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">
            Still Need Help?
          </h2>

          <p className="text-slate-500 mt-3">
            Our support team is here to help you.
          </p>

          <button className="mt-6 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
            Contact Support
          </button>
        </div>
      </section>
    </div>
  );
}