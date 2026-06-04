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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

 useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Auth Routes */}
       <Route path="/login" element={<Login />} />
<Route path="/signup" element={<SignUp />} />

<Route path="/profile" element={<Profile />} />
        {/* Protected Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
              {/* <Profile /> */}
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

        {/* Catch All (404) */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;