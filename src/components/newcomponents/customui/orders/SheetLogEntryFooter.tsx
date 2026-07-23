import React from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SheetMaintenanceEntryForm from './SheetMaintenanceEntryForm';
import type { Machine } from '@/types/machine';
import type { WorkOrderType } from '@/types/workOrderType';
import type { Item } from '@/types/item';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Account } from '@/types/account';
import type { WorkspaceMember } from '@/types/workspace';

export interface SheetLogEntryFooterProps {
  sheetDate: string;
  factoryId: number | null;
  factoryLabel?: string | null;
  sectionId: number | null;
  machines: Machine[];
  workOrderTypes: WorkOrderType[];
  partItems: Item[];
  templates: WorkOrderTemplate[];
  accounts: Account[];
  members: WorkspaceMember[];
  defaultMachineId?: number | null;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  /** When footer opened but no factory — prompt header factory picker. */
  onRequestFactorySelect?: () => void;
  className?: string;
}

const SheetLogEntryFooter = React.forwardRef<HTMLDivElement, SheetLogEntryFooterProps>(
  (
    {
      sheetDate,
      factoryId,
      factoryLabel,
      sectionId,
      machines,
      workOrderTypes,
      partItems,
      templates,
      accounts,
      members,
      defaultMachineId,
      disabled = false,
      open = false,
      onOpenChange,
      onRequestFactorySelect,
      onSuccess,
      className,
    },
    ref,
  ) => {
    const canAdd = factoryId != null;
    const isDisabled = disabled || !canAdd;
    const dateLabel = format(parseISO(sheetDate), 'dd.MM.yyyy (EEE)');
    const scopeLabel = factoryLabel ?? (canAdd ? 'Factory selected' : 'Select factory');

    const handleOpenChange = (next: boolean) => {
      if (next && !canAdd) {
        onRequestFactorySelect?.();
        return;
      }
      onOpenChange?.(next);
    };

    return (
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div
          ref={ref}
          className={cn(
            'relative z-30 shrink-0 overflow-visible border-t-2 border-brand-primary/20 bg-muted/30',
            className,
          )}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                open && 'border-b border-border/60 bg-muted/40',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Plus className="h-4 w-4 shrink-0 text-brand-primary" />
                <span className="text-sm font-medium text-foreground">Add work</span>
                <span className="truncate text-xs text-muted-foreground">
                  {scopeLabel} · {dateLabel}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                {open ? 'Collapse' : canAdd ? 'Expand to add' : 'Select factory'}
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="overflow-visible">
            {!canAdd ? (
              <div className="border-t border-border/60 px-4 py-3 text-center text-sm text-muted-foreground">
                Select a factory to add work entries.
              </div>
            ) : (
              <div className="flex min-h-0 flex-col overflow-visible border-t border-border/60">
                <SheetMaintenanceEntryForm
                  layout="footer"
                  mode="create"
                  sheetDate={sheetDate}
                  factoryId={factoryId}
                  sectionId={sectionId}
                  machines={machines}
                  workOrderTypes={workOrderTypes}
                  partItems={partItems}
                  templates={templates}
                  accounts={accounts}
                  members={members}
                  defaultMachineId={defaultMachineId}
                  showGenerateDay={false}
                  showFooterHeader={false}
                  showWorkDate
                  disabled={isDisabled}
                  onSuccess={() => {
                    onSuccess?.();
                    onOpenChange?.(false);
                  }}
                />
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  },
);

SheetLogEntryFooter.displayName = 'SheetLogEntryFooter';

export default SheetLogEntryFooter;
