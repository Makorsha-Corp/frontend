import React from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  Layers,
  Wrench,
  ChevronRight,
  DollarSign,
  ClipboardCheck,
  Package,
  Cpu,
} from 'lucide-react';
import DashboardStatCard from '@/components/newcomponents/customui/dashboard/DashboardStatCard';
import DashboardAttentionPanel from '@/components/newcomponents/customui/dashboard/DashboardAttentionPanel';
import DashboardNotificationsPanel from '@/components/newcomponents/customui/notifications/DashboardNotificationsPanel';
import DashboardRecentOrdersPanel from '@/components/newcomponents/customui/dashboard/DashboardRecentOrdersPanel';
import DashboardQuickActionsStrip from '@/components/newcomponents/customui/dashboard/DashboardQuickActionsStrip';
import DashboardWorkspacePanel from '@/components/newcomponents/customui/dashboard/DashboardWorkspacePanel';
import { useDashboardData } from '@/components/newcomponents/customui/dashboard/useDashboardData';
import { formatDashboardCurrency } from '@/components/newcomponents/customui/dashboard/dashboardConstants';

function formatSignedCurrency(value: number): string {
  if (value === 0) return '$0';
  const formatted = formatDashboardCurrency(Math.abs(value));
  if (formatted === '—') return '—';
  return value > 0 ? `+${formatted}` : `−${formatted}`;
}

const DashboardPage: React.FC = () => {
  const {
    factory,
    isOwner,
    kpis,
    attentionItems,
    recentOrders,
    workspacePulse,
    isLoading,
    salesMayTruncate,
  } = useDashboardData();

  const factoryContext = factory ? factory.name : 'All factories';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className={appShellHeaderIconTileClass}>
                <LayoutDashboard className="h-5 w-5 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <h1 className={appShellHeaderTitleClass}>Dashboard</h1>
                <p className="text-sm text-muted-foreground truncate">
                  Operations snapshot · {factoryContext}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`${appShellHeaderControlClass} border-border bg-background`}
              asChild
            >
              <Link to="/orders">
                View orders overview
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </AppShellHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-8 bg-background">
          {salesMayTruncate && (
            <p className="mb-4 text-xs text-muted-foreground">
              Sales order counts may be truncated due to pagination limits.
            </p>
          )}

          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Operations</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStatCard
                  variant="primary"
                  title="Open orders"
                  value={kpis.openOrdersCount}
                  icon={<ShoppingCart size={24} />}
                  href="/orders"
                  footer={
                    kpis.openOrdersPendingValue > 0
                      ? `${formatDashboardCurrency(kpis.openOrdersPendingValue)} pending · View analytics`
                      : 'View order analytics'
                  }
                  isLoading={isLoading}
                />
                <DashboardStatCard
                  variant="primaryHover"
                  title="Active projects"
                  value={kpis.activeProjectsCount}
                  icon={<FolderKanban size={24} />}
                  footer={
                    kpis.planningProjectsCount > 0
                      ? `${kpis.planningProjectsCount} in planning`
                      : 'Projects in progress'
                  }
                  isLoading={isLoading}
                />
                <DashboardStatCard
                  variant="accent"
                  title="Batches in progress"
                  value={kpis.batchesInProgressCount}
                  icon={<Layers size={24} />}
                  footer="Production batches running now"
                  href="/production"
                  isLoading={isLoading}
                />
                <DashboardStatCard
                  variant="outlined"
                  title="Maintenance due (7d)"
                  value={kpis.maintenanceDueCount}
                  icon={<Wrench size={24} />}
                  footer="Machines due within 7 days"
                  href="/factories"
                  isLoading={isLoading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Finance & inventory</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStatCard
                  variant="outlined"
                  title="Net AR − AP"
                  value={formatSignedCurrency(kpis.netArAp)}
                  icon={<DollarSign size={24} />}
                  href="/accounts/aggregated"
                  footer={
                    kpis.overdueInvoiceCount > 0
                      ? `${kpis.overdueInvoiceCount} overdue invoice${kpis.overdueInvoiceCount === 1 ? '' : 's'}`
                      : 'Open receivables minus payables'
                  }
                  isLoading={isLoading}
                />
                <DashboardStatCard
                  variant="primaryHover"
                  title="Pending approvals"
                  value={kpis.pendingApprovalsCount}
                  icon={<ClipboardCheck size={24} />}
                  href="/orders"
                  footer="Orders awaiting sign-off"
                  isLoading={isLoading}
                />
                <DashboardStatCard
                  variant="accent"
                  title="Storage value"
                  value={formatDashboardCurrency(kpis.storageEstimatedValue)}
                  icon={<Package size={24} />}
                  href="/storage"
                  footer="Estimated inventory on hand"
                  isLoading={isLoading}
                />
                <DashboardStatCard
                  variant="primary"
                  title="Machines running"
                  value={kpis.machinesRunningCount}
                  icon={<Cpu size={24} />}
                  href="/factories"
                  footer="Active machines in scope"
                  isLoading={isLoading}
                />
              </div>
            </div>

            <DashboardQuickActionsStrip isOwner={isOwner} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <DashboardAttentionPanel items={attentionItems} isLoading={isLoading} />
                <DashboardRecentOrdersPanel orders={recentOrders} isLoading={isLoading} />
              </div>
              <div className="space-y-6">
                <DashboardNotificationsPanel />
                {isOwner && (
                  <DashboardWorkspacePanel pulse={workspacePulse} isLoading={isLoading} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
