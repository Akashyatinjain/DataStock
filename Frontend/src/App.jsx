import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SignUp from './pages/signUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import NotFound from './pages/NotFound';
import HomePage from './pages/HomePage';
import Notifications from './pages/Notifications';
import { useState,useEffect } from 'react';
import Profile from "./pages/Profile";
import PublicSharePage from './pages/PublicSharePage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

 useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);
  return (
    <BrowserRouter>
      <Routes>
       <Route path="/" element={<HomePage />} />
       <Route path="/login" element={<Login />} />
       <Route path="/signup" element={<SignUp />} />
       <Route path="/profile" element={<Profile />} />
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
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        {/* Public share route — no auth required */}
        <Route path="/share/:token" element={<PublicSharePage />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;