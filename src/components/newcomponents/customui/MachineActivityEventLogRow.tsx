import React, { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MachineActivityEvent } from '@/types/machineActivityEvent';
import { formatRelativeFromApi } from '@/utils/datetime';
import { resolveMachineActivityVisual } from './machineActivityEventVisuals';

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const displayValue = (value: string | null | undefined) => value ?? '—';

interface MachineActivityEventLogRowProps {
  event: MachineActivityEvent;
  isLast: boolean;
  onDeleteMaintenance?: (maintenanceLogId: number) => void;
}

const MachineActivityEventLogRow: React.FC<MachineActivityEventLogRowProps> = ({
  event,
  isLast,
  onDeleteMaintenance,
}) => {
  const [open, setOpen] = useState(false);
  const ev = resolveMachineActivityVisual(event.event_type, event.metadata?.status);
  const Icon = ev.icon;
  const changes = event.metadata?.changes ?? [];
  const hasChanges = changes.length > 0;
  const maintenanceLogId = event.metadata?.maintenance_log_id;
  const canDeleteMaintenance =
    event.event_type === 'maintenance_logged' &&
    maintenanceLogId != null &&
    onDeleteMaintenance != null;

  return (
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        {hasChanges ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-start justify-between gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group inline-flex max-w-full flex-col items-start gap-0.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={open}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="text-sm font-medium text-card-foreground group-hover:underline">
                      {event.description}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180'
                      )}
                    />
                  </span>
                  {!open && (
                    <span className="text-[11px] text-muted-foreground">
                      {changes.length} field{changes.length === 1 ? '' : 's'} — click to expand
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeFromApi(event.created_at)}
              </span>
            </div>
            <CollapsibleContent>
              <ul className="mt-2 space-y-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                {changes.map((change) => (
                  <li key={`${change.field}-${change.label}`} className="text-xs text-muted-foreground">
                    <span className="font-medium text-card-foreground">{change.label}:</span>{' '}
                    <span>{displayValue(change.from_value)}</span>
                    <span className="mx-1 text-muted-foreground/70">→</span>
                    <span className="text-card-foreground">{displayValue(change.to_value)}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="flex min-h-8 items-center justify-between gap-3">
            <p className="text-sm font-medium leading-none text-card-foreground">{event.description}</p>
            <span className="shrink-0 text-xs leading-none text-muted-foreground whitespace-nowrap">
              {formatRelativeFromApi(event.created_at)}
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          {event.performer_name ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-white">
                {initialsOf(event.performer_name)}
              </div>
              <span className="truncate text-xs text-muted-foreground">{event.performer_name}</span>
            </div>
          ) : (
            <span />
          )}
          {canDeleteMaintenance && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDeleteMaintenance!(maintenanceLogId!)}
                  aria-label="Delete maintenance log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete log</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineActivityEventLogRow;
