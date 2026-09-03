import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SecureErrorBoundary } from './1-presentation-tier/components/core/SecureErrorBoundary';
import { ProtectedRoute } from './1-presentation-tier/components/core/ProtectedRoute';
import { useAuthStore } from './2-application-tier/stores/authStore';
import { supabase } from './3-data-tier/config/SupabaseClient';


const LandingPage = lazy(() => import('./1-presentation-tier/pages/LandingPage'));
const LoginPage = lazy(() => import('./1-presentation-tier/pages/LoginPage'));
const CoachDashboard = lazy(() => import('./1-presentation-tier/pages/CoachDashboard'));
const CommitteeDashboard = lazy(() => import('./1-presentation-tier/pages/CommitteeDashboard'));
const SchoolAdminDashboard = lazy(() => import('./1-presentation-tier/pages/SchoolAdminDashboard'));
const AdminDashboard = lazy(() => import('./1-presentation-tier/pages/AdminDashboard'));
const AcceptInvitePage = lazy(() => import('./1-presentation-tier/pages/AcceptInvitePage'));

const RoleBasedRedirect = () => {
  const { role } = useAuthStore();
  if (role === 'coach') return <Navigate to="/coach/dashboard" replace />;
  if (role === 'school_admin') return <Navigate to="/school-admin" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'committee') return <Navigate to="/committee" replace />;
  if (role === 'athlete') return <Navigate to="/athlete/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const signOut = useAuthStore((state) => state.signOut);
useEffect(() => {
    initialize();

    const handleWindowFocus = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        console.warn("Session expired while tab was asleep. Logging out.");
        signOut(); 
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };

  }, [initialize, signOut]);

  return (
    <SecureErrorBoundary fallbackTitle="Server Connection Error">
      <BrowserRouter>
        <Suspense>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<RoleBasedRedirect />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/school-admin/*" element={<ProtectedRoute allowedRoles={['school_admin']}><SchoolAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/coach/*" element={<ProtectedRoute allowedRoles={['coach', 'athlete']}><CoachDashboard /></ProtectedRoute>} />
            <Route path="/committee/*" element={<ProtectedRoute allowedRoles={['committee']}><CommitteeDashboard /></ProtectedRoute>} />   
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SecureErrorBoundary>
  );
}