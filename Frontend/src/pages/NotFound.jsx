import React from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ui/ThemeToggle";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">404 - Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="inline-flex items-center px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;