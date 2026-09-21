import React from 'react';

import { cn } from '@/lib/utils';
import { formatAbsoluteFromApi, formatRelativeFromApi } from '@/utils/datetime';
import type { HelpTicket, HelpTicketType } from '@/types/helpTicket';

import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';

import HelpEmptyState from './HelpEmptyState';
import HelpStatusFilter from './HelpStatusFilter';
import HelpTicketStatusBadge from './HelpTicketStatusBadge';
import { getHelpCopy, type HelpStatusFilter as HelpStatusFilterValue } from './helpCopy';

function getWorkspaceName(ticket: HelpTicket): string | null {
  if ('workspace_name' in ticket && typeof ticket.workspace_name === 'string') {
    return ticket.workspace_name;
  }
  return null;
}

interface HelpTicketListPanelProps {
  type: HelpTicketType;
  tickets: HelpTicket[];
  selectedId: number | null;
  statusFilter: HelpStatusFilterValue;
  onStatusFilterChange: (value: HelpStatusFilterValue) => void;
  onSelect: (id: number) => void;
  isLoading: boolean;
  isError: boolean;
  onCreate: () => void;
  variant?: 'mill' | 'platform';
  showWorkspace?: boolean;
  loadError?: string | null;
  hideCreate?: boolean;
  emptyMessage?: string;
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-border/60">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

const HelpTicketListPanel: React.FC<HelpTicketListPanelProps> = ({
  type,
  tickets,
  selectedId,
  statusFilter,
  onStatusFilterChange,
  onSelect,
  isLoading,
  isError,
  onCreate,
  variant = 'mill',
  showWorkspace = variant === 'platform',
  loadError,
  hideCreate = variant === 'platform',
  emptyMessage,
}) => {
  const copy = getHelpCopy(type);
  const errorMessage = loadError ?? copy.loadError;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.listSectionTitle}
        </span>
        <HelpStatusFilter value={statusFilter} onChange={onStatusFilterChange} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">{errorMessage}</p>
        ) : tickets.length === 0 ? (
          hideCreate ? (
            <p className="p-4 text-sm text-muted-foreground">
              {emptyMessage ?? 'No tickets match.'}
            </p>
          ) : (
            <HelpEmptyState type={type} onCreate={onCreate} compact />
          )
        ) : (
          <ul>
            {tickets.map((ticket) => {
              const isSelected = ticket.id === selectedId;
              const absoluteTime = formatAbsoluteFromApi(ticket.created_at);
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(ticket.id)}
                    className={cn(
                      'w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      isSelected && 'border-l-2 border-l-brand-primary bg-muted pl-[14px]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {ticket.status === 'open' ? (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                            aria-label="Open"
                          />
                        ) : (
                          <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                        )}
                        <span className="line-clamp-2 text-sm font-medium">{ticket.title}</span>
                      </div>
                      <HelpTicketStatusBadge status={ticket.status} className="shrink-0" />
                    </div>
                    {showWorkspace && getWorkspaceName(ticket) ? (
                      <p className="mt-1 pl-4 text-xs font-medium text-brand-primary">
                        {getWorkspaceName(ticket)}
                      </p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-4 text-xs text-muted-foreground">
                      <ReferenceId>{ticket.ticket_number}</ReferenceId>
                      {ticket.category ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                            {ticket.category}
                          </span>
                        </>
                      ) : null}
                      <span aria-hidden>·</span>
                      <span title={absoluteTime}>{formatRelativeFromApi(ticket.created_at)}</span>
                    </div>
                    {ticket.creator_name ? (
                      <p className="mt-1 pl-4 text-xs text-muted-foreground">
                        By {ticket.creator_name}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HelpTicketListPanel;
