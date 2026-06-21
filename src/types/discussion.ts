export type DiscussionEntityType =
  | 'purchase_order'
  | 'transfer_order'
  | 'expense_order'
  | 'work_order'
  | 'sales_order'
  | 'project'
  | 'project_component'
  | 'machine'
  | 'inventory'
  | 'item';

export interface DiscussionAuthor {
  id: number;
  name: string;
}

export interface Discussion {
  id: number;
  workspace_id: number;
  entity_type: string;
  entity_id: number;
  message: string;
  parent_id: number | null;
  created_at: string;
  author: DiscussionAuthor | null;
  replies: Discussion[];
}

export interface DiscussionListResponse {
  items: Discussion[];
  total: number;
}

export interface CreateDiscussion {
  entity_type: DiscussionEntityType;
  entity_id: number;
  message: string;
  parent_id?: number | null;
}
