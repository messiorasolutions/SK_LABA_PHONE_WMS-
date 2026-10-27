// ============================================================
// APP ROUTES — All under Phone Management
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import PhoneManagementPage from '../pages/PhoneManagementPage'

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/phone-management" replace />} />
        <Route path="/phone-management" element={<PhoneManagementPage />} />
        {/* Fallback to unified page */}
        <Route path="*" element={<Navigate to="/phone-management" replace />} />
      </Routes>
    </MainLayout>
  )
}
