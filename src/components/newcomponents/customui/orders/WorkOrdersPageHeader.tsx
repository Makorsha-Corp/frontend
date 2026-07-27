import React, { useCallback, useMemo } from 'react';
import { ClipboardPen, LayoutTemplate, Repeat2 } from 'lucide-react';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import MachinesWorkOrdersTabs from '@/components/newcomponents/customui/orders/MachinesWorkOrdersTabs';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';

export interface WorkOrdersPageHeaderProps {
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
  onAddWork: () => void;
  onManagePresetsPrograms: () => void;
  onManageRecurringPrograms: () => void;
  factories: Factory[];
  sections: FactorySection[];
  factoryFilter: string;
  sectionFilter: string;
  onLocationFilterChange: (slice: MachinesLocationFilterSlice) => void;
  factoryPickerOpen?: boolean;
  onFactoryPickerOpenChange?: (open: boolean) => void;
  factoryPickerHighlight?: boolean;
  onFactoryPickerHighlightDismiss?: () => void;
}

const WorkOrdersPageHeader: React.FC<WorkOrdersPageHeaderProps> = ({
  activeTab,
  onTabChange,
  onAddWork,
  onManagePresetsPrograms,
  onManageRecurringPrograms,
  factories,
  sections,
  factoryFilter,
  sectionFilter,
  onLocationFilterChange,
  factoryPickerOpen,
  onFactoryPickerOpenChange,
  factoryPickerHighlight = false,
  onFactoryPickerHighlightDismiss,
}) => {
  const locationValue = useMemo(
    (): MachinesLocationFilterSlice => ({
      factory_ids: factoryFilter === 'all' ? [] : [Number(factoryFilter)],
      section_ids: sectionFilter === 'all' ? [] : [Number(sectionFilter)],
    }),
    [factoryFilter, sectionFilter],
  );

  const handleLocationChange = useCallback(
    (slice: MachinesLocationFilterSlice) => {
      onLocationFilterChange(slice);
    },
    [onLocationFilterChange],
  );

  return (
    <AppShellHeader>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={appShellHeaderLeftGroupClass}>
          <MachinesWorkOrdersTabs activeTab={activeTab} onTabChange={onTabChange} />
          <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
          <MachinesInlineLocationFilters
            which="factories"
            variant="toolbar"
            selectionMode="single"
            value={locationValue}
            onChange={handleLocationChange}
            factories={factories}
            sections={sections}
            open={factoryPickerOpen}
            onOpenChange={onFactoryPickerOpenChange}
            highlight={factoryPickerHighlight}
            onHighlightDismiss={onFactoryPickerHighlightDismiss}
          />
          <MachinesInlineLocationFilters
            which="sections"
            variant="toolbar"
            selectionMode="single"
            value={locationValue}
            onChange={handleLocationChange}
            factories={factories}
            sections={sections}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={appShellHeaderControlClass}
            onClick={onManageRecurringPrograms}
          >
            <Repeat2 className="mr-2 h-4 w-4" />
            Recurrings
          </Button>
          <Button
            type="button"
            variant="outline"
            className={appShellHeaderControlClass}
            onClick={onManagePresetsPrograms}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Templates
          </Button>

          <Button
            type="button"
            className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
            onClick={onAddWork}
          >
            <ClipboardPen className="mr-2 h-4 w-4" />
            Add work
          </Button>
        </div>
      </div>
    </AppShellHeader>
  );
};

export default WorkOrdersPageHeader;
