import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { API_LIMITS } from '@/constants/apiLimits';

interface OrdersOverviewAboutMetricsProps {
  salesMayTruncate?: boolean;
}

const OrdersOverviewAboutMetrics: React.FC<OrdersOverviewAboutMetricsProps> = ({
  salesMayTruncate,
}) => (
  <Collapsible className="rounded-lg border border-border bg-muted/20">
    <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
      About these metrics
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
      <p>
        KPIs and charts use orders in the selected date range and factory. Status filter applies only
        to the recent activity table. Pending approvals include work orders in pending approval and
        other types whose status name is Pending or Draft. Overdue uses expected delivery or due
        dates when available.
      </p>
      <p>
        Top items, vendors, customers, and expense categories come from line-level server aggregation
        and respect the same date and factory filters. Expenses are excluded when a specific factory
        is selected.
      </p>
      <p>
        APIs use skip/limit pagination. Sales orders are merged from pages of {API_LIMITS.STRICT_100}{' '}
        (up to {10 * API_LIMITS.STRICT_100} rows).
        {salesMayTruncate
          ? ' The last sales page was full — you may have more than 1000 sales orders; this view can undercount.'
          : ''}{' '}
        Purchase, transfer, expense, and work lists load up to {API_LIMITS.FLEXIBLE_1000} each.
        Machines, factory sections, and projects load up to {API_LIMITS.FLEXIBLE_1000} for resolving
        machine/project legs to a factory.
      </p>
    </CollapsibleContent>
  </Collapsible>
);

export default OrdersOverviewAboutMetrics;
