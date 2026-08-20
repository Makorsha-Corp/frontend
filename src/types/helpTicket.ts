export type HelpTicketStatus = 'open' | 'closed';

export interface HelpTicket {
  id: number;
  workspace_id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: string | null;
  status: HelpTicketStatus;
  created_by: number | null;
  creator_name?: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: number | null;
}

export interface PlatformHelpTicket extends HelpTicket {
  workspace_name: string;
}

export interface HelpTicketCreate {
  title: string;
  description: string;
  category?: string | null;
}

export interface HelpTicketUpdate {
  title?: string;
  description?: string;
  category?: string | null;
  status?: HelpTicketStatus;
}
