import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { LifeBuoy, MessageSquare, type LucideIcon } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import PlatformInboxShellHeader from '@/components/newcomponents/customui/platform/PlatformInboxShellHeader';
import HelpTicketDetailPanel from '@/components/newcomponents/customui/help/HelpTicketDetailPanel';
import HelpTicketListPanel from '@/components/newcomponents/customui/help/HelpTicketListPanel';
import { STATUS_FILTER_ALL, getHelpCopy, type HelpStatusFilter } from '@/components/newcomponents/customui/help/helpCopy';
import {
  useListPlatformHelpTicketsQuery,
  useUpdateHelpTicketMutation,
} from '@/features/helpTickets/helpTicketsApi';
import { setWorkspace, setWorkspaceHeaderOnly } from '@/features/auth/authSlice';
import { useFormatDateTimeFromApi } from '@/hooks/useFormatDateFromApi';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { appToast } from '@/lib/appToast';
import { cn } from '@/lib/utils';
import type { HelpTicketStatus, HelpTicketType, PlatformHelpTicket } from '@/types/helpTicket';
import type { Workspace } from '@/types/workspace';
import { apiErrorDetail } from '@/utils/apiError';

const INBOX_META: Record<
  HelpTicketType,
  { icon: LucideIcon; title: string; subtitle: string }
> = {
  support: {
    icon: LifeBuoy,
    title: 'Support inbox',
    subtitle: 'All mill workspaces',
  },
  feedback: {
    icon: MessageSquare,
    title: 'Feedback inbox',
    subtitle: 'All mill workspaces',
  },
};

function buildListErrorMessage(
  isError: boolean,
  error: unknown,
  type: HelpTicketType,
): string | null {
  if (!isError || !error) return null;
  const err = error as FetchBaseQueryError;
  const status = err.status;
  const detail = apiErrorDetail(error, '');
  const noun = type === 'feedback' ? 'feedback' : 'tickets';

  if (status === 403) {
    return detail || 'Platform admin access required. Log out and back in after admin is granted.';
  }
  if (status === 503) {
    return detail || 'Database schema out of date — run alembic upgrade head on the backend.';
  }
  if (status === 500) {
    return detail || `Server error loading ${noun} — check the backend terminal.`;
  }
  if (typeof status === 'number') {
    return detail || `Could not load ${noun} (HTTP ${status}).`;
  }
  return detail || `Could not load ${noun} — is the backend running on localhost:8000?`;
}

interface PlatformHelpInboxPageProps {
  type: HelpTicketType;
}

const PlatformHelpInboxPage: React.FC<PlatformHelpInboxPageProps> = ({ type }) => {
  const formatDateTime = useFormatDateTimeFromApi();
  const isLgScreen = useIsLgScreen();
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) => state.auth.workspace);
  const restoreWorkspaceRef = useRef<Workspace | null>(null);
  if (restoreWorkspaceRef.current === null && workspace) {
    restoreWorkspaceRef.current = workspace;
  }

  const [statusFilter, setStatusFilter] = useState<HelpStatusFilter>(STATUS_FILTER_ALL);
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const copy = getHelpCopy(type);
  const meta = INBOX_META[type];

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listArgs = useMemo(
    () => ({
      type,
      ...(statusFilter === STATUS_FILTER_ALL ? {} : { status: statusFilter as HelpTicketStatus }),
      ...(searchDebounced ? { search: searchDebounced } : {}),
    }),
    [type, statusFilter, searchDebounced],
  );

  const { data: tickets = [], isLoading, isError, error } = useListPlatformHelpTicketsQuery(listArgs);
  const [updateTicket, { isLoading: isUpdating }] = useUpdateHelpTicketMutation();

  const listErrorMessage = useMemo(
    () => buildListErrorMessage(isError, error, type),
    [isError, error, type],
  );

  const selectedTicket: PlatformHelpTicket | null = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }

    if (isLgScreen) {
      if (selectedId == null || !tickets.some((ticket) => ticket.id === selectedId)) {
        setSelectedId(tickets[0]?.id ?? null);
      }
      return;
    }

    if (selectedId != null && !tickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(null);
    }
  }, [tickets, selectedId, isLgScreen]);

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

    const nextStatus: HelpTicketStatus = selectedTicket.status === 'open' ? 'closed' : 'open';
    try {
      await updateTicket({
        ticketId: selectedTicket.id,
        data: { status: nextStatus },
      }).unwrap();
      appToast.success(
        nextStatus === 'closed' ? copy.statusCloseSuccess : copy.statusReopenSuccess,
      );
    } catch {
      appToast.error(copy.statusUpdateError);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <PlatformInboxShellHeader
        icon={meta.icon}
        title={meta.title}
        subtitle={meta.subtitle}
        searchPlaceholder={copy.searchPlaceholder}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        selectedTicketLabel={selectedTicket?.ticket_number ?? null}
        onClearSelection={() => setSelectedId(null)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            'flex min-h-0 w-full shrink-0 flex-col border-r border-border lg:w-96',
            selectedId != null && 'hidden lg:flex',
          )}
        >
          <HelpTicketListPanel
            type={type}
            variant="platform"
            tickets={tickets}
            selectedId={selectedId}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelect={setSelectedId}
            isLoading={isLoading}
            isError={isError}
            loadError={listErrorMessage}
            onCreate={() => {}}
          />
        </aside>

        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6',
            selectedId == null && 'hidden lg:block',
          )}
        >
          <HelpTicketDetailPanel
            type={type}
            ticket={selectedTicket}
            workspaceName={selectedTicket?.workspace_name}
            formatDateTime={formatDateTime}
            isUpdating={isUpdating}
            onToggleStatus={handleToggleStatus}
            onCreate={() => {}}
            hideWelcome
          />
        </main>
      </div>
    </div>
  );
};

export default PlatformHelpInboxPage;
