import { useCurrentUser } from '@/querys/auth';
import React from 'react'
import { Navigate } from 'react-router';

function ProtectedRoute({ children }) {
  const { user } = useCurrentUser();
  return (

    user ? children : <Navigate to="/login" replace />

  )
}

export default ProtectedRoute