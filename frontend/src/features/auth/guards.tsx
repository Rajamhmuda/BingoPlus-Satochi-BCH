import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';

export const RequireAuth: React.FC = () => {
  const { firebaseUser, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 'bold' }}>Loading Satoshi Casino...</div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const GuestOnly: React.FC = () => {
  const { firebaseUser, initialized } = useAuthStore();

  if (!initialized) {
    return null;
  }

  if (firebaseUser) {
    return <Navigate to="/lobby" replace />;
  }

  return <Outlet />;
};

export const RequireAdmin: React.FC = () => {
  const { profile, initialized } = useAuthStore();

  if (!initialized) {
    return null;
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/lobby" replace />;
  }

  return <Outlet />;
};
