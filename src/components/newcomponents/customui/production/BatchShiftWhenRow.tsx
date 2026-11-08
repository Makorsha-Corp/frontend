import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { WorkspaceShift } from '@/types/workspaceShift';
import DateTimePickerField from '@/components/newcomponents/customui/DateTimePickerField';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import {
  findShiftForDate,
  formatShiftChipLabel,
  plannedStartForShiftSelection,
  shiftWindowStartOnDate,
  toDatetimeLocalValue,
  parseTimeToMinutes,
} from '@/lib/workspaceShiftChipUtils';

export interface BatchShiftWhenRowProps {
  shifts: WorkspaceShift[];
  plannedStart: string;
  selectedShiftId: number | null;
  onPlannedStartChange: (value: string) => void;
  onSelectedShiftIdChange: (id: number | null) => void;
  className?: string;
  /** One bordered block: section title, shift chips, planned start (dialog rail). */
  groupedSection?: boolean;
  /** Compact strip: inline shift chips + narrower planned start. */
  compact?: boolean;
  /** Strip mode: smaller chips, sr-only planned start label. */
  inlineLabels?: boolean;
  singleLine?: boolean;
  onPlannedStartCommit?: (plannedLocal: string) => void;
  /** Morning/evening chip. Parent should save these values, not the previous state. */
  onShiftPicked?: (plannedLocal: string, shiftId: number) => void;
  /** Strip mode: shift chips live inside the planned-start popover. */
  embedShiftsInPicker?: boolean;
}

const BatchShiftWhenRow: React.FC<BatchShiftWhenRowProps> = ({
  shifts,
  plannedStart,
  selectedShiftId,
  onPlannedStartChange,
  onSelectedShiftIdChange,
  className,
  groupedSection = false,
  compact = false,
  inlineLabels = false,
  singleLine = false,
  onPlannedStartCommit,
  onShiftPicked,
  embedShiftsInPicker = false,
}) => {
  const { use24Hour } = useUserTimeFormat();
  const activeShifts = shifts.filter((s) => s.is_active);
  const showShiftChipsOutside = !embedShiftsInPicker;
  const selectedShift = activeShifts.find((shift) => shift.id === selectedShiftId);
  const selectedShiftMinutes = selectedShift
    ? parseTimeToMinutes(selectedShift.start_time)
    : null;

  const handleChipClick = (shift: WorkspaceShift) => {
    if (selectedShiftId === shift.id) return;
    const hasDate = Boolean(plannedStart);
    const ref = hasDate ? new Date(plannedStart) : new Date();
    const next = hasDate
      ? shiftWindowStartOnDate(shift, ref)
      : plannedStartForShiftSelection(shift, ref);
    const local = toDatetimeLocalValue(next);
    onSelectedShiftIdChange(shift.id);
    onPlannedStartChange(local);
    onShiftPicked?.(local, shift.id);
  };

  const handlePlannedChange = (value: string) => {
    onPlannedStartChange(value);
    if (!value) {
      onSelectedShiftIdChange(null);
      return;
    }
    const matched = findShiftForDate(activeShifts, new Date(value));
    onSelectedShiftIdChange(matched?.id ?? null);
  };

  const shiftChips =
    showShiftChipsOutside && activeShifts.length > 0 ? (
      <div
        className={cn(
          'flex gap-2',
          singleLine ? 'shrink-0 flex-nowrap' : 'flex-wrap',
        )}
        role="group"
        aria-label="Workspace shift"
      >
        {activeShifts.map((shift) => (
          <button
            key={shift.id}
            type="button"
            className={cn(
              'inline-flex items-center rounded-md border font-medium transition-colors',
              inlineLabels
                ? singleLine
                  ? 'h-9 whitespace-nowrap px-3 text-xs'
                  : 'h-9 max-w-[11rem] truncate px-3 text-xs'
                : 'px-3 py-1.5 text-xs',
              selectedShiftId === shift.id
                ? 'border-brand-primary bg-brand-primary/15 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={() => handleChipClick(shift)}
            title={formatShiftChipLabel(shift, use24Hour)}
          >
            <span className={singleLine && inlineLabels ? undefined : 'truncate'}>
              {formatShiftChipLabel(shift, use24Hour)}
            </span>
          </button>
        ))}
      </div>
    ) : null;

  const plannedStartField = (
    <div className={cn('grid', inlineLabels ? 'gap-1' : 'gap-1.5')}>
      <Label
        htmlFor="batch-planned-start"
        className={cn(inlineLabels && 'sr-only')}
      >
        Planned start
      </Label>
      <DateTimePickerField
        id="batch-planned-start"
        className={cn(
          groupedSection
            ? 'w-full max-w-none'
            : compact
              ? singleLine
                ? 'w-max min-w-[12.5rem] max-w-[min(20rem,70vw)] shrink-0'
                : 'w-[min(12rem,44vw)] shrink-0'
              : 'max-w-md',
        )}
        triggerClassName={
          inlineLabels ? cn('h-9 text-sm', singleLine && 'w-max whitespace-nowrap') : undefined
        }
        value={plannedStart}
        defaultHour24={
          selectedShiftMinutes == null ? undefined : Math.floor(selectedShiftMinutes / 60)
        }
        defaultMinute={selectedShiftMinutes == null ? undefined : selectedShiftMinutes % 60}
        onChange={handlePlannedChange}
        onPopoverClosed={onPlannedStartCommit}
        aria-label="Planned start date and time"
        shifts={embedShiftsInPicker ? activeShifts : undefined}
        selectedShiftId={embedShiftsInPicker ? selectedShiftId : undefined}
        onSelectedShiftIdChange={embedShiftsInPicker ? onSelectedShiftIdChange : undefined}
        onShiftPicked={embedShiftsInPicker ? onShiftPicked : undefined}
      />
    </div>
  );

  if (groupedSection) {
    return (
      <section
        className={cn(
          'rounded-md border border-border bg-muted/20 px-3 py-3 space-y-3',
          className,
        )}
        aria-labelledby="batch-when-section-title"
      >
        <p
          id="batch-when-section-title"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          When
        </p>
        {shiftChips}
        {plannedStartField}
      </section>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex min-w-0 items-center gap-2',
          singleLine ? 'flex-nowrap' : 'flex-wrap items-end',
          className,
        )}
      >
        {shiftChips}
        {plannedStartField}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {shiftChips}
      {plannedStartField}
    </div>
  );
};

export default BatchShiftWhenRow;
