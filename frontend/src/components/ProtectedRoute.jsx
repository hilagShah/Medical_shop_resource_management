import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PaymentBlockedScreen from './PaymentBlockedScreen';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/shopkeeper/dashboard'} replace />;
  }

  // Check shopkeeper payment status
  if (user.role === 'shopkeeper') {
    const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date();
    const isOverdue = user.paymentStatus === 'overdue' || isExpired;
    if (isOverdue) {
      return <PaymentBlockedScreen user={user} />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
