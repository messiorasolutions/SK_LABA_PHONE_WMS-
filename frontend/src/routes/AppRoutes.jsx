// ============================================================
// APP ROUTES — SK LABA PHONE WMS
// Authenticated & Protected Dashboard Routes
// ============================================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import InquiriesPage from '../pages/InquiriesPage';
import UsersPage from '../pages/UsersPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './Guards';
import { useAuth } from '../context/AuthContext';

function DefaultRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/users' : '/inquiries'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <UsersPage />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inquiries"
        element={
          <ProtectedRoute>
            <MainLayout>
              <InquiriesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Default / Fallback Routes: Redirect to Users for Admin or Inquiries for Staff */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DefaultRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phone-management"
        element={
          <ProtectedRoute>
            <DefaultRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <DefaultRedirect />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
