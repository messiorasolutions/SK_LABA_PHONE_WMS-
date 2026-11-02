
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import PhoneManagementPage from '../pages/PhoneManagementPage';
import StockManagementPage from '../pages/StockManagementPage';
import OffersPage from '../pages/OffersPage';
import InstallmentPlansPage from '../pages/InstallmentPlansPage';
import InquiriesPage from '../pages/InquiriesPage';
import ReservationsPage from '../pages/ReservationsPage';
import SellRequestsPage from '../pages/SellRequestsPage';
import BackInStockPage from '../pages/BackInStockPage';
import UsersPage from '../pages/UsersPage';
import ReviewsPage from '../pages/ReviewsPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './Guards';
import { useAuth } from '../context/AuthContext';

function DefaultRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/users' : '/phone-management'} replace />;
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

      {/* Phone Management (ST-01, ST-02, ST-03, ST-05) */}
      <Route
        path="/phone-management"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PhoneManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/phones"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PhoneManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Stock Management (SRS ST-05) */}
      <Route
        path="/stock-management"
        element={
          <ProtectedRoute>
            <MainLayout>
              <StockManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <MainLayout>
              <StockManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/storage-management"
        element={
          <ProtectedRoute>
            <MainLayout>
              <StockManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Offers Management (SRS MG-03) */}
      <Route
        path="/offers"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OffersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/offer-management"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OffersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Installment Plans Management (SRS MG-11) */}
      <Route
        path="/installment-plans"
        element={
          <ProtectedRoute>
            <MainLayout>
              <InstallmentPlansPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/installments"
        element={
          <ProtectedRoute>
            <MainLayout>
              <InstallmentPlansPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Reservation Management (SRS ST-07) */}
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
        path="/back-in-stock"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BackInStockPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/back-in-stock"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BackInStockPage />
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
