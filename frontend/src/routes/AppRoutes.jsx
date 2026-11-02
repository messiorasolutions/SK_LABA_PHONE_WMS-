
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import InquiriesPage from '../pages/InquiriesPage';
import ReservationsPage from '../pages/ReservationsPage';
import SellRequestsPage from '../pages/SellRequestsPage';
import UsersPage from '../pages/UsersPage';
import ReviewsPage from '../pages/ReviewsPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './Guards';
import { useAuth } from '../context/AuthContext';

function DefaultRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/users' : '/reservations'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
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
        path="/reviews"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <ReviewsPage />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reservations"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReservationsPage />
            </MainLayout>
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

      <Route
        path="/sell-requests"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SellRequestsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

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
