import { useCurrentUser } from '@/querys/auth';
import React from 'react'
import { Navigate } from 'react-router';

function ProtectedRoute() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  console.log(user);

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default ProtectedRoute