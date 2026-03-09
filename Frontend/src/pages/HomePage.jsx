// App.jsx
import React from 'react';
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
  Image,
  Menu,
  X,
  ArrowUpRight,
  Check,
  Star
} from 'lucide-react';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-black">DataStock</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-black transition">Features</a>
              <a href="#" className="text-gray-600 hover:text-black transition">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-black transition">Security</a>
              <a href="#" className="text-gray-600 hover:text-black transition">About</a>
              <button className="bg-black text-white px-5 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <a href="#" className="block py-2 text-gray-600">Features</a>
              <a href="#" className="block py-2 text-gray-600">Pricing</a>
              <a href="#" className="block py-2 text-gray-600">Security</a>
              <a href="#" className="block py-2 text-gray-600">About</a>
              <button className="w-full bg-black text-white px-5 py-3 rounded-lg">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center bg-green-50 px-4 py-2 rounded-full mb-6">
                <HardDrive className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Your personal cloud storage</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
                Store, share, and 
                <br />
                <span className="text-green-600">access your files</span>
                <br />
                from anywhere
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                DataStock gives you secure cloud storage, easy file sharing, and seamless collaboration—all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-black text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Start uploading</span>
                </button>
                <button className="border border-gray-300 text-black px-6 py-3 rounded-xl hover:border-green-600 hover:text-green-600 transition flex items-center justify-center space-x-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>Watch demo</span>
                </button>
              </div>

              <div className="flex items-center space-x-4 mt-8">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-black">10,000+</span> users trust us
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
                {/* Storage Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium text-black">45.2 GB / 100 GB</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="w-[45%] h-full bg-green-600 rounded-full"></div>
                  </div>
                </div>

                {/* Files List */}
                <div className="space-y-3">
                  {[
                    { name: 'Project docs', type: 'folder', size: '2.3 GB', icon: Folder },
                    { name: 'Design assets', type: 'folder', size: '4.1 GB', icon: Folder },
                    { name: 'team-photo.jpg', type: 'image', size: '2.4 MB', icon: Image },
                    { name: 'presentation.pdf', type: 'file', size: '5.2 MB', icon: File },
                  ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-green-200 transition">
                      <div className="flex items-center space-x-3">
                        <file.icon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-black">{file.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{file.size}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-gray-100 text-black py-2 rounded-lg text-sm hover:bg-green-600 hover:text-white transition flex items-center justify-center space-x-1">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                  <button className="flex-1 bg-gray-100 text-black py-2 rounded-lg text-sm hover:bg-black hover:text-white transition flex items-center justify-center space-x-1">
                    <Folder className="w-4 h-4" />
                    <span>New folder</span>
                  </button>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                <Share2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                <Lock className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              Everything you need for file storage
            </h2>
            <p className="text-gray-600">
              Simple, secure, and smart features to manage your files effortlessly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Cloud,
                title: 'Cloud Storage',
                desc: 'Access your files from any device, anywhere in the world'
              },
              {
                icon: Share2,
                title: 'Easy Sharing',
                desc: 'Share files and folders with customizable permissions'
              },
              {
                icon: Lock,
                title: 'Bank-level Security',
                desc: 'End-to-end encryption to keep your data safe'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                desc: 'Work together on files with real-time updates'
              },
              {
                icon: Clock,
                title: 'Version History',
                desc: 'Track changes and restore previous versions'
              },
              {
                icon: Download,
                title: 'Offline Access',
                desc: 'Access your important files even without internet'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-lg transition group">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <feature.icon className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10M+', label: 'Files stored' },
              { number: '50K+', label: 'Happy users' },
              { number: '99.9%', label: 'Uptime' },
              { number: '128-bit', label: 'Encryption' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-black mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600">
              Choose the plan that fits your storage needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                storage: '10 GB',
                features: ['Basic storage', 'File sharing', 'Mobile access', '24/7 support']
              },
              {
                name: 'Pro',
                price: '$9.99',
                storage: '100 GB',
                features: ['Everything in Free', 'Version history', 'Advanced sharing', 'Priority support']
              },
              {
                name: 'Business',
                price: '$29.99',
                storage: '1 TB',
                features: ['Everything in Pro', 'Team folders', 'Admin controls', 'API access']
              }
            ].map((plan, i) => (
              <div key={i} className={`bg-white p-8 rounded-2xl border ${i === 1 ? 'border-green-600 shadow-xl' : 'border-gray-200'}`}>
                {i === 1 && (
                  <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-black mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-black">{plan.price}</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <p className="text-sm text-green-600 mb-6">{plan.storage} storage</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-medium transition ${
                  i === 1 
                    ? 'bg-black text-white hover:bg-green-600' 
                    : 'border border-gray-300 text-black hover:border-green-600 hover:text-green-600'
                }`}>
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start storing your files today
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of users who trust DataStock for their file storage needs.
          </p>
          <button className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition inline-flex items-center space-x-2 font-medium">
            <span>Create free account</span>
            <ArrowUpRight className="w-5 h-5" />
          </button>
          <p className="text-gray-400 text-sm mt-4">
            No credit card required • 10 GB free storage
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-black">DataStock</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Simple, secure file storage and sharing for everyone.
              </p>
            </div>
            {['Product', 'Company', 'Support'].map((section) => (
              <div key={section}>
                <h4 className="font-bold text-black mb-4">{section}</h4>
                <ul className="space-y-2">
                  {['Features', 'Pricing', 'Security'].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-600 hover:text-black transition">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2024 DataStock. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-black transition">Privacy</a>
              <a href="#" className="hover:text-black transition">Terms</a>
              <a href="#" className="hover:text-black transition">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Missing component
const PlayCircle = (props) => (
  <svg 
    {...props}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
  </svg>
);

export default HomePage;