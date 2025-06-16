import { useCurrentUser } from '@/querys/auth';
import { Loader2 } from 'lucide-react';
import React from 'react'
import { Navigate, Outlet } from 'react-router';

function ProtectedRoute() {
  const { data: user, isLoading } = useCurrentUser();

  //  if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   )
  // }

  if (!user && !isLoading) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default ProtectedRoute