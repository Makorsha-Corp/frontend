import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "@/pages/FullScreenLoader";
import PageAccessDeniedModal from "./DeniedRouteModals/PageAccessDeniedModal";

interface PrivateRouteProps {
  children: React.ReactNode;
  /** access_control page key (e.g., "orders", "manage order") */
  pageKey?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, pageKey }) => {
  const { session, profile, loading, canViewPage, accessLoading } = useAuth();
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
