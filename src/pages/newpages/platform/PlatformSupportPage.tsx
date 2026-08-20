import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { LifeBuoy } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import AppShellHeader, {
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import AttachmentPanel from '@/components/newcomponents/customui/AttachmentPanel';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useListPlatformHelpTicketsQuery,
  useUpdateHelpTicketMutation,
} from '@/features/helpTickets/helpTicketsApi';
import { setWorkspace, setWorkspaceHeaderOnly } from '@/features/auth/authSlice';
import { useFormatDateTimeFromApi } from '@/hooks/useFormatDateFromApi';
import { appToast } from '@/lib/appToast';
import { cn } from '@/lib/utils';
import type { HelpTicketStatus, PlatformHelpTicket } from '@/types/helpTicket';
import type { Workspace } from '@/types/workspace';
import { apiErrorDetail } from '@/utils/apiError';

const STATUS_FILTER_ALL = 'all';

const PlatformSupportPage: React.FC = () => {
  const formatDateTime = useFormatDateTimeFromApi();
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) => state.auth.workspace);
  const restoreWorkspaceRef = useRef<Workspace | null>(null);
  if (restoreWorkspaceRef.current === null && workspace) {
    restoreWorkspaceRef.current = workspace;
  }

  const [statusFilter, setStatusFilter] = useState<HelpTicketStatus | typeof STATUS_FILTER_ALL>(
    STATUS_FILTER_ALL,
  );
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listArgs = useMemo(
    () => ({
      ...(statusFilter === STATUS_FILTER_ALL ? {} : { status: statusFilter }),
      ...(searchDebounced ? { search: searchDebounced } : {}),
    }),
    [statusFilter, searchDebounced],
  );

  const { data: tickets = [], isLoading, isError, error } = useListPlatformHelpTicketsQuery(listArgs);
  const [updateTicket, { isLoading: isUpdating }] = useUpdateHelpTicketMutation();

  const listErrorMessage = useMemo(() => {
    if (!isError || !error) return null;
    const err = error as FetchBaseQueryError;
    const status = err.status;
    const detail = apiErrorDetail(error, '');
    if (status === 403) {
      return detail || 'Platform admin access required. Log out and back in after admin is granted.';
    }
    if (status === 503) {
      return detail || 'Database schema out of date — run alembic upgrade head on the backend.';
    }
    if (status === 500) {
      return detail || 'Server error loading tickets — check the backend terminal.';
    }
    if (typeof status === 'number') {
      return detail || `Could not load tickets (HTTP ${status}).`;
    }
    return detail || 'Could not load tickets — is the backend running on localhost:8000?';
  }, [isError, error]);

  const selectedTicket: PlatformHelpTicket | null = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current != null && tickets.some((t) => t.id === current)) {
        return current;
      }
      return tickets[0]?.id ?? null;
    });
  }, [tickets]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    const home = restoreWorkspaceRef.current;
    dispatch(
      setWorkspaceHeaderOnly({
        id: selectedTicket.workspace_id,
        name: selectedTicket.workspace_name,
        role: home?.role ?? workspace?.role ?? '',
        status: 'active',
      }),
    );
  }, [
    selectedTicket?.id,
    selectedTicket?.workspace_id,
    selectedTicket?.workspace_name,
    dispatch,
    workspace?.role,
  ]);

  useEffect(() => {
    return () => {
      if (restoreWorkspaceRef.current) {
        dispatch(setWorkspace(restoreWorkspaceRef.current));
      }
    };
  }, [dispatch]);

  const handleToggleStatus = async () => {
    if (!selectedTicket) return;
    const nextStatus: HelpTicketStatus =
      selectedTicket.status === 'open' ? 'closed' : 'open';
    try {
      await updateTicket({
        ticketId: selectedTicket.id,
        data: { status: nextStatus },
      }).unwrap();
      appToast.success(nextStatus === 'closed' ? 'Ticket closed.' : 'Ticket reopened.');
    } catch {
      appToast.error('Could not update ticket status.');
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppShellHeader sticky>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={appShellHeaderLeftGroupClass}>
            <div className={appShellHeaderIconTileClass}>
              <LifeBuoy className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h1 className={appShellHeaderTitleClass}>Support inbox</h1>
              <p className="text-xs text-muted-foreground">All mill workspaces</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="w-[200px]"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as HelpTicketStatus | typeof STATUS_FILTER_ALL)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AppShellHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-full shrink-0 flex-col border-r border-border md:w-96 lg:w-[28rem]">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tickets
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : isError ? (
              <p className="p-4 text-sm text-destructive">{listErrorMessage}</p>
            ) : tickets.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No tickets match.</p>
            ) : (
              <ul>
                {tickets.map((ticket) => {
                  const isSelected = ticket.id === selectedId;
                  return (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(ticket.id)}
                        className={cn(
                          'w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                          isSelected && 'bg-muted',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 text-sm font-medium">{ticket.title}</span>
                          <Badge
                            variant={ticket.status === 'open' ? 'default' : 'secondary'}
                            className="shrink-0 capitalize"
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-medium text-brand-primary">
                          {ticket.workspace_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{ticket.ticket_number}</p>
                        {ticket.creator_name ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            By {ticket.creator_name}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(ticket.created_at)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          {selectedTicket ? (
            <div className="mx-auto max-w-3xl space-y-6">
              <section className="rounded-lg border border-border bg-card p-4 md:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {selectedTicket.workspace_name} · {selectedTicket.ticket_number}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{selectedTicket.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={selectedTicket.status === 'open' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {selectedTicket.status}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={handleToggleStatus}
                    >
                      {selectedTicket.status === 'open' ? 'Close ticket' : 'Reopen ticket'}
                    </Button>
                  </div>
                </div>
                {selectedTicket.creator_name ? (
                  <p className="mb-3 text-sm text-muted-foreground">
                    Filed by {selectedTicket.creator_name}
                  </p>
                ) : null}
                {selectedTicket.category ? (
                  <p className="mb-3 text-sm text-muted-foreground">
                    Category: {selectedTicket.category}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedTicket.description}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Created {formatDateTime(selectedTicket.created_at)}
                  {selectedTicket.closed_at
                    ? ` · Closed ${formatDateTime(selectedTicket.closed_at)}`
                    : null}
                </p>
              </section>

              <DiscussionThread
                entityType="support_ticket"
                entityId={selectedTicket.id}
              />

              <section className="rounded-lg border border-border bg-card p-4 md:p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Attachments
                </h3>
                <AttachmentPanel
                  entityType="support_ticket"
                  entityId={selectedTicket.id}
                  entityLabel={selectedTicket.ticket_number}
                />
              </section>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              Select a ticket from the inbox.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PlatformSupportPage;
