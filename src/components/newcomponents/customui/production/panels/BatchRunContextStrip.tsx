import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import BatchShiftWhenRow from '@/components/newcomponents/customui/production/BatchShiftWhenRow';
import ProductionLineMachineSelect, {
  type ProductionPlannedWindow,
} from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import type {
  ProductionBatch,
  ProductionLine,
  ProductionScheduleBatch,
  LinkedProductionOrder,
} from '@/types/production';
import type { WorkspaceShift } from '@/types/workspaceShift';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';

function BatchStripNotesField({
  id,
  value,
  disabled,
  onChange,
  onCommit,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const preview = value.trim();
  const label = preview || 'Add notes…';

  const triggerClassName = cn(
    'flex h-9 w-[min(20rem,28vw)] min-w-[11rem] max-w-[20rem] shrink-0 items-center rounded-md border border-input bg-background px-3 text-left text-sm',
    'hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    !preview && 'text-muted-foreground',
    disabled && 'cursor-default hover:bg-background',
  );

  if (disabled) {
    if (!preview) {
      return (
        <p className="flex h-9 w-[min(20rem,28vw)] min-w-[11rem] max-w-[20rem] items-center text-sm text-muted-foreground">
          —
        </p>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            className={triggerClassName}
            title="View notes"
          >
            <span className="truncate">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,92vw)] p-3" onWheel={(e) => e.stopPropagation()}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-2 max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-sm text-foreground">{value}</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next && open) onCommit();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={triggerClassName}
          title={preview || 'Edit notes'}
        >
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,92vw)] p-3" onWheel={(e) => e.stopPropagation()}>
        <Label htmlFor={`${id}-editor`} className="text-xs text-muted-foreground">
          Notes
        </Label>
        <Textarea
          id={`${id}-editor`}
          className="mt-1.5 min-h-[6rem] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Optional"
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          className="mt-2 w-full bg-brand-primary hover:bg-brand-primary-hover"
          onClick={() => setOpen(false)}
        >
          Done
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export interface BatchRunContextStripProps {
  batch: ProductionBatch;
  canEditBatch: boolean;
  workspaceShifts: WorkspaceShift[];
  plannedStart: string;
  selectedShiftId: number | null;
  onPlannedStartChange: (value: string) => void;
  onSelectedShiftIdChange: (id: number | null) => void;
  onPlannedStartCommit: (plannedLocal: string) => void;
  onShiftCommit: (plannedLocal?: string, shiftId?: number) => void;
  showRailMachine: boolean;
  railMachineLine: ProductionLine | undefined;
  railMachineId: number | null;
  onRailMachineChange: (machineId: number | null) => void;
  factoryId?: number;
  scheduleBatches?: ProductionScheduleBatch[];
  railPlannedWindow?: ProductionPlannedWindow | null;
  /** Single-step rail edits that step; exempt it from the live-step conflict. */
  railExcludeStageLogId?: number;
  /** Open batch. Its own planned window is not a booking. */
  railExcludeBatchId?: number;
  expectedOutput: string;
  onExpectedOutputChange: (value: string) => void;
  onExpectedOutputCommit: () => void;
  actualOutput: string;
  onActualOutputChange: (value: string) => void;
  actualDuration: string;
  onActualDurationChange: (value: string) => void;
  onActualOutputCommit: () => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onNotesCommit: () => void;
  efficiencyDisplay: string | null;
  linkedOrders:
    | { orders: LinkedProductionOrder[]; linked_spend_total: number | string }
    | undefined;
}

const stripFieldLabel =
  'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';

