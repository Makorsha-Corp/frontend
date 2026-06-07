import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export interface InvoiceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
  extraDescription?: string;
}

export const InvoiceConfirmDialog: React.FC<InvoiceConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isConfirming = false,
  extraDescription,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[min(28rem,94vw)] max-w-none">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Confirm Invoice
        </DialogTitle>
        <DialogDescription className="space-y-2 pt-1 text-left">
          <span className="block">
            Confirming this invoice will lock it from further edits and allow payments to be recorded against it.
          </span>
          {extraDescription ? (
            <span className="block text-muted-foreground">{extraDescription}</span>
          ) : (
            <span className="block text-muted-foreground">
              If you need to make changes after confirming, you will need to void all active payments first — the invoice will automatically return to draft for editing.
            </span>
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
          Cancel
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Invoice'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export interface InvoiceVoidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoid: (voidNote: string) => void | Promise<void>;
  isVoiding?: boolean;
  activePaymentCount?: number;
  extraWarning?: string;
}

export const InvoiceVoidDialog: React.FC<InvoiceVoidDialogProps> = ({
  open,
  onOpenChange,
  onVoid,
  isVoiding = false,
  activePaymentCount = 0,
  extraWarning,
}) => {
  const [voidNote, setVoidNote] = useState('');
  const [voidAcknowledged, setVoidAcknowledged] = useState(false);

  const resetForm = () => {
    setVoidNote('');
    setVoidAcknowledged(false);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) resetForm();
  };

  const handleVoid = async () => {
    if (!voidNote.trim() || !voidAcknowledged) return;
    await onVoid(voidNote.trim());
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(32rem,94vw)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive space-y-1">
            <p className="font-semibold">This action is permanent and cannot be undone.</p>
            {activePaymentCount > 0 ? (
              <p>
                Voiding this invoice will also void{' '}
                <strong>
                  {activePaymentCount} active payment{activePaymentCount !== 1 ? 's' : ''}
                </strong>{' '}
                and zero out the entire balance.
              </p>
            ) : (
              <p>The invoice balance will be zeroed out.</p>
            )}
            {extraWarning ? <p>{extraWarning}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="void-note">
              Reason for voiding <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="void-note"
              placeholder="Describe why this invoice is being voided..."
              value={voidNote}
              onChange={(e) => setVoidNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={voidAcknowledged}
              onChange={(e) => setVoidAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-destructive cursor-pointer"
            />
            <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
              I understand that this invoice and all its active payments will be permanently voided and this action cannot be reversed.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isVoiding}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={isVoiding || !voidNote.trim() || !voidAcknowledged}
          >
            {isVoiding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Voiding...
              </>
            ) : (
              'Void Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
