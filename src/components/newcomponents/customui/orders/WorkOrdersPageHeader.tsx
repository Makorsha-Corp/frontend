import React, { useCallback, useMemo } from 'react';
import { ChevronDown, ClipboardPen, Plus } from 'lucide-react';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import MachinesWorkOrdersTabs from '@/components/newcomponents/customui/orders/MachinesWorkOrdersTabs';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';

export interface WorkOrdersPageHeaderProps {
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
  onAddWork: () => void;
  onAdd: () => void;
  onAdvancedMaintenance: () => void;
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
  onAdd,
  onAdvancedMaintenance,
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
            className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
            onClick={onAddWork}
          >
            <ClipboardPen className="mr-2 h-4 w-4" />
            Add work
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className={appShellHeaderControlClass}>
                More
                <ChevronDown className="ml-1 h-4 w-4 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add work order
                <span className="ml-2 text-xs text-muted-foreground">projects, description</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAdvancedMaintenance}>Advanced maintenance</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AppShellHeader>
  );
};

export default WorkOrdersPageHeader;
