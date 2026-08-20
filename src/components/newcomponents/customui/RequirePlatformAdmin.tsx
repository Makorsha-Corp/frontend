import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import AuthProfileSync from '@/components/newcomponents/customui/AuthProfileSync';

const RequirePlatformAdmin: React.FC = () => {
  const { isAuthenticated, user, workspace } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_platform_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {workspace ? <AuthProfileSync /> : null}
      <Outlet />
    </>
  );
};

export default RequirePlatformAdmin;
