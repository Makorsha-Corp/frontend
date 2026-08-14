/**
 * Client-side attachment allowlist mirror.
 * Authoritative enforcement: backend/app/utils/attachment_allowlist.py
 * Full pipeline & security: backend/docs/ATTACHMENT_UPLOAD_SECURITY.md
 * When changing types/limits, update both files + test_attachment_allowlist_sync.py.
 */
import type { Attachment } from '@/types/attachment';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Mirror backend settings.MAX_ATTACHMENTS_PER_ENTITY */
export const MAX_ATTACHMENTS_PER_ENTITY = 25;

interface AttachmentExtensionSpec {
  extensions: readonly string[];
  mimeTypes: readonly string[];
}

export const ATTACHMENT_EXTENSION_SPECS: readonly AttachmentExtensionSpec[] = [
  { extensions: ['jpg', 'jpeg'], mimeTypes: ['image/jpeg'] },
  { extensions: ['png'], mimeTypes: ['image/png'] },
  { extensions: ['webp'], mimeTypes: ['image/webp'] },
  { extensions: ['heic'], mimeTypes: ['image/heic'] },
  { extensions: ['heif'], mimeTypes: ['image/heif'] },
  { extensions: ['pdf'], mimeTypes: ['application/pdf'] },
  {
    extensions: ['docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  {
    extensions: ['xlsx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  { extensions: ['txt'], mimeTypes: ['text/plain'] },
  { extensions: ['csv'], mimeTypes: ['text/csv', 'text/plain'] },
] as const;

const EXTENSION_TO_MIMES = new Map<string, readonly string[]>();
for (const spec of ATTACHMENT_EXTENSION_SPECS) {
  for (const ext of spec.extensions) {
    EXTENSION_TO_MIMES.set(ext, spec.mimeTypes);
  }
}

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  ...new Set(ATTACHMENT_EXTENSION_SPECS.flatMap((spec) => spec.mimeTypes)),
] as const;

const ALLOWED_EXTENSIONS = ATTACHMENT_EXTENSION_SPECS.flatMap((spec) => spec.extensions);

export const ALLOWED_ATTACHMENT_ACCEPT = [
  ...ALLOWED_ATTACHMENT_MIME_TYPES,
  ...ALLOWED_EXTENSIONS.map((ext) => `.${ext}`),
].join(',');

export const RAW_ATTACHMENT_EXTENSIONS = new Set(['docx', 'xlsx', 'txt', 'csv']);

export function extractFileExtension(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return null;
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function inferMimeFromExtension(extension: string): string | null {
  const mimes = EXTENSION_TO_MIMES.get(extension.toLowerCase());
  return mimes?.[0] ?? null;
}

/** Canonical extension (no dot) for a signed MIME type, e.g. `image/jpeg` → `jpg`. */
export function extensionForMime(mimeType: string): string | null {
  for (const spec of ATTACHMENT_EXTENSION_SPECS) {
    if (spec.mimeTypes.includes(mimeType)) {
      return spec.extensions[0] ?? null;
    }
  }
  return null;
}

export function resolveAttachmentMime(file: File): string | null {
  const ext = extractFileExtension(file.name);
  if (!ext) return null;

  const allowedMimes = EXTENSION_TO_MIMES.get(ext);
  if (!allowedMimes) return null;

  if (file.type && allowedMimes.includes(file.type)) {
    return file.type;
  }

  if (ext === 'csv' && file.type === 'text/plain') {
    return 'text/plain';
  }

  if (!file.type) {
    return allowedMimes[0] ?? null;
  }

  return null;
}

/**
 * Normalize file + MIME for sign/upload. Handles empty `file.type` (Windows) and
 * mobile camera mismatch (e.g. `.jpg` name with `image/png` bytes/type).
 */
export function prepareAttachmentFileForUpload(
  file: File,
): { file: File; mimeType: string } | null {
  const resolved = resolveAttachmentMime(file);
  if (resolved) {
    return { file, mimeType: resolved };
  }

  if (!file.type) return null;

  for (const spec of ATTACHMENT_EXTENSION_SPECS) {
    if (!spec.mimeTypes.includes(file.type)) continue;
    const ext = spec.extensions[0];
    const dotIndex = file.name.lastIndexOf('.');
    const base = dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name;
    const fileName = `${base}.${ext}`;
    return {
      file: new File([file], fileName, { type: file.type }),
      mimeType: file.type,
    };
  }

  return null;
}

export function validateAttachmentFile(file: File): string | null {
  const prepared = prepareAttachmentFileForUpload(file);
  if (!prepared) {
    const ext = extractFileExtension(file.name);
    return ext
      ? `Unsupported type for .${ext}. Allowed: images, PDF, DOCX, XLSX, TXT, CSV.`
      : 'File name must include a supported extension.';
  }

  if (prepared.file.size > MAX_ATTACHMENT_BYTES) {
    return `File too large. Max ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB.`;
  }

  return null;
}

export function isRawAttachment(attachment: Attachment): boolean {
  const ext = extractFileExtension(attachment.file_name);
  return ext ? RAW_ATTACHMENT_EXTENSIONS.has(ext) : false;
}

export function isPreviewableAttachment(attachment: Attachment): boolean {
  if (isRawAttachment(attachment)) return false;
  return (
    attachment.mime_type.startsWith('image/') ||
    attachment.mime_type === 'application/pdf' ||
    attachment.format === 'pdf'
  );
}

export function attachmentTypeLabel(attachment: Attachment): string | null {
  const ext = extractFileExtension(attachment.file_name);
  if (!ext) return null;
  if (ext === 'pdf' || attachment.mime_type === 'application/pdf') return 'PDF';
  if (RAW_ATTACHMENT_EXTENSIONS.has(ext)) return ext.toUpperCase();
  if (attachment.mime_type.startsWith('image/')) return 'Image';
  return null;
}

export const ATTACHMENT_TYPE_HINT =
  'JPG, PNG, WebP, HEIC, PDF, DOCX, XLSX, TXT, CSV';
