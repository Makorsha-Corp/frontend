import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatOverviewCurrency } from '../../ordersOverviewConstants';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

const KpiFocusedPair: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total orders</p>
          {isLoading ? (
            <div className="mt-2 h-9 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-4xl font-bold tabular-nums">{totalOrdersCount}</p>
          )}
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Pending value</p>
          {isLoading ? (
            <div className="mt-2 h-9 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-4xl font-bold tabular-nums">
              {formatOverviewCurrency(stats.pendingValue)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
    <Collapsible className="rounded-lg border border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        More metrics
        <ChevronDown className="h-4 w-4 [[data-state=open]_&]:rotate-180 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-4 py-3">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        ) : (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Open</dt>
              <dd className="font-semibold tabular-nums">{stats.openOrdersCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pending approvals</dt>
              <dd className="font-semibold tabular-nums">{stats.pendingApprovalsCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Overdue</dt>
              <dd className="font-semibold tabular-nums">{stats.overdueCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Not invoiced</dt>
              <dd className="font-semibold tabular-nums">{stats.notInvoicedCount}</dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-muted-foreground">Avg order value</dt>
              <dd className="font-semibold tabular-nums">
                {formatOverviewCurrency(stats.avgOrderValue)}
              </dd>
            </div>
          </dl>
        )}
      </CollapsibleContent>
    </Collapsible>
  </div>
);

export default KpiFocusedPair;
