import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

const RequireWorkspace: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, workspace } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login2" replace />;
  if (!workspace) return <Navigate to="/workspace-selector" replace />;
  return <>{children ?? <Outlet />}</>;
};

export default RequireWorkspace;
