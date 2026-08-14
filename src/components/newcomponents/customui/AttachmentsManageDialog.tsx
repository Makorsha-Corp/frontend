import { Paperclip } from 'lucide-react';

import AttachmentPanel from '@/components/newcomponents/customui/AttachmentPanel';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AttachmentEntityType } from '@/types/attachment';

export interface AttachmentsManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: AttachmentEntityType;
  entityId: number;
  readOnly?: boolean;
  title?: string;
  count?: number;
}

export default function AttachmentsManageDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  readOnly = false,
  title = 'Attachments',
  count,
}: AttachmentsManageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            {title}
            {count != null && count > 0 ? (
              <Badge variant="outline" className="font-normal">
                {count}
              </Badge>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {open ? (
            <AttachmentPanel
              entityType={entityType}
              entityId={entityId}
              readOnly={readOnly}
              enabled={open}
              layout="manager"
              className="h-full"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
