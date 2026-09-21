import React, { useEffect, useMemo, useState } from 'react';

import HelpPageShellHeader from '@/components/newcomponents/customui/help/HelpPageShellHeader';
import HelpTicketCreateDialog, {
  type HelpTicketCreateFormState,
} from '@/components/newcomponents/customui/help/HelpTicketCreateDialog';
import HelpTicketDetailPanel from '@/components/newcomponents/customui/help/HelpTicketDetailPanel';
import HelpTicketListPanel from '@/components/newcomponents/customui/help/HelpTicketListPanel';
import {
  filterTicketsBySearch,
  getHelpCopy,
  STATUS_FILTER_ALL,
  type HelpStatusFilter,
} from '@/components/newcomponents/customui/help/helpCopy';
import {
  useCreateHelpTicketMutation,
  useListHelpTicketsQuery,
  useUpdateHelpTicketMutation,
} from '@/features/helpTickets/helpTicketsApi';
import { useFormatDateTimeFromApi } from '@/hooks/useFormatDateFromApi';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { appToast } from '@/lib/appToast';
import { cn } from '@/lib/utils';
import type { HelpTicket, HelpTicketStatus, HelpTicketType } from '@/types/helpTicket';

const HelpPage: React.FC = () => {
  const formatDateTime = useFormatDateTimeFromApi();
  const isLgScreen = useIsLgScreen();

  const [activeType, setActiveType] = useState<HelpTicketType>('support');
  const [statusFilter, setStatusFilter] = useState<HelpStatusFilter>(STATUS_FILTER_ALL);
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const listArgs = useMemo(
    () => ({
      type: activeType,
      ...(statusFilter === STATUS_FILTER_ALL ? {} : { status: statusFilter as HelpTicketStatus }),
    }),
    [activeType, statusFilter],
  );

  const { data: tickets = [], isLoading, isError } = useListHelpTicketsQuery(listArgs);
  const [createTicket, { isLoading: isCreating }] = useCreateHelpTicketMutation();
  const [updateTicket, { isLoading: isUpdating }] = useUpdateHelpTicketMutation();

  const filteredTickets = useMemo(
    () => filterTicketsBySearch(tickets, searchInput),
    [tickets, searchInput],
  );

  const selectedTicket: HelpTicket | null = useMemo(
    () => filteredTickets.find((ticket) => ticket.id === selectedId) ?? null,
    [filteredTickets, selectedId],
  );

  useEffect(() => {
    if (filteredTickets.length === 0) {
      setSelectedId(null);
      return;
    }

    if (isLgScreen) {
      if (selectedId == null || !filteredTickets.some((ticket) => ticket.id === selectedId)) {
        setSelectedId(filteredTickets[0].id);
      }
      return;
    }

    if (selectedId != null && !filteredTickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredTickets, selectedId, isLgScreen]);

  useEffect(() => {
    setSearchInput('');
  }, [activeType]);

  const copy = getHelpCopy(activeType);

  const handleCreate = async (form: HelpTicketCreateFormState) => {
    if (!form.title || !form.description) {
      appToast.error('Title and description are required.');
      return;
    }

    try {
      const created = await createTicket({
        title: form.title,
        description: form.description,
        category: form.category || null,
        type: activeType,
      }).unwrap();
      appToast.success(copy.createSuccessToast);
      setCreateOpen(false);
      setSelectedId(created.id);
    } catch {
      appToast.error(copy.createErrorToast);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTicket) return;

    const nextStatus = selectedTicket.status === 'open' ? 'closed' : 'open';
    try {
      await updateTicket({
        ticketId: selectedTicket.id,
        data: { status: nextStatus },
      }).unwrap();
      appToast.success(nextStatus === 'closed' ? copy.statusCloseSuccess : copy.statusReopenSuccess);
    } catch {
      appToast.error(copy.statusUpdateError);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <HelpPageShellHeader
        activeType={activeType}
        onActiveTypeChange={setActiveType}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        selectedTicketLabel={selectedTicket?.ticket_number ?? null}
        onClearSelection={() => setSelectedId(null)}
        onCreate={() => setCreateOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            'flex w-full shrink-0 flex-col border-r border-border lg:w-96',
            selectedId != null && 'hidden lg:flex',
          )}
        >
          <HelpTicketListPanel
            type={activeType}
            tickets={filteredTickets}
            selectedId={selectedId}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelect={setSelectedId}
            isLoading={isLoading}
            isError={isError}
            onCreate={() => setCreateOpen(true)}
          />
        </aside>

        <main
          className={cn(
            'min-w-0 flex-1 overflow-y-auto p-4 md:p-6',
            selectedId == null && 'hidden lg:block',
          )}
        >
          <HelpTicketDetailPanel
            type={activeType}
            ticket={selectedTicket}
            formatDateTime={formatDateTime}
            isUpdating={isUpdating}
            onToggleStatus={handleToggleStatus}
            onCreate={() => setCreateOpen(true)}
          />
        </main>
      </div>

      <HelpTicketCreateDialog
        open={createOpen}
        type={activeType}
        isSubmitting={isCreating}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default HelpPage;
