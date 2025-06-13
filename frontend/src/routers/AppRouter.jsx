import { Routes, Route } from 'react-router';
import React from 'react';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPassword';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import MainLayout from '@/components/layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProblemListPage from '@/pages/problems/ProblemListPage';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminRoute from './AdminRoute';
import NotFoundPage from '@/pages/NotFoundPage';
import AuthLayout from '@/components/layouts/AuthLayout';



function AppRouter() {
  return (
    <Routes>
      {/* Public Routes without layout */}
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Public Auth Routes with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Main Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/problems" element={<ProblemListPage />} />
        </Route>
      </Route>

      {/* Protected Admin Routes with AdminLayout */}
      <Route element={<AdminLayout />}>
        <Route element={<AdminRoute />}>
          {/* Example Admin Routes */}
          {/* <Route path="/admin" element={<AdminDashboard />} /> */}
          {/* <Route path="/admin/users" element={<UserManagementPage />} /> */}
        </Route>
      </Route>

      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;