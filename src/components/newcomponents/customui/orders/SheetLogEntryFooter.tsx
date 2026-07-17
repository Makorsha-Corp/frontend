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
  className?: string;
}

const SheetLogEntryFooter = React.forwardRef<HTMLDivElement, SheetLogEntryFooterProps>(
  (
    {
      sheetDate,
      factoryId,
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
      onSuccess,
      className,
    },
    ref,
  ) => {
    const canLog = factoryId != null && sectionId != null;
    const isDisabled = disabled || !canLog;
    const dateLabel = format(parseISO(sheetDate), 'dd.MM.yyyy (EEE)');

    return (
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <div
          ref={ref}
          className={cn('relative z-30 shrink-0 overflow-visible border-t border-border bg-card', className)}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors',
                'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                open && 'border-b border-border/60 bg-muted/20',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Plus className="h-4 w-4 shrink-0 text-brand-primary" />
                <span className="text-sm font-medium text-foreground">Log entry</span>
                <span className="truncate text-xs text-muted-foreground">{dateLabel}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                {open ? 'Collapse' : canLog ? 'Expand to log' : 'Select factory & section'}
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="overflow-visible">
            {!canLog ? (
              <div className="border-t border-border/60 px-4 py-3 text-center text-sm text-muted-foreground">
                Select a factory and section to log maintenance entries.
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
