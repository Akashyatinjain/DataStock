import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy-loaded routes for ultra-fast initial bundle & snappy navigation
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/signUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Trash = lazy(() => import('./pages/Trash'));
const Pricing = lazy(() => import('./pages/Pricing'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const HelpPage = lazy(() => import('./pages/help'));
const PublicSharePage = lazy(() => import('./pages/PublicSharePage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-[#3B82F6]">
    <div className="relative flex items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-md shadow-blue-500/10">
        <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#3B82F6] focus:text-white focus:font-semibold"
      >
        Skip to main content
      </a>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <Trash />
              </ProtectedRoute>
            }
          />
          {/* Public share route — no auth required */}
          <Route path="/share/:token" element={<PublicSharePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