const BatchRunContextStrip: React.FC<BatchRunContextStripProps> = ({
  batch,
  canEditBatch,
  workspaceShifts,
  plannedStart,
  selectedShiftId,
  onPlannedStartChange,
  onSelectedShiftIdChange,
  onPlannedStartCommit,
  onShiftCommit,
  showRailMachine,
  railMachineLine,
  railMachineId,
  onRailMachineChange,
  factoryId,
  scheduleBatches,
  railPlannedWindow,
  railExcludeStageLogId,
  railExcludeBatchId,
  expectedOutput: _expectedOutput,
  onExpectedOutputChange: _onExpectedOutputChange,
  onExpectedOutputCommit: _onExpectedOutputCommit,
  actualOutput: _actualOutput,
  onActualOutputChange: _onActualOutputChange,
  actualDuration: _actualDuration,
  onActualDurationChange: _onActualDurationChange,
  onActualOutputCommit: _onActualOutputCommit,
  notes,
  onNotesChange,
  onNotesCommit,
  efficiencyDisplay,
  linkedOrders,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const salesLabel = batch.sales_order_item_id
    ? `For ${batch.sales_account_name ?? 'customer'} · ${batch.sales_order_number ?? 'sales order'}`
    : 'Make-to-stock';

  const linkedSpendSummary =
    (linkedOrders?.orders.length ?? 0) === 0
      ? 'No linked bills'
      : Number(linkedOrders?.linked_spend_total ?? batch.linked_spend_total ?? 0).toLocaleString();

  const showMoreExtras =
    (batch.started_at ?? batch.actual_start_time) ||
    efficiencyDisplay != null ||
    (linkedOrders?.orders.length ?? 0) > 0;

  return (
    <div className="shrink-0 space-y-0">
      <div className="flex min-w-0 items-end gap-3 overflow-x-auto border-b border-border/50 pb-2.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid shrink-0 gap-1">
          <Label className={stripFieldLabel}>When</Label>
          {canEditBatch ? (
            <BatchShiftWhenRow
              compact
              inlineLabels
              singleLine
              embedShiftsInPicker
              shifts={workspaceShifts}
              plannedStart={plannedStart}
              selectedShiftId={selectedShiftId}
              onPlannedStartChange={onPlannedStartChange}
              onSelectedShiftIdChange={onSelectedShiftIdChange}
              onPlannedStartCommit={onPlannedStartCommit}
              onShiftPicked={(plannedLocal, shiftId) => onShiftCommit(plannedLocal, shiftId)}
            />
          ) : (
            <p className="flex h-9 items-center whitespace-nowrap text-sm tabular-nums text-muted-foreground">
              {batch.planned_start_at ? new Date(batch.planned_start_at).toLocaleString() : 'No planned start'}
            </p>
          )}
        </div>

        {showRailMachine && railMachineLine ? (
          <div className="grid w-[10rem] shrink-0 gap-1">
            <ProductionLineMachineSelect
              className="gap-1 [&_label]:text-[10px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground [&_button]:min-h-9 [&_button]:py-1.5"
              line={railMachineLine}
              value={railMachineId}
              onChange={onRailMachineChange}
              disabled={!canEditBatch}
              factoryId={factoryId}
              scheduleBatches={scheduleBatches}
              plannedWindow={railPlannedWindow}
              excludeStageLogId={railExcludeStageLogId}
              excludeBatchId={railExcludeBatchId}
              id="batch-strip-machine"
            />
          </div>
        ) : null}

        <div className="grid w-[5.25rem] shrink-0 gap-1">
          <Label className={stripFieldLabel}>Exp qty</Label>
          <p className="flex h-9 items-center text-sm tabular-nums">
            {batch.expected_output_quantity ?? '—'}
          </p>
        </div>
        <div className="grid w-[5.25rem] shrink-0 gap-1">
          <Label className={stripFieldLabel}>Act qty</Label>
          <p className="flex h-9 items-center text-sm tabular-nums">
            {batch.actual_output_quantity ?? '—'}
          </p>
        </div>
        <div className="grid w-[4.5rem] shrink-0 gap-1">
          <Label className={stripFieldLabel}>Min</Label>
          <p className="flex h-9 items-center text-sm tabular-nums">
            {batch.actual_duration_minutes ?? '—'}
          </p>
        </div>

        <div className="grid shrink-0 gap-1">
          <Label htmlFor="batch-strip-notes" className={stripFieldLabel}>
            Notes
          </Label>
          <BatchStripNotesField
            id="batch-strip-notes"
            value={notes}
            disabled={!canEditBatch}
            onChange={onNotesChange}
            onCommit={onNotesCommit}
          />
        </div>
      </div>

      {(() => {
        const metaRow = (
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1 border-b border-border/50 py-2 text-xs">
            <div className="min-w-0">
              <span className={cn(stripFieldLabel, 'mr-2 normal-case tracking-normal')}>Sales</span>
              <span className="text-foreground">{salesLabel}</span>
            </div>
            <div className="min-w-0">
              <span className={cn(stripFieldLabel, 'mr-2 normal-case tracking-normal')}>Linked spend</span>
              <span className="tabular-nums text-foreground">{linkedSpendSummary}</span>
            </div>
            {showMoreExtras ? (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 gap-1 px-2 text-xs text-muted-foreground"
                >
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 shrink-0 transition-transform', moreOpen && 'rotate-180')}
                  />
                  More
                </Button>
              </CollapsibleTrigger>
            ) : null}
          </div>
        );

        if (!showMoreExtras) {
          return metaRow;
        }

        return (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            {metaRow}
            <CollapsibleContent className="space-y-2 border-t border-border/40 pb-0.5 pt-2 text-sm">
              {(batch.started_at ?? batch.actual_start_time) && (
                <div>
                  <p className={stripFieldLabel}>Actual start</p>
                  <p className="mt-0.5 tabular-nums text-sm">
                    {new Date((batch.started_at ?? batch.actual_start_time) as string).toLocaleString()}
                  </p>
                </div>
              )}
              {efficiencyDisplay != null && (
                <div>
                  <p className={stripFieldLabel}>Efficiency</p>
                  <p className="mt-0.5 tabular-nums text-sm">{efficiencyDisplay}</p>
                </div>
              )}
              {(linkedOrders?.orders.length ?? 0) > 0 ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {linkedOrders?.orders.map((order) => (
                    <li key={`${order.order_kind}-${order.id}`}>
                      {order.number}
                      {order.account_name ? ` · ${order.account_name}` : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        );
      })()}
    </div>
  );
};

export default BatchRunContextStrip;
