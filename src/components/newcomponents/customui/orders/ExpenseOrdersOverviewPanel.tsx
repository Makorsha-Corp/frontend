import React from 'react';
import type { ExpenseOrderHubStatsResponse } from '@/types/expenseOrder';
import type { ExpenseOrderSummaryStats } from '@/pages/newpages/orders/expenseOrdersOverviewData';
import ExpenseOrderFinancialOverview from '@/components/newcomponents/customui/orders/ExpenseOrderFinancialOverview';
import { OrderOverviewKpiCard } from '@/components/newcomponents/customui/orders/OrderOverviewKpiCard';
import { Loader2 } from 'lucide-react';

interface ExpenseOrdersOverviewPanelProps {
  stats: ExpenseOrderSummaryStats;
  hubStats?: ExpenseOrderHubStatsResponse | null;
  isLoading?: boolean;
  formatCurrency: (v: number | null | undefined) => string;
  onSelectOrder: (id: number) => void;
  onCategoryFilter: (categoryKey: string) => void;
}

const ExpenseOrdersOverviewPanel: React.FC<ExpenseOrdersOverviewPanelProps> = ({
  stats,
  hubStats,
  isLoading,
  formatCurrency,
  onSelectOrder,
  onCategoryFilter,
}) => {
  const formatCompactCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <OrderOverviewKpiCard
          title="Total orders"
          value={stats.totalCount}
          footer="In current filter scope"
        />
        <OrderOverviewKpiCard
          title="Total value"
          value={formatCompactCurrency(stats.totalValue)}
          footer="Sum of order totals"
        />
        <OrderOverviewKpiCard
          title="Open pipeline"
          value={stats.openCount}
          footer={`${formatCompactCurrency(stats.openValue)} not completed`}
        />
        <OrderOverviewKpiCard
          title="Not invoiced"
          value={stats.notInvoicedCount}
          footer="No linked invoice yet"
        />
      </div>

      <ExpenseOrderFinancialOverview
        snapshot={hubStats?.financial_snapshot}
        formatCurrency={formatCurrency}
        formatCompactCurrency={formatCompactCurrency}
        onCategoryFilter={onCategoryFilter}
        onSelectOrder={onSelectOrder}
        className="flex-1 min-h-0"
      />
    </div>
  );
};

export default ExpenseOrdersOverviewPanel;
