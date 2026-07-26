import { Navigate, useLocation } from 'react-router-dom';

/** Redirect legacy /orders/work URLs to the Machines work-orders tab. */
const WorkOrdersLegacyRedirect: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('tab', 'workOrders');
  return <Navigate to={`/machines?${params.toString()}`} replace />;
};

export default WorkOrdersLegacyRedirect;
