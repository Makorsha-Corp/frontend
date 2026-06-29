import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { InvoiceEvent } from '@/types/accountInvoice';
import { formatRelativeFromApi } from '@/utils/datetime';
import { INVOICE_EVENT_VISUALS } from './invoiceEventVisuals';
import { formatInvoiceEventDisplay, collapsedLinesPreview } from './formatInvoiceEventDisplay';

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const displayValue = (value: string | null | undefined) => value ?? '—';

interface InvoiceEventLogRowProps {
  event: InvoiceEvent;
  isLast: boolean;
}

const InvoiceEventLogRow: React.FC<InvoiceEventLogRowProps> = ({ event, isLast }) => {
  const [open, setOpen] = useState(false);
  const ev = INVOICE_EVENT_VISUALS[event.event_type] ?? INVOICE_EVENT_VISUALS.default;
  const Icon = ev.icon;
  const display = formatInvoiceEventDisplay(event);
  const hasLines = display.lines.length > 0;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        {hasLines ? (
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
                      {display.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180'
                      )}
                    />
                  </span>
                  {!open && display.subtitle ? (
                    <span className="text-[11px] text-muted-foreground">{display.subtitle}</span>
                  ) : !open && hasLines ? (
                    <span className="text-[11px] text-muted-foreground">
                      {collapsedLinesPreview(display.lines)}
                    </span>
                  ) : null}
                </button>
              </CollapsibleTrigger>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeFromApi(event.created_at)}
              </span>
            </div>
            <CollapsibleContent>
              <ul className="mt-2 space-y-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                {display.lines.map((line) => (
                  <li key={line.label} className="text-xs text-muted-foreground">
                    <span className="font-medium text-card-foreground">{line.label}:</span>{' '}
                    {line.from_value != null ? (
                      <>
                        <span>{displayValue(line.from_value)}</span>
                        <span className="mx-1 text-muted-foreground/70">→</span>
                        <span className="text-card-foreground">{displayValue(line.to_value)}</span>
                      </>
                    ) : (
                      <span className="text-card-foreground">{displayValue(line.to_value)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground">{display.title}</p>
              {display.subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{display.subtitle}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeFromApi(event.created_at)}
            </span>
          </div>
        )}
        {event.performed_by_name ? (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-white">
              {initialsOf(event.performed_by_name)}
            </div>
            <span className="text-xs text-muted-foreground">{event.performed_by_name}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InvoiceEventLogRow;
