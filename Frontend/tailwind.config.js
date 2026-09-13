/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
  extend: {
    fontFamily: {
      display: ["Plus Jakarta Sans", "Poppins", "sans-serif"],
      body: ["Inter", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    colors: {
      ds: {
        // Brand
        brand: '#2563EB',
        'brand-hover': '#1D4ED8',
        'brand-light': '#3B82F6',
        // Accent
        accent: '#06B6D4',
        'accent-hover': '#0891B2',
        'accent-light': '#22D3EE',
        // Surface
        bg: '#0F172A',
        'bg-secondary': '#1E293B',
        card: '#1E293B',
        border: '#334155',
        // Text
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        // Status
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        // File types
        'file-document': '#60A5FA',
        'file-document-bg': '#1E3A5F',
        'file-spreadsheet': '#34D399',
        'file-spreadsheet-bg': '#1A3A2A',
        'file-presentation': '#A78BFA',
        'file-presentation-bg': '#3B1F5E',
        'file-media': '#2DD4BF',
        'file-media-bg': '#1E3A3A',
        'file-archive': '#FBBF24',
        'file-archive-bg': '#3D2E1A',
        'file-audio': '#FB7185',
        'file-audio-bg': '#3B1F2E',
        // Folder dots
        'folder-1': '#3B82F6',
        'folder-2': '#06B6D4',
        'folder-3': '#8B5CF6',
        'folder-4': '#10B981',
        // Badges
        'badge-positive': '#10B981',
        'badge-negative': '#EF4444',
        'badge-info': '#3B82F6',
        'badge-financial': '#F59E0B',
      },
    },
  },
},
  plugins: [],
}