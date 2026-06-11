import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ProjectEvent } from '@/types/project';
import { formatRelativeFromApi } from '@/utils/datetime';
import { PROJECT_EVENT_VISUALS } from './projectEventVisuals';

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const displayValue = (value: string | null | undefined) => value ?? '—';

interface ProjectEventLogRowProps {
  event: ProjectEvent;
  isLast: boolean;
}

const ProjectEventLogRow: React.FC<ProjectEventLogRowProps> = ({ event, isLast }) => {
  const [open, setOpen] = useState(false);
  const ev = PROJECT_EVENT_VISUALS[event.event_type] ?? PROJECT_EVENT_VISUALS.default;
  const Icon = ev.icon;
  const changes = event.metadata?.changes ?? [];
  const hasChanges = changes.length > 0;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
        {hasChanges ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-start justify-between gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group inline-flex max-w-full flex-col items-start gap-0.5 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      {changes.length} change{changes.length === 1 ? '' : 's'}
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
                {formatRelativeFromApi(event.created_at)}
              </span>
            </div>
            <CollapsibleContent className="mt-2 space-y-1.5">
              {changes.map((change) => (
                <div
                  key={`${change.field}-${change.label}`}
                  className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs"
                >
                  <p className="font-medium text-card-foreground">{change.label}</p>
                  <p className="text-muted-foreground">
                    {displayValue(change.from_value)} → {displayValue(change.to_value)}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-card-foreground">{event.description}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
              {formatRelativeFromApi(event.created_at)}
            </span>
          </div>
        )}
        {(event.metadata?.component_name || event.user_name) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {event.metadata?.component_name && (
              <span>Component: {event.metadata.component_name}</span>
            )}
            {event.user_name && (
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                  {initialsOf(event.user_name)}
                </span>
                {event.user_name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEventLogRow;
