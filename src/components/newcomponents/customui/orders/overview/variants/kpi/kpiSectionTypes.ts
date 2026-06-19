import type { ExtendedOverviewStats } from '@/pages/newpages/orders/ordersOverviewData';

export interface OrdersOverviewKpiProps {
  stats: ExtendedOverviewStats;
  totalOrdersCount: number;
  isLoading?: boolean;
}
