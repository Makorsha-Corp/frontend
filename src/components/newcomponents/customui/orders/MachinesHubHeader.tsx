import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardPen, LayoutTemplate, Plus, Repeat2, SlidersHorizontal } from 'lucide-react';
import AppShellHeader, {
  AppShellHeaderIconAction,
  AppShellHeaderRow,
  appShellHeaderControlClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import MachinesHubScopeFiltersDialog, {
  isMachinesHubLocationScopeFiltered,
} from '@/components/newcomponents/customui/orders/MachinesHubScopeFiltersDialog';
import MachinesWorkOrdersTabs from '@/components/newcomponents/customui/orders/MachinesWorkOrdersTabs';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import { cn } from '@/lib/utils';

export interface MachinesHubHeaderProps {
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
  factories: Array<{ id: number; name: string; abbreviation: string }>;
  sections: Array<{ id: number; name: string; factory_id: number }>;
  locationValue: MachinesLocationFilterSlice;
  onLocationChange: (slice: MachinesLocationFilterSlice) => void;
  factoryPickerOpen?: boolean;
  onFactoryPickerOpenChange?: (open: boolean) => void;
  factoryPickerHighlight?: boolean;
  onFactoryPickerHighlightDismiss?: () => void;
  sticky?: boolean;
  machinesActions?: { onAddMachine: () => void };
  workOrdersActions?: {
    onAddWork: () => void;
    onManagePresetsPrograms: () => void;
    onManageRecurringPrograms: () => void;
  };
}

const MachinesHubHeader: React.FC<MachinesHubHeaderProps> = ({
  activeTab,
  onTabChange,
  factories,
  sections,
  locationValue,
  onLocationChange,
  factoryPickerOpen,
  onFactoryPickerOpenChange,
  factoryPickerHighlight = false,
  onFactoryPickerHighlightDismiss,
  sticky = false,
  machinesActions,
  workOrdersActions,
}) => {
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const isLgScreen = useIsLgScreen();
  const scopeFiltered = isMachinesHubLocationScopeFiltered(locationValue);

  // Mobile only — desktop uses inline factory/section dropdowns in the header row.
  useEffect(() => {
    if (!factoryPickerOpen || isLgScreen) return;
    setScopeDialogOpen(true);
  }, [factoryPickerOpen, isLgScreen]);

  const handleScopeDialogOpenChange = useCallback(
    (open: boolean) => {
      setScopeDialogOpen(open);
      if (!open) onFactoryPickerOpenChange?.(false);
    },
    [onFactoryPickerOpenChange],
  );

  const handleScopeApply = useCallback(
    (slice: MachinesLocationFilterSlice) => {
      onLocationChange(slice);
    },
    [onLocationChange],
  );

  const handleScopeClear = useCallback(() => {
    onLocationChange({ factory_ids: [], section_ids: [] });
  }, [onLocationChange]);

  const locationFilterProps = {
    variant: 'toolbar' as const,
    selectionMode: 'single' as const,
    value: locationValue,
    onChange: onLocationChange,
    factories,
    sections,
  };

  return (
    <>
      <AppShellHeader sticky={sticky}>
        {/* Mobile — single row */}
        <AppShellHeaderRow className="flex-nowrap gap-1.5 lg:hidden">
          <div className="min-w-0 shrink">
            <MachinesWorkOrdersTabs activeTab={activeTab} onTabChange={onTabChange} compact />
          </div>
          <Button
            type="button"
            variant="outline"
            className={cn(appShellHeaderControlClass, 'relative shrink-0 border-border bg-background')}
            onClick={() => handleScopeDialogOpenChange(true)}
            aria-label={scopeFiltered ? 'Location scope filters (active)' : 'Location scope filters'}
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4 shrink-0" />
            Filters
            {scopeFiltered ? (
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary"
                aria-hidden
              />
            ) : null}
          </Button>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {activeTab === 'machines' && machinesActions ? (
              <AppShellHeaderIconAction
                icon={Plus}
                onClick={machinesActions.onAddMachine}
                ariaLabel="Add machine"
              />
            ) : null}
            {activeTab === 'workOrders' && workOrdersActions ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={appShellHeaderControlClass}
                  onClick={workOrdersActions.onManageRecurringPrograms}
                  aria-label="Manage recurring programs"
                >
                  <Repeat2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={appShellHeaderControlClass}
                  onClick={workOrdersActions.onManagePresetsPrograms}
                  aria-label="Manage work order templates"
                >
                  <LayoutTemplate className="h-4 w-4" />
                </Button>
                <AppShellHeaderIconAction
                  icon={ClipboardPen}
                  onClick={workOrdersActions.onAddWork}
                  ariaLabel="Add work"
                />
              </>
            ) : null}
          </div>
        </AppShellHeaderRow>

        {/* Desktop */}
        <div className="hidden lg:block">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={appShellHeaderLeftGroupClass}>
              <MachinesWorkOrdersTabs activeTab={activeTab} onTabChange={onTabChange} />
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <MachinesInlineLocationFilters
                which="factories"
                {...locationFilterProps}
                open={factoryPickerOpen}
                onOpenChange={onFactoryPickerOpenChange}
                highlight={factoryPickerHighlight}
                onHighlightDismiss={onFactoryPickerHighlightDismiss}
              />
              <MachinesInlineLocationFilters which="sections" {...locationFilterProps} />
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              {activeTab === 'machines' && machinesActions ? (
                <Button
                  onClick={machinesActions.onAddMachine}
                  className={cn(
                    appShellHeaderControlClass,
                    'shrink-0 bg-brand-primary shadow-sm hover:bg-brand-primary-hover',
                  )}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Machine
                </Button>
              ) : null}
              {activeTab === 'workOrders' && workOrdersActions ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className={appShellHeaderControlClass}
                    onClick={workOrdersActions.onManageRecurringPrograms}
                  >
                    <Repeat2 className="mr-2 h-4 w-4" />
                    Recurrings
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={appShellHeaderControlClass}
                    onClick={workOrdersActions.onManagePresetsPrograms}
                  >
                    <LayoutTemplate className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      appShellHeaderControlClass,
                      'bg-brand-primary hover:bg-brand-primary-hover',
                    )}
                    onClick={workOrdersActions.onAddWork}
                  >
                    <ClipboardPen className="mr-2 h-4 w-4" />
                    Add work
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </AppShellHeader>

      <MachinesHubScopeFiltersDialog
        open={scopeDialogOpen}
        onOpenChange={handleScopeDialogOpenChange}
        value={locationValue}
        factories={factories}
        sections={sections}
        onApply={handleScopeApply}
        onClear={handleScopeClear}
        factoryPickerHighlight={factoryPickerHighlight}
        onFactoryPickerHighlightDismiss={onFactoryPickerHighlightDismiss}
      />
    </>
  );
};

export default MachinesHubHeader;
