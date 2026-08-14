import React, { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';

import AppShellHeader, {
  appShellHeaderLeftGroupClass,
  appShellHeaderIconTileClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import AttachmentPanel from '@/components/newcomponents/customui/AttachmentPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateHelpTicketMutation,
  useListHelpTicketsQuery,
  useUpdateHelpTicketMutation,
} from '@/features/helpTickets/helpTicketsApi';
import { useFormatDateTimeFromApi } from '@/hooks/useFormatDateFromApi';
import { appToast } from '@/lib/appToast';
import { cn } from '@/lib/utils';
import type { HelpTicket, HelpTicketStatus } from '@/types/helpTicket';

const STATUS_FILTER_ALL = 'all';

const HelpPage: React.FC = () => {
  const formatDateTime = useFormatDateTimeFromApi();
  const [statusFilter, setStatusFilter] = useState<HelpTicketStatus | typeof STATUS_FILTER_ALL>(
    STATUS_FILTER_ALL,
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const listArgs = useMemo(
    () => (statusFilter === STATUS_FILTER_ALL ? undefined : { status: statusFilter }),
    [statusFilter],
  );
  const { data: tickets = [], isLoading, isError } = useListHelpTicketsQuery(listArgs);
  const [createTicket, { isLoading: isCreating }] = useCreateHelpTicketMutation();
  const [updateTicket, { isLoading: isUpdating }] = useUpdateHelpTicketMutation();

  const selectedTicket: HelpTicket | null = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !tickets.some((t) => t.id === selectedId)) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle || !trimmedDescription) {
      appToast.error('Title and description are required.');
      return;
    }
    try {
      const created = await createTicket({
        title: trimmedTitle,
        description: trimmedDescription,
        category: category.trim() || null,
      }).unwrap();
      appToast.success('Support ticket created.');
      setCreateOpen(false);
      resetCreateForm();
      setSelectedId(created.id);
    } catch {
      appToast.error('Could not create ticket.');
    }
  };

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
              <h1 className={appShellHeaderTitleClass}>Help</h1>
              <p className="text-xs text-muted-foreground">
                Workspace support — bugs, how-to, billing, and more
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New ticket
            </Button>
          </div>
        </div>
      </AppShellHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-full shrink-0 flex-col border-r border-border md:w-80 lg:w-96">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tickets
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : isError ? (
              <p className="p-4 text-sm text-destructive">Could not load tickets.</p>
            ) : tickets.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No tickets yet. Create one to get support.
              </p>
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
                        <p className="mt-1 text-xs text-muted-foreground">{ticket.ticket_number}</p>
                        {ticket.category ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{ticket.category}</p>
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
                      {selectedTicket.ticket_number}
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

              {/* TODO: platform admin cross-workspace support console */}
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              Select a ticket or create a new one.
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="flex max-h-[66vh] w-[min(36rem,94vw)] max-w-none flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>New support ticket</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-1">
            <div className="space-y-2">
              <Label htmlFor="help-title">Title</Label>
              <Input
                id="help-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Brief summary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-category">Category (optional)</Label>
              <Input
                id="help-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={80}
                placeholder="e.g. Billing, Bug, How-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-description">Description</Label>
              <Textarea
                id="help-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Describe the issue or question…"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isCreating} onClick={handleCreate}>
              Create ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpPage;
