import { Download, FileText } from 'lucide-react';

import AttachmentPdfPageViewer from '@/components/newcomponents/customui/AttachmentPdfPageViewer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  attachmentTypeLabel,
  isPreviewableAttachment,
} from '@/lib/attachmentAllowlist';
import type { Attachment } from '@/types/attachment';

function isPdf(attachment: Attachment): boolean {
  return attachment.mime_type === 'application/pdf' || attachment.format === 'pdf';
}

function previewUrl(attachment: Attachment): string | null {
  return attachment.urls.preview_url ?? attachment.urls.thumb_url ?? attachment.file_url;
}

export interface AttachmentPreviewDialogProps {
  attachment: Attachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
}: AttachmentPreviewDialogProps) {
  const url = attachment ? previewUrl(attachment) : null;
  const typeLabel = attachment ? attachmentTypeLabel(attachment) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(96vh,100dvh)] max-h-[96vh] w-[min(96vw,80rem)] max-w-none flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0 space-y-0">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0 flex-1 space-y-1.5 text-left">
              <DialogTitle className="truncate">{attachment?.file_name}</DialogTitle>
              {attachment?.note ? (
                <DialogDescription className="whitespace-pre-wrap">
                  {attachment.note}
                </DialogDescription>
              ) : null}
            </div>
            {attachment?.urls.download_url ? (
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <a href={attachment.urls.download_url} download={attachment.file_name}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          {attachment ? (
            isPdf(attachment) ? (
              <AttachmentPdfPageViewer attachment={attachment} />
            ) : isPreviewableAttachment(attachment) && url ? (
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-muted/20">
                <img
                  src={url}
                  alt={attachment.file_name}
                  className="h-full w-full rounded-md object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-md bg-muted/20 p-6 text-center text-muted-foreground">
                <FileText className="h-10 w-10" />
                <p className="text-sm font-medium text-foreground">{attachment.file_name}</p>
                {typeLabel ? <p className="text-xs uppercase">{typeLabel}</p> : null}
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
