import type { HelpTicketStatus } from '@/types/helpTicket';

import type { HelpTypeCopy } from './helpCopy';

const NEXT_STATUS: Record<HelpTicketStatus, HelpTicketStatus> = {
  pending: 'opened',
  opened: 'closed',
  closed: 'opened',
};

const DISPLAY_LABEL: Record<HelpTicketStatus, string> = {
  pending: 'Pending',
  opened: 'Open',
  closed: 'Closed',
};

export function getNextHelpTicketStatus(current: HelpTicketStatus): HelpTicketStatus {
  return NEXT_STATUS[current];
}

export function getHelpTicketStatusDisplayLabel(status: HelpTicketStatus): string {
  return DISPLAY_LABEL[status];
}

export function getHelpTicketStatusActionLabel(
  current: HelpTicketStatus,
  copy: Pick<HelpTypeCopy, 'openLabel' | 'closeLabel' | 'reopenLabel'>,
): string {
  if (current === 'pending') return copy.openLabel;
  if (current === 'opened') return copy.closeLabel;
  return copy.reopenLabel;
}

export function helpTicketStatusRequiresConfirmation(current: HelpTicketStatus): boolean {
  return current === 'closed';
}

export function isHelpTicketClosed(status: HelpTicketStatus): boolean {
  return status === 'closed';
}

export function getHelpTicketStatusSuccessMessage(
  current: HelpTicketStatus,
  copy: Pick<HelpTypeCopy, 'statusOpenSuccess' | 'statusCloseSuccess' | 'statusReopenSuccess'>,
): string {
  if (current === 'pending') return copy.statusOpenSuccess;
  if (current === 'opened') return copy.statusCloseSuccess;
  return copy.statusReopenSuccess;
}
