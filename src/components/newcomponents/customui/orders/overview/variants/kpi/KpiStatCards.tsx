import React from 'react';
import {
  ShoppingCart,
  ClipboardCheck,
  AlertCircle,
  DollarSign,
  FileText,
  TrendingUp,
} from 'lucide-react';
import DashboardStatCard from '@/components/newcomponents/customui/dashboard/DashboardStatCard';
import { formatOverviewCurrency } from '../../ordersOverviewConstants';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

const KpiStatCards: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
    <DashboardStatCard
      variant="primary"
      title="Total orders"
      value={totalOrdersCount}
      icon={<ShoppingCart size={24} />}
      isLoading={isLoading}
    />
    <DashboardStatCard
      variant="primaryHover"
      title="Open orders"
      value={stats.openOrdersCount}
      icon={<TrendingUp size={24} />}
      isLoading={isLoading}
    />
    <DashboardStatCard
      variant="accent"
      title="Pending approvals"
      value={stats.pendingApprovalsCount}
      icon={<ClipboardCheck size={24} />}
      isLoading={isLoading}
    />
    <DashboardStatCard
      variant="outlined"
      title="Overdue"
      value={stats.overdueCount}
      icon={<AlertCircle size={24} />}
      isLoading={isLoading}
    />
    <DashboardStatCard
      variant="primary"
      title="Pending value"
      value={formatOverviewCurrency(stats.pendingValue)}
      icon={<DollarSign size={24} />}
      isLoading={isLoading}
    />
    <DashboardStatCard
      variant="outlined"
      title="Not invoiced"
      value={stats.notInvoicedCount}
      icon={<FileText size={24} />}
      footer={`Avg ${formatOverviewCurrency(stats.avgOrderValue)}`}
      isLoading={isLoading}
    />
  </div>
);

export default KpiStatCards;
