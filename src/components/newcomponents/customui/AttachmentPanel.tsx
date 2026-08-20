/**
 * Single upload UI for all attachable entities (orders, invoices, help tickets, etc.).
 * Validation via attachmentAllowlist.ts; sign/confirm via attachmentsApi.
 * See backend/docs/ATTACHMENT_UPLOAD_SECURITY.md — entity_type only affects linking/folders.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appToast } from '@/lib/appToast';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  MoreVertical,
  Smartphone,
  Trash2,
  Upload,
  ZoomIn,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import PendingAttachmentUploadDialog from '@/components/newcomponents/customui/scan/PendingAttachmentUploadDialog';
import AttachmentPdfPageViewer from '@/components/newcomponents/customui/AttachmentPdfPageViewer';
import AttachmentMarkupStage, {
  isMarkupableAttachment,
} from '@/components/newcomponents/customui/attachmentMarkup/AttachmentMarkupStage';
import MobileUploadQrDialog from '@/components/newcomponents/customui/MobileUploadQrDialog';
import {
  useConfirmAttachmentUploadMutation,
  useDeleteAttachmentMutation,
  useListAttachmentsQuery,
  useSignAttachmentUploadMutation,
} from '@/features/attachments/attachmentsApi';
import type { Attachment, AttachmentEntityType } from '@/types/attachment';
import {
  ALLOWED_ATTACHMENT_ACCEPT,
  ATTACHMENT_TYPE_HINT,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_ENTITY,
  attachmentTypeLabel,
  extensionForMime,
  isPreviewableAttachment,
  prepareAttachmentFileForUpload,
  validateAttachmentFile,
} from '@/lib/attachmentAllowlist';
import { formatTimeFromApi } from '@/utils/datetime';

function useIsMdScreen(): boolean {
  const [isMd, setIsMd] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMd;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(attachment: Attachment): boolean {
  return attachment.mime_type === 'application/pdf' || attachment.format === 'pdf';
}

/** Combined compact card — fills collaboration column; hero preview + Add panel. */
const COMPACT_CARD_CLASS =
  'flex h-full min-h-[11.05rem] w-full min-w-0 overflow-hidden rounded-lg border border-border bg-muted/10';
const COMPACT_ADD_PANEL_CLASS = 'w-[5.75rem] shrink-0';
const COMPACT_PREVIEW_WRAPPER_CLASS = 'flex h-full min-h-0 w-full flex-col gap-1 p-2';
const COMPACT_PREVIEW_CELL_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border/70 bg-card/50 shadow-sm';
const COMPACT_CAPTION_CLASS =
  'flex shrink-0 min-h-[1.375rem] items-center gap-2 border-t border-border/40 bg-muted/20 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground';
const COMPACT_HERO_FRAME_CLASS =
  'relative aspect-video h-full max-h-full w-full min-w-0 overflow-hidden';
const COMPACT_HERO_IMAGE_CLASS = 'absolute inset-0 h-full w-full object-cover';
const COMPACT_CAROUSEL_NAV_PILL_CLASS = cn(
  'flex h-7 w-7 items-center justify-center rounded-full shadow-sm backdrop-blur-sm',
  'bg-background/90 text-muted-foreground ring-1 ring-border/60 transition-colors',
  'group-hover:bg-brand-primary/10 group-hover:text-brand-primary group-hover:ring-brand-primary/25',
  'group-disabled:opacity-35',
);

function attachmentPreviewUrl(attachment: Attachment): string | null {
  return attachment.urls.preview_url ?? attachment.urls.thumb_url ?? attachment.file_url;
}

function fileExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.slice(dotIndex) : '';
}

