import React, { useEffect } from 'react'; // Import useEffect
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SecureErrorBoundary } from './1-presentation-tier/components/SecureErrorBoundary';
import { ProtectedRoute } from './1-presentation-tier/components/ProtectedRoute';
import { useAuthStore } from './2-application-tier/stores/authStore';

// STANDARD IMPORTS (Safe and reliable)
import LandingPage from './1-presentation-tier/pages/LandingPage';
import LoginPage from './1-presentation-tier/pages/LoginPage';
import SignUpPage from './1-presentation-tier/pages/SignUpPage';
import CoachDashboard from './1-presentation-tier/pages/CoachDashboard';
import AdminDashboard from './1-presentation-tier/pages/AdminDashboard';
import CommitteeDashboard from './1-presentation-tier/pages/CommitteeDashboard';


const RoleBasedRedirect = () => {
  const { role } = useAuthStore();
  
  if (role === 'coach') return <Navigate to="/coach/team" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'committee') return <Navigate to="/committee" replace />;
  if (role === 'athlete') return <Navigate to="/athlete/dashboard" replace />;
  
  return <Navigate to="/login" replace />;
};

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // ADD THIS: Run the initialize function once when the app loads
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SecureErrorBoundary fallbackTitle="Application Error">
      <BrowserRouter>
        <Routes>
          {/* Routes remain the same */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/home" element={<RoleBasedRedirect />} />
          
          <Route path="/coach/*" element={<ProtectedRoute allowedRoles={['coach']}><CoachDashboard /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/committee/*" element={<ProtectedRoute allowedRoles={['committee']}><CommitteeDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SecureErrorBoundary>
  );
}