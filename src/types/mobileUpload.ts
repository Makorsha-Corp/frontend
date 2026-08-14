import type { AttachmentEntityType } from '@/types/attachment';

export type MobileUploadSessionStatus =
  | 'waiting'
  | 'uploaded'
  | 'consumed'
  | 'cancelled'
  | 'expired';

export interface MobileUploadSessionCreateRequest {
  entity_type: AttachmentEntityType;
  entity_id: number;
  entity_label?: string | null;
}

export interface MobileUploadSessionCreateResponse {
  session_id: number;
  token: string;
  expires_at: string;
  entity_label?: string | null;
}

export interface MobileUploadSession {
  id: number;
  status: MobileUploadSessionStatus;
  entity_type: AttachmentEntityType;
  entity_id: number;
  entity_label?: string | null;
  expires_at: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  preview_url?: string | null;
}

export interface MobileUploadPromoteRequest {
  file_name?: string | null;
  note?: string | null;
}

export interface MobileUploadPublicSession {
  status: MobileUploadSessionStatus;
  entity_label?: string | null;
  expires_at: string;
}

export interface MobileUploadPublicSignRequest {
  token: string;
  file_name: string;
  mime_type: string;
  file_size: number;
}

export interface MobileUploadPublicSignResponse {
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

export interface MobileUploadPublicConfirmRequest {
  token: string;
}
