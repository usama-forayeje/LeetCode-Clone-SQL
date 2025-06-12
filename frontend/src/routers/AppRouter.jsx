import React from 'react'
import ProtectedRoute from './ProtectedRoute'
import AuthLayout from '@/components/layouts/AuthLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import { Route, Routes } from 'react-router'

function AppRouter() {
    return (
        <>
            <Routes>
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            </Routes>
        </>
    )
}

export default AppRouter