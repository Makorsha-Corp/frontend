import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { NotificationCenterProvider } from '@/components/newcomponents/customui/notifications/NotificationCenterProvider';
import AuthProfileSync from '@/components/newcomponents/customui/AuthProfileSync';

const RequireWorkspace: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, workspace } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspace) return <Navigate to="/workspace-selector" replace />;
  return (
    <NotificationCenterProvider>
      <AuthProfileSync />
      {children ?? <Outlet />}
    </NotificationCenterProvider>
  );
};

export default RequireWorkspace;
