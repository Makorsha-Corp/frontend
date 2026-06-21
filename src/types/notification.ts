export interface BackendNotificationActor {
  id: number;
  name: string;
}

export interface BackendNotification {
  id: number;
  workspace_id: number;
  notification_type: string;
  entity_type: string;
  entity_id: number;
  source_type: string;
  source_id: number;
  preview: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  actor: BackendNotificationActor | null;
}

export interface BackendNotificationListResponse {
  items: BackendNotification[];
  total: number;
  unread_count: number;
}

export interface MarkReadRequest {
  ids: number[] | null;
}
