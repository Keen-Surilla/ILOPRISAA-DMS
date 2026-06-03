/**
 * Application Entry Point
 *
 * Wires the three tiers together:
 * - Tier 1 (Presentation): Route-guarded UI components
 * - Tier 2 (Application): Auth store initialization
 * - Tier 3 (Data): Supabase client (initialized via authStore)
 *
 * The SecureErrorBoundary wraps the entire app tree to ensure
 * no raw error information ever reaches the browser DOM.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SecureErrorBoundary } from './1-presentation-tier/components/SecureErrorBoundary';
import { ProtectedRoute } from './1-presentation-tier/components/ProtectedRoute';
import { useAuthStore } from './2-application-tier/stores/authStore';

// Lazy-load dashboards to reduce initial bundle size
// (also prevents role-specific code from loading for wrong roles)
const AthleteDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/athlete/Dashboard')
);
const CoachDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/CoachDashboard')
);
const AdminDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/AdminDashboard')
);
const LoginPage = React.lazy(() =>
  import('./1-presentation-tier/pages/LoginPage')
);
const LandingPage = React.lazy(() =>
  import('./1-presentation-tier/pages/LandingPage')
);
const CommitteeDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/CommitteeDashboard')
);

const AppLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500">Loading ILOPRISAA DMS…</p>
    </div>
  </div>
);

function AppRoutes() {
  const { initialize, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    // Initialize auth session on mount — bootstraps from persisted JWT
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <React.Suspense fallback={<AppLoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Athlete-only routes */}
          <Route
            path="/athlete/*"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteDashboard />
              </ProtectedRoute>
            }
          />

          {/* Coach-only routes */}
          <Route
            path="/coach/*"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Committee-only routes */}
          <Route
            path="/committee/*"
            element={
              <ProtectedRoute allowedRoles={['committee', 'admin']}>
                <CommitteeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home"
            element={
              isAuthenticated && role ? (
                <Navigate to={`/${role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 — no raw error info */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center text-gray-500">
                <p className="text-sm">Page not found.</p>
              </div>
            }
          />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SecureErrorBoundary fallbackTitle="Application Error">
      <AppRoutes />
    </SecureErrorBoundary>
  );
}
