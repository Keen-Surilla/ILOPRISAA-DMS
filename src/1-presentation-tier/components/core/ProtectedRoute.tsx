import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import type { UserRole } from '../../../3-data-tier/types/database.types.extras';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
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
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading...">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-200 flex flex-col gap-2">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
            <div className="h-12 bg-slate-50 rounded-lg w-full"></div>
            <div className="h-12 bg-slate-50 rounded-lg w-full"></div>
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-slate-200 rounded-full w-64"></div>
            <div className="flex gap-4 items-center">
              <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0"></div>
              <div className="h-10 w-32 bg-slate-200 rounded-lg hidden sm:block"></div>
            </div>
          </div>
          <div className="h-[200px] bg-white rounded-xl border border-slate-200"></div>
          <div className="h-[400px] bg-white rounded-xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  // Not logged in at all — this is the sign-out / session-expired case.
  // Redirect declaratively instead of rendering a page: a <Navigate> swaps
  // the route within the same render, so there's no "Access Denied" frame
  // to flash while whatever else is triggering the redirect catches up.
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <Navigate to="/login" replace />;
  }

  // Logged in, but not permitted on this route — this IS a real access
  // problem worth telling the user about, so it still gets the page.
  if (!role || !allowedRoles.includes(role)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8"
      >
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