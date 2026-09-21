import type { HelpTicketStatus, HelpTicketType } from '@/types/helpTicket';

export const STATUS_FILTER_ALL = 'all' as const;
export type HelpStatusFilter = HelpTicketStatus | typeof STATUS_FILTER_ALL;

export const HELP_CATEGORY_PRESETS: Record<HelpTicketType, readonly string[]> = {
  support: ['Bug', 'How-to', 'Billing', 'Access / permissions', 'Other'],
  feedback: ['Feature request', 'Improvement', 'UX / workflow', 'Other'],
};

export const HELP_CATEGORY_OTHER = 'Other';

export interface HelpTypeCopy {
  subtitle: string;
  listSectionTitle: string;
  newButtonLabel: string;
  newAriaLabel: string;
  searchPlaceholder: string;
  loadError: string;
  emptyHeadline: string;
  emptySubtitle: string;
  emptyCta: string;
  welcomeHeadline: string;
  welcomeSubtitle: string;
  welcomeBullets: readonly string[];
  welcomeCta: string;
  createDialogTitle: string;
  createSubmitLabel: string;
  createSuccessToast: string;
  createErrorToast: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  tipsTitle: string;
  tipsBullets: readonly string[];
  openLabel: string;
  closeLabel: string;
  reopenLabel: string;
  statusOpenSuccess: string;
  statusCloseSuccess: string;
  statusReopenSuccess: string;
  statusUpdateError: string;
}

export function nextHelpTicketStatus(status: HelpTicketStatus): HelpTicketStatus {
  if (status === 'pending') return 'opened';
  if (status === 'opened') return 'closed';
  return 'opened';
}

export function helpTicketStatusActionLabel(
  status: HelpTicketStatus,
  copy: HelpTypeCopy,
): string {
  if (status === 'pending') return copy.openLabel;
  if (status === 'opened') return copy.closeLabel;
  return copy.reopenLabel;
}

export function helpTicketStatusActionSuccess(
  copy: HelpTypeCopy,
  previousStatus: HelpTicketStatus,
  nextStatus: HelpTicketStatus,
): string {
  if (nextStatus === 'closed') return copy.statusCloseSuccess;
  if (previousStatus === 'closed') return copy.statusReopenSuccess;
  return copy.statusOpenSuccess;
}

const SUPPORT_COPY: HelpTypeCopy = {
  subtitle: 'Workspace support — bugs, how-to, billing, and more',
  listSectionTitle: 'Tickets',
  newButtonLabel: 'New ticket',
  newAriaLabel: 'Create new support ticket',
  searchPlaceholder: 'Search tickets…',
  loadError: 'Could not load tickets.',
  emptyHeadline: 'No support tickets yet',
  emptySubtitle: 'Create a ticket when you need help with bugs, access, billing, or how-to questions.',
  emptyCta: 'Create ticket',
  welcomeHeadline: 'Get help from Kolom',
  welcomeSubtitle: 'Our team replies in the discussion thread on each ticket.',
  welcomeBullets: [
    'Describe what you expected vs what happened',
    'Include steps to reproduce bugs',
    'Attach screenshots or files when helpful',
  ],
  welcomeCta: 'New support ticket',
  createDialogTitle: 'New support ticket',
  createSubmitLabel: 'Create ticket',
  createSuccessToast: 'Support ticket created.',
  createErrorToast: 'Could not create ticket.',
  titlePlaceholder: 'Brief summary of the issue',
  descriptionPlaceholder: 'Describe the issue or question in detail…',
  tipsTitle: 'Tips for faster support',
  tipsBullets: [
    'Include the page or workflow where the issue occurs',
    'Note any error messages you saw',
    'Screenshots and attachments help us diagnose quickly',
    'We typically reply within one business day',
  ],
  openLabel: 'Open',
  closeLabel: 'Close',
  reopenLabel: 'Reopen',
  statusOpenSuccess: 'Ticket opened.',
  statusCloseSuccess: 'Ticket closed.',
  statusReopenSuccess: 'Ticket reopened.',
  statusUpdateError: 'Could not update ticket status.',
};

const FEEDBACK_COPY: HelpTypeCopy = {
  subtitle: 'Share ideas, suggestions, and product feedback',
  listSectionTitle: 'Feedback',
  newButtonLabel: 'New feedback',
  newAriaLabel: 'Submit new feedback',
  searchPlaceholder: 'Search feedback…',
  loadError: 'Could not load feedback.',
  emptyHeadline: 'No feedback yet',
  emptySubtitle: 'Share ideas, pain points, and wishes — we read every submission.',
  emptyCta: 'Submit feedback',
  welcomeHeadline: 'Shape the product',
  welcomeSubtitle: 'Tell us what would make Kolom better for your mill.',
  welcomeBullets: [
    'Feature requests and workflow improvements',
    'Pain points in daily operations',
    'Ideas inspired by how your team works',
  ],
  welcomeCta: 'Submit feedback',
  createDialogTitle: 'Submit feedback',
  createSubmitLabel: 'Submit feedback',
  createSuccessToast: 'Feedback submitted.',
  createErrorToast: 'Could not submit feedback.',
  titlePlaceholder: 'Short title for your idea',
  descriptionPlaceholder: 'Describe your idea, suggestion, or pain point…',
  tipsTitle: 'What makes great feedback',
  tipsBullets: [
    'Explain the problem you are trying to solve',
    'Describe how you work around it today',
    'Note which module or page it relates to',
    'We use feedback to prioritize the roadmap',
  ],
  openLabel: 'Open',
  closeLabel: 'Close',
  reopenLabel: 'Reopen',
  statusOpenSuccess: 'Feedback opened.',
  statusCloseSuccess: 'Feedback closed.',
  statusReopenSuccess: 'Feedback reopened.',
  statusUpdateError: 'Could not update feedback status.',
};

export function getHelpCopy(type: HelpTicketType): HelpTypeCopy {
  return type === 'feedback' ? FEEDBACK_COPY : SUPPORT_COPY;
}

export function filterTicketsBySearch<
  T extends { title: string; ticket_number: string; category: string | null },
>(tickets: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return tickets;
  return tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(q) ||
      ticket.ticket_number.toLowerCase().includes(q) ||
      (ticket.category?.toLowerCase().includes(q) ?? false),
  );
}