function normalizeUploadFileName(rawName: string, originalFile: File): string | null {
  const trimmed = rawName.trim();
  if (!trimmed || trimmed.length > 255) return null;

  const prepared = prepareAttachmentFileForUpload(originalFile);
  if (!prepared) return null;

  const canonicalExt = extensionForMime(prepared.mimeType);
  const fallbackExt = fileExtension(prepared.file.name).replace(/^\./, '');

  let base = trimmed;
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex > 0) {
    base = trimmed.slice(0, dotIndex);
  }

  const ext = canonicalExt ?? fallbackExt;
  if (!ext) return trimmed;

  return `${base}.${ext}`;
}

export interface AttachmentPanelProps {
  entityType: AttachmentEntityType;
  entityId: number;
  /** When false, list query is skipped (lazy load). */
  enabled?: boolean;
  /** Hide upload/delete; keep preview and download. */
  readOnly?: boolean;
  /** Carousel + compact drop zone (order detail column). */
  compact?: boolean;
  /** Dialog manager: list + split preview. */
  layout?: 'default' | 'manager';
  /** Optional label shown on the phone upload page (e.g. PO number). */
  entityLabel?: string;
  className?: string;
}

export default function AttachmentPanel({
  entityType,
  entityId,
  enabled = true,
  readOnly = false,
  compact = false,
  layout = 'default',
  entityLabel,
  className,
}: AttachmentPanelProps) {
  const isManagerLayout = !compact && layout === 'manager';
  const isMdScreen = useIsMdScreen();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewPortalEl, setPreviewPortalEl] = useState<HTMLElement | null>(null);
  const [markMode, setMarkMode] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadName, setPendingUploadName] = useState('');
  const [pendingUploadNote, setPendingUploadNote] = useState('');
  const [mobileQrOpen, setMobileQrOpen] = useState(false);

  const canQuery = enabled && entityId > 0;

  const { data: attachmentList, isLoading, isFetching } = useListAttachmentsQuery(
    { entity_type: entityType, entity_id: entityId },
    { skip: !canQuery },
  );

  const attachments = attachmentList?.items ?? [];
  const slotCount = attachmentList?.slot_count ?? attachments.length;
  const maxPerEntity = attachmentList?.max_per_entity ?? MAX_ATTACHMENTS_PER_ENTITY;
  const atCapacity = slotCount >= maxPerEntity;
  const uploadsDisabled = readOnly || atCapacity;

  const [signUpload] = useSignAttachmentUploadMutation();
  const [confirmUpload] = useConfirmAttachmentUploadMutation();
  const [deleteAttachment, { isLoading: isDeleting }] = useDeleteAttachmentMutation();

  const sortedAttachments = useMemo(
    () =>
      [...attachments].sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime(),
      ),
    [attachments],
  );

  useEffect(() => {
    if (!isManagerLayout) return;
    if (sortedAttachments.length === 0) {
      setSelectedAttachmentId(null);
      return;
    }
    setSelectedAttachmentId((prev) => {
      if (prev != null && sortedAttachments.some((item) => item.id === prev)) return prev;
      return sortedAttachments[0]?.id ?? null;
    });
  }, [isManagerLayout, sortedAttachments]);

  useEffect(() => {
    if (attachments.length === 0) {
      setCarouselIndex(0);
      return;
    }
    setCarouselIndex((prev) => Math.min(prev, attachments.length - 1));
  }, [attachments.length]);

  const jumpToLastAfterUploadRef = useRef(false);

  useEffect(() => {
    if (!jumpToLastAfterUploadRef.current || attachments.length === 0) return;
    jumpToLastAfterUploadRef.current = false;
    if (isManagerLayout) {
      const newest = sortedAttachments[0];
      if (newest) setSelectedAttachmentId(newest.id);
      return;
    }
    setCarouselIndex(attachments.length - 1);
  }, [attachments, isManagerLayout, sortedAttachments]);

  const handleUpload = useCallback(
    async (file: File, fileName: string, note: string | null = null) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const prepared = prepareAttachmentFileForUpload(file);
        if (!prepared) {
          appToast.error('Unsupported file type.');
          return;
        }

        const { file: uploadFile, mimeType } = prepared;
        const signFileName = normalizeUploadFileName(fileName, uploadFile) ?? uploadFile.name;

        const sign = await signUpload({
          entity_type: entityType,
          entity_id: entityId,
          file_name: signFileName,
          mime_type: mimeType,
          file_size: uploadFile.size,
          note,
        }).unwrap();

        await uploadToCloudinary(uploadFile, sign, (progress) => {
          setUploadProgress(progress.percent);
        });

        await confirmUpload(sign.attachment_id).unwrap();
        appToast.success(`${signFileName} uploaded`);
        jumpToLastAfterUploadRef.current = true;
      } catch (err) {
        const apiDetail =
          err && typeof err === 'object' && 'data' in err
            ? (err as { data?: { detail?: string } }).data?.detail
            : undefined;
        const message =
          apiDetail ??
          (err instanceof Error ? err.message : null) ??
          'Upload failed';
        appToast.error(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [confirmUpload, entityId, entityType, signUpload],
  );

  const queueFileForUpload = useCallback((file: File) => {
    const validationError = validateAttachmentFile(file);
    if (validationError) {
      appToast.error(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const prepared = prepareAttachmentFileForUpload(file);
    if (!prepared) {
      appToast.error('Unsupported file type.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPendingUploadFile(prepared.file);
    setPendingUploadName(prepared.file.name);
    setPendingUploadNote('');
  }, []);

  const cancelPendingUpload = () => {
    setPendingUploadFile(null);
    setPendingUploadName('');
    setPendingUploadNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmPendingUpload = async (
    file: File,
    requestedName: string,
    note: string | null,
  ) => {
    const fileName = normalizeUploadFileName(requestedName, file);
    if (!fileName) {
      appToast.error('Enter a file name (max 255 characters).');
      return;
    }

    setPendingUploadFile(null);
    setPendingUploadName('');
    setPendingUploadNote('');
    await handleUpload(file, fileName, note);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) queueFileForUpload(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (uploadsDisabled || isUploading || pendingUploadFile) return;
    const file = event.dataTransfer.files?.[0];
    if (file) queueFileForUpload(file);
  };

  const uploadBlocked = isUploading || !!pendingUploadFile || mobileQrOpen || uploadsDisabled;

  const capacityHint =
    atCapacity && !readOnly
      ? `${slotCount}/${maxPerEntity} attachments — delete one to add more`
      : null;

  const onDelete = async (attachment: Attachment) => {
    const deletedIndex = attachments.findIndex((item) => item.id === attachment.id);

    try {
      await deleteAttachment(attachment.id).unwrap();
      appToast.success('Attachment deleted');
      if (previewAttachment?.id === attachment.id) setPreviewAttachment(null);

      if (isManagerLayout && selectedAttachmentId === attachment.id) {
        const remaining = sortedAttachments.filter((item) => item.id !== attachment.id);
        setSelectedAttachmentId(remaining[0]?.id ?? null);
      }

      if (deletedIndex >= 0) {
        setCarouselIndex((prev) => {
          if (deletedIndex < prev) return prev - 1;
          if (deletedIndex === prev) return Math.max(0, prev - 1);
          return prev;
        });
      }
    } catch {
      appToast.error('Failed to delete attachment');
    }
  };

  const onManagerRowClick = (attachment: Attachment) => {
    setSelectedAttachmentId(attachment.id);
    if (!isMdScreen) setPreviewAttachment(attachment);
  };

  const previewUrl =
    previewAttachment?.urls.preview_url ??
    previewAttachment?.urls.thumb_url ??
    previewAttachment?.file_url;

  const attachmentCount = attachments.length;
  const safeCarouselIndex = Math.min(carouselIndex, Math.max(0, attachmentCount - 1));
  const activeAttachment = attachments[safeCarouselIndex] ?? null;
  const showCompactCarousel = attachmentCount > 1;
  const canGoPrev = safeCarouselIndex > 0;
  const canGoNext = safeCarouselIndex < attachmentCount - 1;

  const goPrevCarousel = () => {
    if (!canGoPrev) return;
    setCarouselIndex((index) => Math.max(0, index - 1));
  };

  const goNextCarousel = () => {
    if (!canGoNext) return;
    setCarouselIndex((index) => Math.min(attachmentCount - 1, index + 1));
  };

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      accept={ALLOWED_ATTACHMENT_ACCEPT}
      onChange={onFileChange}
      disabled={uploadBlocked || !canQuery}
    />
  );

  const renderCompactAddPanel = () => (
    <div
      className={cn(
        'flex min-h-0 flex-col border-l border-dashed border-border bg-muted/20',
        COMPACT_ADD_PANEL_CLASS,
        uploadBlocked && 'opacity-70',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !uploadBlocked && fileInputRef.current?.click()}
        className={cn(
          'flex min-h-0 flex-[2] cursor-pointer flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors hover:bg-muted/40',
          uploadBlocked && 'pointer-events-none',
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-primary" />
            <p className="text-[10px] font-medium leading-tight">Uploading</p>
            <p className="text-[9px] text-muted-foreground">
              {uploadProgress != null ? `${uploadProgress}%` : ''}
            </p>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
            <p className="text-[10px] font-medium leading-tight">Add file</p>
            <p className="text-[9px] leading-tight text-muted-foreground">or drop here</p>
          </>
        )}
      </div>
      <button
        type="button"
        disabled={uploadBlocked || !canQuery}
        onClick={(event) => {
          event.stopPropagation();
          if (uploadBlocked) return;
          setMobileQrOpen(true);
        }}
        className={cn(
          'hidden min-h-0 flex-1 flex-col items-center justify-center gap-0.5 border-t border-dashed border-border px-1 text-center transition-colors hover:bg-muted/40 md:flex',
          uploadBlocked && 'pointer-events-none',
        )}
      >
        <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-[10px] font-medium leading-tight">Phone</p>
      </button>
    </div>
  );

  const renderCompactCardShell = (
    left: React.ReactNode,
    options?: { showAdd?: boolean; leftClassName?: string },
  ) => {
    const showAdd = options?.showAdd ?? !uploadsDisabled;
    return (
      <div className={COMPACT_CARD_CLASS}>
        <div
          className={cn(
            'flex h-full min-w-0 flex-1 flex-col',
            options?.leftClassName,
          )}
        >
          {left}
        </div>
        {showAdd ? renderCompactAddPanel() : null}
      </div>
    );
  };

  const renderCompactEmptyLeft = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 text-center">
      <FileText className="h-5 w-5 text-muted-foreground/50" />
      <p className="text-[10px] font-medium text-muted-foreground">No attachments</p>
    </div>
  );

  const renderCompactHeroMenu = (attachment: Attachment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-1 top-1 z-20 h-7 w-7 rounded-md bg-background/90 shadow-sm backdrop-blur-sm"
          aria-label="Attachment actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setPreviewAttachment(attachment)}>
          <ZoomIn className="mr-2 h-4 w-4" />
          Expand
        </DropdownMenuItem>
        {attachment.urls.download_url ? (
          <DropdownMenuItem asChild>
            <a href={attachment.urls.download_url} download={attachment.file_name}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </DropdownMenuItem>
        ) : null}
        {!readOnly ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
            onClick={() => void onDelete(attachment)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderCompactHeroPreview = (attachment: Attachment) => {
    const thumb = attachmentPreviewUrl(attachment);

    return (
      <div className={COMPACT_PREVIEW_CELL_CLASS}>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/30">
          <div className={COMPACT_HERO_FRAME_CLASS}>
            <button
              type="button"
              className="absolute inset-0 z-0 overflow-hidden"
              onClick={() => setPreviewAttachment(attachment)}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={attachment.file_name}
                  className={COMPACT_HERO_IMAGE_CLASS}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted/30 p-2 text-muted-foreground">
                  <FileText className="h-6 w-6" />
                  {attachmentTypeLabel(attachment) ? (
                    <span className="text-[9px] font-medium">{attachmentTypeLabel(attachment)}</span>
                  ) : null}
                </div>
              )}
            </button>
            {showCompactCarousel ? (
              <>
                <button
                  type="button"
                  disabled={!canGoPrev}
                  className={cn(
                    'group absolute left-1.5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 touch-manipulation',
                    'items-center justify-center rounded-full border-0 bg-transparent p-0',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:pointer-events-none',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrevCarousel();
                  }}
                  aria-label="Previous attachment"
                >
                  <span className={COMPACT_CAROUSEL_NAV_PILL_CLASS}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!canGoNext}
                  className={cn(
                    'group absolute right-1.5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 touch-manipulation',
                    'items-center justify-center rounded-full border-0 bg-transparent p-0',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:pointer-events-none',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    goNextCarousel();
                  }}
                  aria-label="Next attachment"
                >
                  <span className={COMPACT_CAROUSEL_NAV_PILL_CLASS}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </>
            ) : null}
            {renderCompactHeroMenu(attachment)}
          </div>
        </div>
        <div className={COMPACT_CAPTION_CLASS}>
          <div className="min-w-0 flex-1">
            <p className="truncate" title={attachment.file_name}>
              {attachment.file_name}
            </p>
            {attachment.note ? (
              <p className="truncate text-[9px] text-muted-foreground/80" title={attachment.note}>
                {attachment.note}
              </p>
            ) : null}
          </div>
          {showCompactCarousel ? (
            <span
              className="shrink-0 tabular-nums text-muted-foreground/80"
              aria-live="polite"
            >
              {safeCarouselIndex + 1} / {attachmentCount}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const renderCompactCarouselDots = () => {
    if (!showCompactCarousel || attachmentCount > 5) return null;

    return (
      <div
        className="flex shrink-0 items-center justify-center gap-1.5 pb-0.5 pt-0.5"
        role="tablist"
        aria-label="Attachment pages"
      >
        {Array.from({ length: attachmentCount }, (_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === safeCarouselIndex}
            aria-label={`Attachment ${index + 1} of ${attachmentCount}`}
            onClick={() => setCarouselIndex(index)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === safeCarouselIndex
                ? 'w-3.5 bg-brand-primary'
                : 'w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/55',
            )}
          />
        ))}
      </div>
    );
  };

  const renderCompactHeroCarousel = () => {
    if (!activeAttachment) return null;

    return (
      <div className={COMPACT_PREVIEW_WRAPPER_CLASS}>
        {renderCompactHeroPreview(activeAttachment)}
        {renderCompactCarouselDots()}
      </div>
    );
  };

  const renderCompactBody = () => {
    if (!canQuery) {
      return (
        <div
          className={cn(
            COMPACT_CARD_CLASS,
            'items-center justify-center border-dashed bg-muted/20 px-3 text-center text-xs text-muted-foreground',
          )}
        >
          Enter a valid entity ID
        </div>
      );
    }

    if (isLoading || isFetching) {
      return (
        <div className={COMPACT_CARD_CLASS}>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        </div>
      );
    }

    if (attachments.length === 0) {
      if (uploadsDisabled) {
        return (
          <div
            className={cn(
              COMPACT_CARD_CLASS,
              'flex-col items-center justify-center gap-1.5 border-dashed bg-muted/20 px-3 text-center',
            )}
          >
            <FileText className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-[11px] font-medium text-muted-foreground">No attachments</p>
          </div>
        );
      }

      return renderCompactCardShell(renderCompactEmptyLeft());
    }

    return renderCompactCardShell(renderCompactHeroCarousel(), {
      showAdd: !uploadsDisabled,
    });
  };

  const selectedAttachment =
    sortedAttachments.find((item) => item.id === selectedAttachmentId) ?? null;

  const renderManagerToolbar = () => (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-3">
      <div className="flex min-w-0 items-center gap-2">
        {!uploadsDisabled ? (
          <>
            {hiddenFileInput}
            <Button
              type="button"
              size="sm"
              disabled={uploadBlocked || !canQuery}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Add file
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploadBlocked || !canQuery}
              onClick={() => setMobileQrOpen(true)}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              From phone
            </Button>
            {isUploading && uploadProgress != null ? (
              <span className="text-xs tabular-nums text-muted-foreground">{uploadProgress}%</span>
            ) : null}
          </>
        ) : null}
      </div>
      {!uploadsDisabled ? (
        <p className="hidden text-xs text-muted-foreground sm:block">
          {capacityHint ??
            `or drop anywhere · ${ATTACHMENT_TYPE_HINT} · max ${formatBytes(MAX_ATTACHMENT_BYTES)}`}
        </p>
      ) : capacityHint ? (
        <p className="hidden text-xs text-muted-foreground sm:block">{capacityHint}</p>
      ) : null}
    </div>
  );

  const renderManagerRow = (attachment: Attachment) => {
    const thumb = attachment.urls.thumb_url ?? attachment.urls.preview_url;
    const isSelected = attachment.id === selectedAttachmentId;

    return (
      <button
        key={attachment.id}
        type="button"
        onClick={() => onManagerRowClick(attachment)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50',
          isSelected && 'bg-muted/60 ring-1 ring-border',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/30">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={attachment.file_name}>
            {attachment.file_name}
          </p>
          {attachment.note ? (
            <p className="truncate text-xs text-muted-foreground" title={attachment.note}>
              {attachment.note}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            {formatBytes(attachment.file_size)}
            {attachmentTypeLabel(attachment) ? ` · ${attachmentTypeLabel(attachment)}` : ''}
            {' · '}
            {formatTimeFromApi(attachment.uploaded_at)}
          </p>
        </div>
      </button>
    );
  };

  const renderManagerPreviewPane = (attachment: Attachment | null) => {
    if (!attachment) {
      return (
        <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 px-4 text-center text-sm text-muted-foreground">
          Select a file to preview
        </div>
      );
    }

    const preview = attachmentPreviewUrl(attachment);
    const previewable = isPreviewableAttachment(attachment);
    const typeLabel = attachmentTypeLabel(attachment);
    const pdf = isPdf(attachment);

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
          {pdf ? (
            <AttachmentPdfPageViewer
              attachment={attachment}
              imageClassName="max-h-full"
            />
          ) : previewable && preview ? (
            <button
              type="button"
              className="group relative block h-full w-full cursor-zoom-in overflow-hidden"
              onClick={() => setPreviewAttachment(attachment)}
              aria-label={`Enlarge ${attachment.file_name}`}
            >
              <img
                src={preview}
                alt={attachment.file_name}
                className="mx-auto h-full max-h-full w-full object-contain"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                <ZoomIn className="h-7 w-7 text-white drop-shadow" />
              </span>
            </button>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-muted-foreground">
              <FileText className="h-10 w-10" />
              <span className="text-sm text-center">{attachment.file_name}</span>
              {typeLabel ? <span className="text-xs font-medium uppercase">{typeLabel}</span> : null}
              {attachment.urls.download_url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={attachment.urls.download_url} download={attachment.file_name}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>
        <div className="shrink-0 space-y-2 border-t border-border p-3">
          <div>
            <p className="truncate text-sm font-medium" title={attachment.file_name}>
              {attachment.file_name}
            </p>
            {attachment.note ? (
              <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                {attachment.note}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatBytes(attachment.file_size)}
              {typeLabel ? ` · ${typeLabel}` : ''}
              {' · '}
              {formatTimeFromApi(attachment.uploaded_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {previewable && preview && !pdf ? (
              <Button variant="outline" size="sm" onClick={() => setPreviewAttachment(attachment)}>
                <ZoomIn className="mr-2 h-4 w-4" />
                Enlarge
              </Button>
            ) : null}
            {pdf ? (
              <Button variant="outline" size="sm" onClick={() => setPreviewAttachment(attachment)}>
                <ZoomIn className="mr-2 h-4 w-4" />
                Enlarge
              </Button>
            ) : null}
            {attachment.urls.download_url ? (
              <Button variant="outline" size="sm" asChild>
                <a href={attachment.urls.download_url} download={attachment.file_name}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            ) : null}
            {!readOnly ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => void onDelete(attachment)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderManagerBody = () => {
    if (!canQuery) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Enter a valid entity ID to load attachments.
        </p>
      );
    }

    if (isLoading || isFetching) {
      return (
        <div className="flex flex-1 items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading attachments…
        </div>
      );
    }

    if (sortedAttachments.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {readOnly ? 'No attachments for this order.' : 'No attachments yet.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="space-y-1">{sortedAttachments.map(renderManagerRow)}</div>
        </div>
        <div className="hidden min-h-0 md:flex md:flex-col">{renderManagerPreviewPane(selectedAttachment)}</div>
      </div>
    );
  };

  const renderManagerLayout = () => (
    <div
      className={cn('flex h-full min-h-0 flex-col gap-3', className)}
      onDragOver={(event) => {
        if (uploadsDisabled) return;
        event.preventDefault();
      }}
      onDrop={onDrop}
    >
      <div className="flex min-h-0 flex-1 flex-col">{renderManagerBody()}</div>
      {!uploadsDisabled ? renderManagerToolbar() : null}
    </div>
  );

  const renameUploadDialog = (
    <PendingAttachmentUploadDialog
      file={pendingUploadFile}
      fileName={pendingUploadName}
      onFileNameChange={setPendingUploadName}
      description={pendingUploadNote}
      onDescriptionChange={setPendingUploadNote}
      open={!!pendingUploadFile}
      onOpenChange={(open) => {
        if (!open && !isUploading) cancelPendingUpload();
      }}
      onCancel={cancelPendingUpload}
      onConfirm={confirmPendingUpload}
      isUploading={isUploading}
    />
  );

  const mobileUploadQrDialog = (
    <MobileUploadQrDialog
      open={mobileQrOpen}
      onOpenChange={setMobileQrOpen}
      entityType={entityType}
      entityId={entityId}
      entityLabel={entityLabel}
      onAttached={() => {
        jumpToLastAfterUploadRef.current = true;
      }}
    />
  );

  const previewDialog = (
    <Dialog
      open={!!previewAttachment}
      onOpenChange={(open) => {
        if (!open) {
          setPreviewAttachment(null);
          setMarkMode(false);
        }
      }}
    >
      <DialogContent
        ref={setPreviewPortalEl}
        className="flex max-h-[90vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden"
      >
        <DialogHeader className="shrink-0 space-y-0">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0 flex-1 space-y-1.5 text-left">
              <DialogTitle className="truncate">{previewAttachment?.file_name}</DialogTitle>
              {previewAttachment?.note ? (
                <DialogDescription className="whitespace-pre-wrap">
                  {previewAttachment.note}
                </DialogDescription>
              ) : null}
            </div>
            {previewAttachment?.urls.download_url ? (
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <a
                  href={previewAttachment.urls.download_url}
                  download={previewAttachment.file_name}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {previewAttachment ? (
            isMarkupableAttachment(previewAttachment) ? (
              <AttachmentMarkupStage
                attachment={previewAttachment}
                isPdf={isPdf(previewAttachment)}
                previewUrl={previewUrl}
                markMode={markMode}
                onMarkModeChange={setMarkMode}
                portalContainer={previewPortalEl}
              />
            ) : isPdf(previewAttachment) ? (
              <AttachmentPdfPageViewer attachment={previewAttachment} />
            ) : isPreviewableAttachment(previewAttachment) && previewUrl ? (
              <img
                src={previewUrl}
                alt={previewAttachment.file_name}
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
                <FileText className="h-14 w-14" />
                <p className="text-sm font-medium text-foreground">{previewAttachment.file_name}</p>
                {attachmentTypeLabel(previewAttachment) ? (
                  <p className="text-xs uppercase">{attachmentTypeLabel(previewAttachment)}</p>
                ) : null}
                {previewAttachment.urls.download_url ? (
                  <Button variant="outline" asChild>
                    <a
                      href={previewAttachment.urls.download_url}
                      download={previewAttachment.file_name}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                ) : null}
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );

  const fullDropZone = !uploadsDisabled ? (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => !uploadBlocked && fileInputRef.current?.click()}
      className={cn(
        'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40',
        uploadBlocked && 'pointer-events-none opacity-70',
      )}
    >
      {hiddenFileInput}
      {isUploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-muted-foreground">
            Uploading… {uploadProgress != null ? `${uploadProgress}%` : ''}
          </p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop a file here, or click to browse</p>
          <p className="text-xs text-muted-foreground">
            {capacityHint ??
              `${ATTACHMENT_TYPE_HINT} — max ${formatBytes(MAX_ATTACHMENT_BYTES)}`}
          </p>
        </>
      )}
    </div>
  ) : null;

  if (compact) {
    return (
      <>
        {hiddenFileInput}
        <div className={cn('flex h-full min-h-0 w-full', className)}>
          {renderCompactBody()}
        </div>
        {previewDialog}
        {renameUploadDialog}
        {mobileUploadQrDialog}
      </>
    );
  }

  if (isManagerLayout) {
    return (
      <>
        {renderManagerLayout()}
        {previewDialog}
        {renameUploadDialog}
        {mobileUploadQrDialog}
      </>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {fullDropZone}

      {!canQuery ? (
        <p className="text-sm text-muted-foreground">Enter a valid entity ID to load attachments.</p>
      ) : isLoading || isFetching ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading attachments…
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {readOnly ? 'No attachments for this order.' : 'No attachments yet for this entity.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {attachments.map((attachment) => {
            const thumb = attachment.urls.thumb_url ?? attachment.urls.preview_url;
            const typeLabel = attachmentTypeLabel(attachment);

            return (
              <div
                key={attachment.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-card"
              >
                <button
                  type="button"
                  className="block aspect-square w-full overflow-hidden bg-muted/30"
                  onClick={() => setPreviewAttachment(attachment)}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={attachment.file_name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      {typeLabel ? (
                        <span className="text-[10px] font-medium uppercase">{typeLabel}</span>
                      ) : null}
                      <span className="line-clamp-2 text-xs">{attachment.file_name}</span>
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                    <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                  </span>
                </button>
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs font-medium" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  {attachment.note ? (
                    <p className="line-clamp-2 text-[10px] text-muted-foreground" title={attachment.note}>
                      {attachment.note}
                    </p>
                  ) : null}
                  <p className="text-[10px] text-muted-foreground">
                    {formatBytes(attachment.file_size)}
                    {typeLabel ? ` · ${typeLabel}` : ''}
                  </p>
                  <div className="flex gap-1">
                    {attachment.urls.download_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        asChild
                      >
                        <a href={attachment.urls.download_url} download={attachment.file_name}>
                          Download
                        </a>
                      </Button>
                    ) : null}
                    {!readOnly ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        disabled={isDeleting}
                        onClick={() => void onDelete(attachment)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewDialog}
      {renameUploadDialog}
      {mobileUploadQrDialog}
    </div>
  );
}
