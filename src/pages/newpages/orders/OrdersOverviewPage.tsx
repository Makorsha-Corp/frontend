import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, LayoutDashboard, Loader2 } from 'lucide-react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import HubTypeCards from '@/components/newcomponents/customui/orders/overview/variants/hubs/HubTypeCards';
import OrdersOverviewPageBody from '@/components/newcomponents/customui/orders/overview/OrdersOverviewPageBody';
import { useOrdersOverviewPage } from './useOrdersOverviewPage';
import {
  factoryFilterToSlice,
  sliceToFactoryFilter,
} from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';

const OrdersOverviewPage: React.FC = () => {
  const {
    dateRange,
    setDateRange,
    factoryFilter,
    setFactoryFilter,
    statusFilter,
    setStatusFilter,
    factories,
    statusOptions,
    isLoading,
    loadStats,
    loadError,
    salesMayTruncate,
    countsByType,
    ordersOverTime,
    totalOrdersCount,
    filteredRecentOrders,
    apiStats,
  } = useOrdersOverviewPage();

  const showFactoryPanel = factoryFilter === 'all';

  const handleFactorySelect = (factoryId: string) => {
    setFactoryFilter(factoryId === factoryFilter ? 'all' : factoryId);
  };

  const factoryLocationValue = factoryFilterToSlice(factoryFilter);

  const handleFactoryLocationChange = (slice: Partial<MachinesLocationFilterSlice>) => {
    if (slice.factory_ids === undefined) return;
    setFactoryFilter(sliceToFactoryFilter({ factory_ids: slice.factory_ids }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className={`${appShellHeaderLeftGroupClass} min-w-0 flex-1`}>
              <div className={appShellHeaderIconTileClass}>
                <LayoutDashboard className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Orders Overview</h1>
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <MachinesInlineLocationFilters
                which="factories"
                variant="toolbar"
                value={factoryLocationValue}
                onChange={handleFactoryLocationChange}
                factories={factories}
                sections={[]}
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`min-w-[200px] justify-start border-border bg-background ${appShellHeaderControlClass}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                      ) : (
                        format(dateRange.from, 'MMM d')
                      )
                    ) : (
                      'Date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className={`w-[160px] border-border bg-background ${appShellHeaderControlClass}`}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </AppShellHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          {loadError && (
            <p className="text-sm text-destructive">
              Some order data could not be loaded. Check your connection and workspace access.
            </p>
          )}

          <HubTypeCards countsByType={countsByType} />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
              <p className="text-sm">Loading orders overview…</p>
            </div>
          ) : (
            <OrdersOverviewPageBody
              showFactoryPanel={showFactoryPanel}
              onFactorySelect={handleFactorySelect}
              isLoading={isLoading}
              loadStats={loadStats}
              salesMayTruncate={salesMayTruncate}
              countsByType={countsByType}
              ordersOverTime={ordersOverTime}
              totalOrdersCount={totalOrdersCount}
              filteredRecentOrders={filteredRecentOrders}
              apiStats={apiStats}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersOverviewPage;
