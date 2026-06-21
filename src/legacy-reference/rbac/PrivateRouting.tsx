// src/legacy-reference/rbac/PrivateRouting.tsx
import React, { useEffect } from "react";
import { useAuth } from "../legacy-types";
import { useNavigate } from "react-router-dom";
import PageAccessDeniedModal from "./DeniedRouteModals/PageAccessDeniedModal";

const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-600 border-solid"></div>
  </div>
);

interface PrivateRouteProps {
  children: React.ReactNode;
  /** access_control page key (e.g., "orders", "manage order") */
  pageKey?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, pageKey }) => {
  const { session, profile, loading, canViewPage, accessLoading } = useAuth() as any;
  const navigate = useNavigate();

  // basic auth gates
  useEffect(() => {
    if (loading) return;
    if (!session) { navigate("/login2"); return; }
    if (!profile) { navigate("/profileNotFound"); return; }
  }, [loading, session, profile, navigate]);

  if (loading || !session || !profile || (pageKey && accessLoading)) {
    return <FullScreenLoader />;
  }

  if (pageKey && !canViewPage(pageKey)) {
    return <PageAccessDeniedModal />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
