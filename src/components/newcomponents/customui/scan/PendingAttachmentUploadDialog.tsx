import { FileText, Loader2, ScanLine } from 'lucide-react';
import { appToast } from '@/lib/appToast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import CornerOverlay from './CornerOverlay';
import { DEFAULT_SCAN_PRESET, SCAN_PRESETS } from './scanPresets';
import { useDocumentScan } from './useDocumentScan';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export interface PendingAttachmentUploadDialogProps {
  file: File | null;
  fileName: string;
  onFileNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: (file: File, fileName: string, note: string | null) => Promise<void>;
  isUploading: boolean;
  showDescription?: boolean;
  title?: string;
  descriptionText?: string;
}

const MAX_DESCRIPTION_LENGTH = 500;

export default function PendingAttachmentUploadDialog({
  file,
  fileName,
  onFileNameChange,
  description,
  onDescriptionChange,
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  isUploading,
  showDescription = true,
  title = 'Name this attachment',
  descriptionText = 'Preview your file, add an optional description, optionally scan it, then upload.',
}: PendingAttachmentUploadDialogProps) {
  const scan = useDocumentScan(file);
  const scannedActive = scan.version === 'scanned' && scan.scanPhase === 'ready';

  const handleConfirm = async () => {
    if (!file) return;
    const trimmedDescription = description.trim();
    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      appToast.error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
      return;
    }

    try {
      const resolved = await scan.resolveUploadFile(fileName);
      await onConfirm(resolved, resolved.name, trimmedDescription || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not prepare upload.';
      appToast.error(message);
    }
  };

  const previewUrl =
    scannedActive && scan.resultPreviewUrl
      ? scan.resultPreviewUrl
      : scan.sourcePreviewUrl;

  const showCornerOverlay =
    scannedActive && scan.corners && scan.sourcePreviewUrl && scan.imageWidth > 0;

  const scanModeActive =
    scan.version === 'scanned' || scan.scanPhase === 'loading' || scan.scanPhase === 'ready';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-w-none flex-col gap-4 overflow-hidden',
          scanModeActive
            ? 'h-[min(88vh,920px)] max-h-[88vh] w-[min(64rem,96vw)]'
            : 'w-[min(48rem,94vw)]',
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto max-md:-mx-1 max-md:px-1 md:overflow-hidden">
          <div
            className={cn(
              'grid gap-4 md:min-h-0 md:flex-1 md:overflow-hidden',
              scanModeActive
                ? 'md:grid-cols-[minmax(0,1.85fr)_minmax(18rem,1fr)]'
                : 'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]',
            )}
          >
            <div
              className={cn(
                'flex flex-col gap-3',
                scanModeActive ? 'md:min-h-[24rem]' : 'md:min-h-[14rem]',
              )}
            >
              <div
                className={cn(
                  'flex overflow-hidden rounded-lg border border-border bg-image-checkerboard p-3',
                  showCornerOverlay ? 'items-stretch' : 'items-center justify-center',
                  scanModeActive
                    ? 'max-md:min-h-[12rem] max-md:flex-none md:min-h-0 md:flex-1'
                    : 'md:min-h-[18rem]',
                )}
              >
            {scan.scanPhase === 'loading' ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Preparing scanner…</p>
              </div>
            ) : showCornerOverlay && scan.corners && scan.sourcePreviewUrl ? (
              <CornerOverlay
                imageUrl={scan.sourcePreviewUrl}
                imageWidth={scan.imageWidth}
                imageHeight={scan.imageHeight}
                corners={scan.corners}
                onCornersChange={scan.setCorners}
                disabled={isUploading}
                className="min-h-0 flex-1 self-stretch"
              />
            ) : previewUrl && file && isImageFile(file) ? (
              <img
                src={previewUrl}
                alt={fileName || file.name}
                className="max-h-[40vh] w-full object-contain md:max-h-[24rem]"
              />
            ) : file && isPdfFile(file) ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p className="text-sm font-medium">PDF preview</p>
                <p className="max-w-[16rem] truncate text-xs">{file.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p className="text-sm font-medium">Preview unavailable</p>
              </div>
            )}
            </div>

            {scannedActive && showCornerOverlay ? (
              <p className="shrink-0 text-center text-xs text-muted-foreground md:text-left">
                Pinch to zoom · drag corners to align
              </p>
            ) : null}

            {scannedActive && scan.resultPreviewUrl ? (
              <div className="flex flex-col gap-2 max-md:min-h-0 md:min-h-[12rem] md:shrink-0">
                <Label>Result</Label>
                <div className="flex min-h-[10rem] items-center justify-center overflow-hidden rounded-lg border border-border bg-image-checkerboard p-3 md:flex-1">
                  <img
                    src={scan.resultPreviewUrl}
                    alt="Scanned preview"
                    className="max-h-[16rem] w-full object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 max-md:overflow-visible md:min-h-0 md:overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="attachment-upload-name">File name</Label>
              <Input
                id="attachment-upload-name"
                value={fileName}
                onChange={(event) => onFileNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleConfirm();
                }}
                autoFocus
                disabled={isUploading || scan.isBusy}
              />
              {file ? (
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                  {file.type ? ` · ${file.type}` : ''}
                </p>
              ) : null}
            </div>

            {showDescription ? (
            <div className="space-y-2">
              <Label htmlFor="attachment-upload-description">Description (optional)</Label>
              <Textarea
                id="attachment-upload-description"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Short note about this file…"
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
                disabled={isUploading || scan.isBusy}
                className="min-h-[4.5rem] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>
            ) : null}

            <div className="space-y-2">
              <Label>Version</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={scan.version === 'original' ? 'default' : 'outline'}
                  onClick={() => scan.setVersion('original')}
                  disabled={isUploading || scan.isBusy}
                >
                  Original
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scan.version === 'scanned' ? 'default' : 'outline'}
                  onClick={() => {
                    void scan.setVersion('scanned').catch((error: unknown) => {
                      const message =
                        error instanceof Error ? error.message : 'Document scanning failed.';
                      appToast.error(message);
                    });
                  }}
                  disabled={!scan.canScan || isUploading || scan.scanPhase === 'error'}
                  title={scan.scanDisabledReason ?? undefined}
                >
                  <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                  Scan document
                </Button>
              </div>
              {scan.scanDisabledReason ? (
                <p className="text-xs text-muted-foreground">{scan.scanDisabledReason}</p>
              ) : null}
              {scan.detectionNote ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">{scan.detectionNote}</p>
              ) : null}
            </div>

            {scannedActive ? (
              <>
                <div className="space-y-2">
                  <Label>Preset</Label>
                  <div className="flex flex-wrap gap-2">
                    {SCAN_PRESETS.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        size="sm"
                        variant={scan.preset === item.id ? 'default' : 'outline'}
                        onClick={() => scan.setPreset(item.id)}
                        disabled={isUploading || scan.isBusy}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {SCAN_PRESETS.find((item) => item.id === scan.preset)?.description ??
                      SCAN_PRESETS.find((item) => item.id === DEFAULT_SCAN_PRESET)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Corners</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void scan.redetectCorners()}
                      disabled={isUploading || scan.isBusy}
                    >
                      Re-detect
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={scan.resetToWholePhoto}
                      disabled={isUploading || scan.isBusy}
                    >
                      Whole photo
                    </Button>
                  </div>
                </div>

              </>
            ) : null}

            <DialogFooter className="mt-auto gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={isUploading || scan.isBusy || !file}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : scan.version === 'scanned' ? (
                  showDescription ? 'Upload scan' : 'Send scan'
                ) : showDescription ? (
                  'Upload'
                ) : (
                  'Send'
                )}
              </Button>
            </DialogFooter>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
