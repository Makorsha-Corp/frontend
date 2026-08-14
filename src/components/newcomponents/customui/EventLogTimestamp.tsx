import React from 'react';

import { useDisplayTimezone } from '@/hooks/useDisplayTimezone';
import { formatAbsoluteFromApi, formatRelativeFromApi } from '@/utils/datetime';

export interface EventLogTimestampProps {
  createdAt: string;
  showAbsoluteTimes?: boolean;
  onToggle?: () => void;
}

const EventLogTimestamp: React.FC<EventLogTimestampProps> = ({
  createdAt,
  showAbsoluteTimes = false,
  onToggle,
}) => {
  const timeZone = useDisplayTimezone();
  const label = showAbsoluteTimes
    ? formatAbsoluteFromApi(createdAt, timeZone)
    : formatRelativeFromApi(createdAt);

  if (!onToggle) {
    return <span className="text-xs text-muted-foreground shrink-0">{label}</span>;
  }

  return (
    <button
      type="button"
      className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      title={showAbsoluteTimes ? 'Show relative times' : 'Show exact dates and times'}
    >
      {label}
    </button>
  );
};

export default EventLogTimestamp;
