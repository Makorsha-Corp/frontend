import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppShellHeader, {
  AppShellHeaderRow,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  Layers,
  Wrench,
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
  const { t } = useTranslation('dashboard');
  const {
    isOwner,
    kpis,
    attentionItems,
    recentOrders,
    workspacePulse,
    isLoading,
    hubOrdersMayTruncate,
  } = useDashboardData();

  const machineWorkFooter = useMemo(() => {
    if (kpis.overdueMachineWorkCount > 0 || kpis.upcomingMachineWorkItemCount > 0) {
      return [
        kpis.overdueMachineWorkCount > 0
          ? t('machineWorkOverdue', { count: kpis.overdueMachineWorkCount })
          : null,
        kpis.upcomingMachineWorkItemCount > 0
          ? t('machineWorkDueIn7d', { count: kpis.upcomingMachineWorkItemCount })
          : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    return t('machineWorkFooterDefault');
  }, [kpis.overdueMachineWorkCount, kpis.upcomingMachineWorkItemCount, t]);

  const openOrdersFooter = useMemo(() => {
    if (kpis.openOrdersPendingValue > 0) {
      return t('openOrdersFooterPending', {
        amount: formatDashboardCurrency(kpis.openOrdersPendingValue),
      });
    }
    return t('viewOrderAnalytics');
  }, [kpis.openOrdersPendingValue, t]);

  const activeProjectsFooter = useMemo(() => {
    if (kpis.planningProjectsCount > 0) {
      return t('projectsInPlanning', { count: kpis.planningProjectsCount });
    }
    return t('projectsInProgress');
  }, [kpis.planningProjectsCount, t]);

  const netArApFooter = useMemo(() => {
    if (kpis.overdueInvoiceCount > 0) {
      return t('overdueInvoices', { count: kpis.overdueInvoiceCount });
    }
    return t('netArApFooterDefault');
  }, [kpis.overdueInvoiceCount, t]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppShellHeader sticky>
        <AppShellHeaderRow className="min-h-9">
          <div className={appShellHeaderLeftGroupClass}>
            <div className={appShellHeaderIconTileClass}>
              <LayoutDashboard className="h-5 w-5 text-brand-primary" />
            </div>
            <h1 className={appShellHeaderTitleClass}>{t('title')}</h1>
          </div>
        </AppShellHeaderRow>
      </AppShellHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-8 bg-background">
        {hubOrdersMayTruncate && (
          <p className="mb-4 text-xs text-muted-foreground">{t('kpiTruncateWarning')}</p>
        )}

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">{t('sectionOperations')}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <DashboardStatCard
                variant="primary"
                title={t('openOrders')}
                value={kpis.openOrdersCount}
                icon={<ShoppingCart size={24} />}
                href="/orders"
                footer={openOrdersFooter}
                isLoading={isLoading}
              />
              <DashboardStatCard
                variant="primaryHover"
                title={t('activeProjects')}
                value={kpis.activeProjectsCount}
                icon={<FolderKanban size={24} />}
                footer={activeProjectsFooter}
                isLoading={isLoading}
              />
              <DashboardStatCard
                variant="accent"
                title={t('batchesInProgress')}
                value={kpis.batchesInProgressCount}
                icon={<Layers size={24} />}
                footer={t('batchesRunningNow')}
                href="/production"
                isLoading={isLoading}
              />
              <DashboardStatCard
                variant="outlined"
                title={t('machineWorkDue')}
                value={kpis.overdueMachineWorkCount + kpis.upcomingMachineWorkItemCount}
                icon={<Wrench size={24} />}
                footer={machineWorkFooter}
                href="/factories"
                isLoading={isLoading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">{t('sectionFinanceInventory')}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <DashboardStatCard
                variant="outlined"
                title={t('netArAp')}
                value={formatSignedCurrency(kpis.netArAp)}
                icon={<DollarSign size={24} />}
                href="/accounts/overview"
                footer={netArApFooter}
                isLoading={isLoading}
              />
              <DashboardStatCard
                variant="primaryHover"
                title={t('pendingApprovals')}
                value={kpis.pendingApprovalsCount}
                icon={<ClipboardCheck size={24} />}
                href="/orders"
                footer={t('pendingApprovalsFooter')}
                isLoading={isLoading}
              />
              <DashboardStatCard
                variant="accent"
                title={t('storageValue')}
                value={formatDashboardCurrency(kpis.storageEstimatedValue)}
                icon={<Package size={24} />}
                href="/storage"
                footer={t('storageValueFooter')}
                isLoading={isLoading}
              />
              <DashboardStatCard
                variant="primary"
                title={t('machinesRunning')}
                value={kpis.machinesRunningCount}
                icon={<Cpu size={24} />}
                href="/factories"
                footer={t('machinesRunningFooter')}
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
  );
};

export default DashboardPage;
