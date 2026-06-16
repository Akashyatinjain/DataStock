import { BrowserRouter, Routes, Route } from 'react-router-dom';

import SignUp from './pages/signUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import NotFound from './pages/NotFound';
import HomePage from './pages/HomePage';
import Notifications from './pages/Notifications';
import Profile from "./pages/Profile";
import PublicSharePage from './pages/PublicSharePage';
import HelpPage from './pages/help';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
function App() {
  return (
    <BrowserRouter>
      <Routes>
       <Route path="/" element={<HomePage />} />
       <Route path="/login" element={<Login />} />
       <Route path="/signup" element={<SignUp />} />
       <Route path="/help" element={<HelpPage />} />
       <Route path="/pricing" element={<Pricing />} />
       <Route path="/payment-success" element={
         <ProtectedRoute>
           <PaymentSuccess />
         </ProtectedRoute>
       } />
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
