import { useCurrentUser } from '@/querys/auth';
import React from 'react'
import { Navigate, Outlet } from 'react-router';

function ProtectedRoute() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default ProtectedRoute