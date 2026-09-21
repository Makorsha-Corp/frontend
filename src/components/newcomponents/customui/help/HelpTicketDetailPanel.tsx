import React from 'react';
import { Calendar, LifeBuoy, MessageSquare, Tag, User } from 'lucide-react';

import AttachmentPanel from '@/components/newcomponents/customui/AttachmentPanel';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HelpTicket, HelpTicketType } from '@/types/helpTicket';

import { getHelpCopy, helpTicketStatusActionLabel } from './helpCopy';
import HelpTicketStatusBadge from './HelpTicketStatusBadge';

interface HelpTicketDetailPanelProps {
  type: HelpTicketType;
  ticket: HelpTicket | null;
  formatDateTime: (value: string) => string;
  isUpdating?: boolean;
  onToggleStatus?: () => void;
  onCreate: () => void;
  workspaceName?: string;
  emptyDetailMessage?: string;
  hideWelcome?: boolean;
}

const WELCOME_ICONS = {
  support: LifeBuoy,
  feedback: MessageSquare,
} as const;

function MetadataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm text-card-foreground">{value}</p>
      </div>
    </div>
  );
}

const HelpTicketDetailPanel: React.FC<HelpTicketDetailPanelProps> = ({
  type,
  ticket,
  formatDateTime,
  isUpdating = false,
  onToggleStatus,
  onCreate,
  workspaceName,
  emptyDetailMessage,
  hideWelcome = false,
}) => {
  const copy = getHelpCopy(type);

  if (!ticket) {
    if (hideWelcome) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center p-4 md:p-6">
          <p className="text-sm text-muted-foreground">
            {emptyDetailMessage ?? 'Select a ticket from the inbox.'}
          </p>
        </div>
      );
    }

    const WelcomeIcon = WELCOME_ICONS[type];
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center p-4 md:p-6">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm md:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-primary/10 ring-1 ring-brand-primary/25">
            <WelcomeIcon className="h-7 w-7 text-brand-primary" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground">{copy.welcomeHeadline}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.welcomeSubtitle}</p>
          <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
            {copy.welcomeBullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="text-brand-primary" aria-hidden>
                  •
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <Button type="button" className="mt-6" onClick={onCreate}>
            {copy.welcomeCta}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {workspaceName ? (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {workspaceName} ·{' '}
                <ReferenceId tone="inherit" weight="medium">
                  {ticket.ticket_number}
                </ReferenceId>
              </p>
            ) : (
              <ReferenceId
                tone="muted"
                weight="medium"
                className="uppercase tracking-wide"
              >
                {ticket.ticket_number}
              </ReferenceId>
            )}
            <h2 className="mt-1 text-xl font-semibold">{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <HelpTicketStatusBadge status={ticket.status} size="toolbar" />
            {onToggleStatus ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={onToggleStatus}
              >
                {helpTicketStatusActionLabel(ticket.status, copy)}
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            'mb-5 grid gap-4 border-y border-border/60 py-4',
            'sm:grid-cols-2',
          )}
        >
          {ticket.creator_name ? (
            <MetadataItem icon={User} label="Filed by" value={ticket.creator_name} />
          ) : null}
          {ticket.category ? (
            <MetadataItem icon={Tag} label="Category" value={ticket.category} />
          ) : null}
          <MetadataItem icon={Calendar} label="Created" value={formatDateTime(ticket.created_at)} />
          {ticket.closed_at ? (
            <MetadataItem icon={Calendar} label="Closed" value={formatDateTime(ticket.closed_at)} />
          ) : null}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
          {ticket.description}
        </p>
      </section>

      <DiscussionThread entityType="support_ticket" entityId={ticket.id} />

      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Attachments
        </h3>
        <AttachmentPanel
          entityType="support_ticket"
          entityId={ticket.id}
          entityLabel={ticket.ticket_number}
        />
      </section>
    </div>
  );
};

export default HelpTicketDetailPanel;
