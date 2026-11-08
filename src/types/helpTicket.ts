export type HelpTicketStatus = 'pending' | 'opened' | 'closed';
export type HelpTicketType = 'support' | 'feedback';

export interface HelpTicket {
  id: number;
  workspace_id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: string | null;
  status: HelpTicketStatus;
  type: HelpTicketType;
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
  type?: HelpTicketType;
}

export interface HelpTicketUpdate {
  title?: string;
  description?: string;
  category?: string | null;
  status?: HelpTicketStatus;
}

export interface HelpTicketEvent {
  id: number;
  workspace_id: number;
  help_ticket_id: number;
  event_type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  performed_by: number | null;
  user_name?: string | null;
  created_at: string;
}
