import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { API_LIMITS } from '@/constants/apiLimits';

interface OrdersOverviewAboutMetricsProps {
  hubOrdersMayTruncate?: boolean;
}

const OrdersOverviewAboutMetrics: React.FC<OrdersOverviewAboutMetricsProps> = ({
  hubOrdersMayTruncate,
}) => (
  <Collapsible className="rounded-lg border border-border bg-muted/20">
    <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
      How this page counts things
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
      <p>
        <strong className="font-medium text-foreground/80">Date range &amp; factory</strong> in the
        header filter the summary cards, charts, and leaderboard panels. The status dropdown only
        filters the recent activity table at the bottom.
      </p>
      <p>
        <strong className="font-medium text-foreground/80">Pending approvals</strong> counts orders
        whose workflow status is literally named &quot;Pending&quot; or &quot;Draft&quot; — not every
        order that still needs work.
      </p>
      <p>
        <strong className="font-medium text-foreground/80">Overdue</strong> uses expected delivery
        or due dates when the order has one.
      </p>
      <p>
        Only <strong className="font-medium text-foreground/80">purchase, transfer, and expense</strong>{' '}
        orders appear here. Top vendors, items, and expense categories are calculated on the server
        from line items. Expense totals are hidden when you pick a single factory (expenses are not
        factory-scoped in the data model).
      </p>
      {hubOrdersMayTruncate ? (
        <p>
          <strong className="font-medium text-foreground/80">Large workspaces:</strong> counts may
          be low if you have more than {10 * API_LIMITS.ORDER_HUB_LIST_MAX} orders of one type — the
          page loads data in pages of {API_LIMITS.ORDER_HUB_LIST_MAX}.
        </p>
      ) : null}
    </CollapsibleContent>
  </Collapsible>
);

export default OrdersOverviewAboutMetrics;
