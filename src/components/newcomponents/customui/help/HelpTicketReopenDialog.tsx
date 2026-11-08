import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { HelpTypeCopy } from './helpCopy';

interface HelpTicketReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
  copy: Pick<
    HelpTypeCopy,
    'reopenConfirmTitle' | 'reopenConfirmDescription' | 'reopenConfirmAction'
  >;
}

const HelpTicketReopenDialog: React.FC<HelpTicketReopenDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isConfirming = false,
  copy,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[min(28rem,94vw)] max-w-none">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          {copy.reopenConfirmTitle}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-3 pt-1 text-left">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
              {copy.reopenConfirmDescription}
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Reopening…
            </>
          ) : (
            copy.reopenConfirmAction
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default HelpTicketReopenDialog;
