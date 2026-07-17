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
      display: ["Poppins", "sans-serif"],
      body: ["Inter", "sans-serif"],
    },
    colors: {
      ds: {
        bg: '#0F172A',
        'bg-secondary': '#1E293B',
        card: '#1E293B',
        border: '#334155',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        blue: '#3B82F6',
        'blue-hover': '#2563EB',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
    },
  },
},
  plugins: [],
}