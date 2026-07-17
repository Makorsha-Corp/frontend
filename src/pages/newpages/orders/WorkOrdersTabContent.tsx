import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Wrench } from 'lucide-react';
import WorkOrdersSheetView from '@/components/newcomponents/customui/orders/WorkOrdersSheetView';
import WorkOrdersPageContent from '@/pages/newpages/orders/WorkOrdersPageContent';

export interface WorkOrdersTabContentProps {
  /** Pre-select machine when opening sheet from machine detail */
  sheetMachineId?: number | null;
}

const WorkOrdersTabContent: React.FC<WorkOrdersTabContentProps> = ({ sheetMachineId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const woView = searchParams.get('woView') === 'hub' ? 'hub' : 'sheet';
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const setWoView = (view: 'sheet' | 'hub') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (view === 'sheet') next.delete('woView');
      else next.set('woView', 'hub');
      return next;
    });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card/30 px-4 py-2 flex items-center justify-between gap-3">
        <Tabs value={woView} onValueChange={(v) => setWoView(v as 'sheet' | 'hub')}>
          <TabsList>
            <TabsTrigger value="sheet" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Sheet
            </TabsTrigger>
            <TabsTrigger value="hub" className="gap-1.5">
              <Wrench className="h-4 w-4" />
              Hub
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {woView === 'sheet' && (
          <p className="text-xs text-muted-foreground hidden sm:block">
            Week view · footer log entry · switch row flow in filter strip
          </p>
        )}
      </div>

      {woView === 'sheet' ? (
        <WorkOrdersSheetView defaultMachineId={sheetMachineId ?? undefined} />
      ) : (
        <WorkOrdersPageContent
          embedded
          initialOrderId={selectedOrderId ?? (searchParams.get('orderId') ? Number(searchParams.get('orderId')) : null)}
        />
      )}
    </div>
  );
};

export default WorkOrdersTabContent;
