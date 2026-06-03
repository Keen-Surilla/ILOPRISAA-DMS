/**
 * TIER 1 — PRESENTATION TIER: Protected Route Guard
 *
 * SECURITY RATIONALE:
 * This component provides UI-level access control. It is NOT the security
 * boundary — the real enforcement is in Supabase RLS and the Application Tier.
 * Its purpose is to prevent authorized users from seeing UI that's meaningless
 * to their role, and to catch accidental misrouting.
 *
 * IMPORTANT: Never remove server-side checks because this guard exists.
 * Client-side routing can be bypassed by any user with browser dev tools.
 *
 * Mitigates: OWASP A01 (Broken Access Control — defense-in-depth layer)
 */

import React, { type ReactNode } from 'react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import type { UserRole } from '../../3-data-tier/types/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  /** Redirect path when unauthorized (defaults to login) */
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true" aria-label="Loading...">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !role || !allowedRoles.includes(role)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8"
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl" aria-hidden="true">
          🔒
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Access Denied</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          You do not have permission to view this page.
        </p>
        <a
          href="/login"
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Return to login
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export const RoleGate: React.FC<{
  children: ReactNode;
  allowedRoles: UserRole[];
}> = ({ children, allowedRoles }) => {
  const role = useAuthStore(s => s.role);

  if (!role || !allowedRoles.includes(role)) return null;
  return <>{children}</>;
};
