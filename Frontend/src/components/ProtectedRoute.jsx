// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in (example using localStorage)
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    // Agar logged in nahi hai to login page pe bhejo
    return <Navigate to="/login" replace />;
  }
  
  // Agar logged in hai to component dikhao
  return children;
};

export default ProtectedRoute;