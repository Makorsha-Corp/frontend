import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login2" replace />;
  }
  return <>{children ?? <Outlet />}</>;
};

export default RequireAuth;
