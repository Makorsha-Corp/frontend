import type {
  MobileUploadPublicConfirmRequest,
  MobileUploadPublicSession,
  MobileUploadPublicSignRequest,
  MobileUploadPublicSignResponse,
} from '@/types/mobileUpload';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { prepareAttachmentFileForUpload } from '@/lib/attachmentAllowlist';
import type { AttachmentSignResponse } from '@/types/attachment';

function apiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL ?? '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

async function parseError(response: Response, fallback: string): Promise<never> {
  let detail = fallback;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) detail = body.detail;
  } catch {
    /* ignore */
  }
  throw new Error(detail);
}

export async function getPublicMobileUploadSession(token: string): Promise<MobileUploadPublicSession> {
  const response = await fetch(
    `${apiBaseUrl()}/mobile-upload/public?token=${encodeURIComponent(token)}`,
  );
  if (!response.ok) {
    await parseError(response, 'Upload link is invalid or expired.');
  }
  return response.json() as Promise<MobileUploadPublicSession>;
}

export async function signPublicMobileUpload(
  payload: MobileUploadPublicSignRequest,
): Promise<MobileUploadPublicSignResponse> {
  const response = await fetch(`${apiBaseUrl()}/mobile-upload/public/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, 'Could not prepare upload.');
  }
  return response.json() as Promise<MobileUploadPublicSignResponse>;
}

export async function confirmPublicMobileUpload(
  payload: MobileUploadPublicConfirmRequest,
): Promise<MobileUploadPublicSession> {
  const response = await fetch(`${apiBaseUrl()}/mobile-upload/public/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, 'Could not confirm upload.');
  }
  return response.json() as Promise<MobileUploadPublicSession>;
}

export async function uploadPublicMobileFile(
  token: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const prepared = prepareAttachmentFileForUpload(file);
  if (!prepared) {
    throw new Error('Unsupported file type.');
  }

  const { file: uploadFile, mimeType } = prepared;

  const sign = await signPublicMobileUpload({
    token,
    file_name: uploadFile.name,
    mime_type: mimeType,
    file_size: uploadFile.size,
  });

  const cloudinarySign: AttachmentSignResponse = {
    attachment_id: 0,
    cloud_name: sign.cloud_name,
    api_key: sign.api_key,
    timestamp: sign.timestamp,
    public_id: sign.public_id,
    asset_folder: sign.asset_folder,
    display_name: sign.display_name,
    type: sign.type,
    signature: sign.signature,
    resource_type: sign.resource_type,
    upload_url: sign.upload_url,
  };

  await uploadToCloudinary(uploadFile, cloudinarySign, (progress) => {
    onProgress?.(progress.percent);
  });
  await confirmPublicMobileUpload({ token });
}
