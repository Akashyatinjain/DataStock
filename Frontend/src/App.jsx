import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SignUp from './pages/signUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import HomePage from './pages/HomePage';
import { useState,useEffect } from 'react';
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

        {/* Protected Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
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