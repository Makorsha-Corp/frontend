import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardWorkspacePulse } from './useDashboardData';

interface DashboardWorkspacePanelProps {
  pulse: DashboardWorkspacePulse | null;
  isLoading?: boolean;
}

const DashboardWorkspacePanel: React.FC<DashboardWorkspacePanelProps> = ({ pulse, isLoading }) => {
  if (!pulse && !isLoading) return null;

  const ordersUsagePct =
    pulse?.maxOrdersPerMonth != null && pulse.maxOrdersPerMonth > 0
      ? Math.min(100, (pulse.ordersThisMonth / pulse.maxOrdersPerMonth) * 100)
      : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-card-foreground flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand-primary" />
            Workspace
          </CardTitle>
          <Link
            to="/management"
            className="text-xs font-medium text-brand-primary hover:underline flex items-center gap-0.5"
          >
            Manage
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex py-6 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : pulse ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Team members</span>
              <span className="font-semibold text-card-foreground">{pulse.membersCount}</span>
            </div>
            {pulse.pendingInvitesCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending invites</span>
                <span className="font-semibold text-amber-600 dark:text-amber-500">
                  {pulse.pendingInvitesCount}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Orders this month</span>
                <span className="font-semibold text-card-foreground">
                  {pulse.ordersThisMonth}
                  {pulse.maxOrdersPerMonth != null ? ` / ${pulse.maxOrdersPerMonth}` : ''}
                </span>
              </div>
              {ordersUsagePct != null && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-primary transition-all"
                    style={{ width: `${ordersUsagePct}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DashboardWorkspacePanel;
