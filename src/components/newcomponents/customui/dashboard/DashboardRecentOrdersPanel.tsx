import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart,
  ArrowLeftRight,
  CreditCard,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OverviewOrder, OverviewOrderKind } from '@/pages/newpages/orders/ordersOverviewData';
import { formatDashboardCurrency, ORDER_TYPE_PATHS } from './dashboardConstants';
import { overviewHubLabel } from '@/components/newcomponents/customui/orders/overview/overviewOrderTypeLabels';
import { displaySystemStatusName } from '@/i18n/systemLabels';
import { normalizeUiLanguage } from '@/i18n/uiLanguage';

const ORDER_ICONS: Record<OverviewOrderKind, React.ComponentType<{ className?: string }>> = {
  purchase: ShoppingCart,
  transfer: ArrowLeftRight,
  expense: CreditCard,
};

interface DashboardRecentOrdersPanelProps {
  orders: OverviewOrder[];
  isLoading?: boolean;
}

const DashboardRecentOrdersPanel: React.FC<DashboardRecentOrdersPanelProps> = ({
  orders,
  isLoading,
}) => {
  const { t, i18n } = useTranslation(['dashboard', 'orders', 'misc']);
  const uiLanguage = normalizeUiLanguage(i18n.language);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">{t('recentOrders', { ns: 'dashboard' })}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex py-12 items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            {t('noOrders', { ns: 'orders' })}
          </p>
        ) : (
          <>
            <div className="divide-y divide-border">
              {orders.map((order) => {
                const Icon = ORDER_ICONS[order.kind];
                return (
                  <Link
                    key={`${order.kind}-${order.id}`}
                    to={ORDER_TYPE_PATHS[order.kind]}
                    className="flex items-center justify-between py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="font-medium text-card-foreground truncate">{order.ref}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {overviewHubLabel(order.kind, t)}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {displaySystemStatusName(order.statusLabel, t, uiLanguage)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {order.amount > 0 && (
                        <span className="font-semibold text-card-foreground text-sm">
                          {formatDashboardCurrency(order.amount)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              to="/orders"
              className="flex w-full items-center justify-center gap-1 border-t border-border py-3 text-sm font-medium text-brand-primary hover:bg-muted/40 transition-colors"
            >
              {t('viewOrdersOverview', { ns: 'dashboard' })}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardRecentOrdersPanel;
