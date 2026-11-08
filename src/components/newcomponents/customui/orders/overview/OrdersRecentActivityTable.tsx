import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import OrdersOverviewTable from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import type { OverviewOrder } from '@/pages/newpages/orders/ordersOverviewData';
import { formatOverviewCurrency } from './ordersOverviewConstants';
import { overviewHubLabel } from './overviewOrderTypeLabels';
import { displaySystemStatusName } from '@/i18n/systemLabels';
import { normalizeUiLanguage } from '@/i18n/uiLanguage';

interface OrdersRecentActivityTableProps {
  orders: OverviewOrder[];
  isLoading?: boolean;
}

const OrdersRecentActivityTable: React.FC<OrdersRecentActivityTableProps> = ({
  orders,
  isLoading,
}) => {
  const { t, i18n } = useTranslation(['orders', 'misc']);
  const uiLanguage = normalizeUiLanguage(i18n.language);
  const navigate = useNavigate();
  const pathByKind: Record<string, string> = {
    purchase: '/orders/purchase',
    transfer: '/orders/transfer',
    expense: '/orders/expense',
  };

  return (
    <div data-help-tour="orders-overview.recent-activity">
      {isLoading ? (
        <div className="flex py-16 items-center justify-center text-muted-foreground border border-border rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <OrdersOverviewTable
          title={t('recentActivityTableTitle')}
          subtitle={t('recentActivityTableSubtitle')}
          rows={orders.map((o) => ({ ...o, id: `${o.kind}-${o.id}` }))}
          emptyMessage={t('noOrdersMatchFilters')}
          onRowClick={(row) => navigate(pathByKind[row.kind] ?? '/orders/purchase')}
          columns={[
        {
          id: 'ref',
          header: t('overviewTableColOrder'),
          cell: (row) => <span className="font-medium">{row.ref}</span>,
        },
        {
          id: 'type',
          header: t('overviewTableColType'),
          cell: (row) => (
            <Badge variant="outline" className="text-[10px] font-normal">
              {overviewHubLabel(row.kind, t)}
            </Badge>
          ),
        },
        {
          id: 'status',
          header: t('statusLabel'),
          cell: (row) => (
            <span className="text-muted-foreground">
              {displaySystemStatusName(row.statusLabel, t, uiLanguage)}
            </span>
          ),
        },
        {
          id: 'date',
          header: t('overviewTableColDate'),
          cell: (row) => row.displayDate,
        },
        {
          id: 'amount',
          header: t('overviewTableColAmount'),
          align: 'right',
          cell: (row) => (
            <span className="font-medium tabular-nums">
              {row.amount > 0 ? formatOverviewCurrency(row.amount) : '—'}
            </span>
          ),
          },
        ]}
        />
      )}
    </div>
  );
};

export default OrdersRecentActivityTable;
