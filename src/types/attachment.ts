export type AttachmentEntityType =
  | 'purchase_order'
  | 'sales_order'
  | 'expense_order'
  | 'transfer_order'
  | 'work_order'
  | 'project'
  | 'project_component'
  | 'item'
  | 'machine'
  | 'account_invoice'
  | 'support_ticket'
  | 'scratch';

export type UploadStatus = 'pending' | 'ready' | 'failed';

export interface AttachmentDerivedUrls {
  thumb_url: string | null;
  preview_url: string | null;
  download_url: string | null;
}

export interface AttachmentLinkInfo {
  entity_type: AttachmentEntityType;
  entity_id: number;
}

export interface Attachment {
  id: number;
  file_name: string;
  mime_type: string;
  file_size: number;
  note: string | null;
  uploaded_by: number;
  uploaded_at: string;
  upload_status: UploadStatus;
  public_id: string | null;
  format: string | null;
  version: number | null;
  width: number | null;
  height: number | null;
  page_count: number | null;
  file_url: string | null;
  links: AttachmentLinkInfo[];
  urls: AttachmentDerivedUrls;
}

export interface AttachmentListResponse {
  items: Attachment[];
  slot_count: number;
  max_per_entity: number;
}

export interface AttachmentSignRequest {
  entity_type: AttachmentEntityType;
  entity_id: number;
  file_name: string;
  mime_type: string;
  file_size: number;
  note?: string | null;
}

export interface AttachmentSignResponse {
  attachment_id: number;
  cloud_name: string;
  api_key: string;
  timestamp: number;
  public_id: string;
  asset_folder: string;
  display_name: string;
  type: string;
  signature: string;
  resource_type: string;
  upload_url: string;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  version: number;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resource_type: string;
}

export const ATTACHMENT_ENTITY_TYPE_LABELS: Record<AttachmentEntityType, string> = {
  purchase_order: 'Purchase order',
  sales_order: 'Sales order',
  expense_order: 'Expense order',
  transfer_order: 'Transfer order',
  work_order: 'Work order',
  project: 'Project',
  project_component: 'Project component',
  item: 'Item',
  machine: 'Machine',
  account_invoice: 'Account invoice',
  support_ticket: 'Help ticket',
  scratch: 'Scratch (playground)',
};

export interface AttachmentPdfPageResponse {
  url: string;
  page: number;
  page_count: number | null;
}

export interface MarkupPoint {
  x: number;
  y: number;
}

export interface MarkupStroke {
  color: string;
  width: number;
  points: MarkupPoint[];
}

export interface MarkupText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export interface PageMarks {
  strokes: MarkupStroke[];
  texts: MarkupText[];
  scribbles: MarkupStroke[];
}

export interface MarkupPayload {
  pages: Record<string, PageMarks>;
}

export interface AttachmentMarkupLayer {
  user_id: number;
  user_name: string;
  is_mine: boolean;
  updated_at: string;
  payload: MarkupPayload;
}

export interface AttachmentMarkupListResponse {
  items: AttachmentMarkupLayer[];
}

export interface AttachmentMarkupPutRequest {
  payload: MarkupPayload;
}

export {
  ALLOWED_ATTACHMENT_ACCEPT,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_TYPE_HINT,
  MAX_ATTACHMENT_BYTES,
} from '@/lib/attachmentAllowlist';
