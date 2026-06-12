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

} from 'lucide-react';

import DashboardStatCard from '@/components/newcomponents/customui/dashboard/DashboardStatCard';

import DashboardOrdersTrend from '@/components/newcomponents/customui/dashboard/DashboardOrdersTrend';

import DashboardOrdersMixPie from '@/components/newcomponents/customui/dashboard/DashboardOrdersMixPie';

import DashboardRecentOrdersPanel from '@/components/newcomponents/customui/dashboard/DashboardRecentOrdersPanel';

import DashboardAttentionPanel from '@/components/newcomponents/customui/dashboard/DashboardAttentionPanel';

import { useDashboardData } from '@/components/newcomponents/customui/dashboard/useDashboardData';

import { formatDashboardCurrency } from '@/components/newcomponents/customui/dashboard/dashboardConstants';



const DashboardPage: React.FC = () => {

  const {

    factory,

    kpis,

    trendData,

    ordersByType,

    recentOrdersList,

    attentionItems,

    totalOrdersCount,

    isLoading,

    hasError,

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

                <p className="text-sm text-muted-foreground truncate">{factoryContext}</p>

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

          {hasError && (

            <p className="mb-4 text-sm text-destructive">

              Some dashboard data could not be loaded. Check your connection and workspace access.

            </p>

          )}

          {salesMayTruncate && (

            <p className="mb-4 text-xs text-muted-foreground">

              Sales order counts may be truncated due to pagination limits.

            </p>

          )}



          <div className="space-y-8">

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

              <DashboardStatCard

                variant="primary"

                title="Open orders"

                value={kpis.openOrdersCount}

                icon={<ShoppingCart size={24} />}

                footer={

                  kpis.openOrdersPendingValue > 0

                    ? `${formatDashboardCurrency(kpis.openOrdersPendingValue)} pending value`

                    : 'Non-completed orders in scope'

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

                isLoading={isLoading}

              />

              <DashboardStatCard

                variant="outlined"

                title="Maintenance due (7d)"

                value={kpis.maintenanceDueCount}

                icon={<Wrench size={24} />}

                footer="Machines due within 7 days"

                isLoading={isLoading}

              />

            </div>



            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              <DashboardOrdersTrend data={trendData} isLoading={isLoading} />

              <DashboardOrdersMixPie

                data={ordersByType}

                totalCount={totalOrdersCount}

                isLoading={isLoading}

              />

            </div>



            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              <DashboardRecentOrdersPanel orders={recentOrdersList} isLoading={isLoading} />

              <DashboardAttentionPanel items={attentionItems} isLoading={isLoading} />

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default DashboardPage;

