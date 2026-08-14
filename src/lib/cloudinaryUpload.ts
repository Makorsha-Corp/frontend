import type { AttachmentSignResponse, CloudinaryUploadResult } from '@/types/attachment';

export interface CloudinaryUploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * POST file directly to Cloudinary (cross-origin). Intentionally outside RTK
 * so the Bearer token is never sent to api.cloudinary.com.
 */
export function uploadToCloudinary(
  file: File,
  sign: AttachmentSignResponse,
  onProgress?: (progress: CloudinaryUploadProgress) => void,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sign.api_key);
    formData.append('timestamp', String(sign.timestamp));
    formData.append('signature', sign.signature);
    formData.append('public_id', sign.public_id);
    formData.append('asset_folder', sign.asset_folder);
    formData.append('display_name', sign.display_name);
    formData.append('type', sign.type);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', sign.upload_url);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      });
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Cloudinary upload failed (${xhr.status}): ${xhr.responseText}`));
        return;
      }
      try {
        const parsed = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
        resolve(parsed);
      } catch {
        reject(new Error('Cloudinary returned invalid JSON.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload.'));
    xhr.onabort = () => reject(new Error('Cloudinary upload aborted.'));
    xhr.send(formData);
  });
}
