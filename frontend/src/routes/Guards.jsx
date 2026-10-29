import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-950 p-1.5 flex items-center justify-center border border-slate-800 shadow-sm">
          <img
            src={logoImg}
            alt="SK LABA PHONE"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Verifying authenticated session...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute: Requires active user session (ADMIN or STAFF)
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * AdminRoute: Requires active ADMIN role per PDF Section 8
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto my-16 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 dark:border-amber-900/60 shadow-xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Administrative Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Your account role (STAFF) does not have authorization to access the User & Role Management console.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/phone-management"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * PublicOnlyRoute: Redirects already-authenticated users to dashboard
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/phone-management" replace />;
  }

  return children;
}
