import React from 'react';
import type { CalendarEvent } from '@/types/calendar';

function formatMetaValue(value: unknown): string {
  if (value == null || value === '') return '—';
  return String(value);
}

export interface CalendarGenericEventPreviewProps {
  event: CalendarEvent;
}

const CalendarGenericEventPreview: React.FC<CalendarGenericEventPreviewProps> = ({ event }) => {
  const metaEntries = Object.entries(event.meta ?? {}).filter(
    ([, value]) => value != null && value !== '',
  );

  if (metaEntries.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-muted-foreground">No additional details.</p>
    );
  }

  return (
    <dl className="space-y-2 px-4 py-3 text-xs">
      {metaEntries.map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-3">
          <dt className="capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
          <dd className="text-right font-medium text-foreground">{formatMetaValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
};

export default CalendarGenericEventPreview;
