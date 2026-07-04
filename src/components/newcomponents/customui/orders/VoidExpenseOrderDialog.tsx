import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface VoidExpenseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoid: (voidNote: string) => Promise<void>;
  isVoiding?: boolean;
  eoNumber: string;
  hasDraftInvoice: boolean;
}

const VoidExpenseOrderDialog: React.FC<VoidExpenseOrderDialogProps> = ({
  open,
  onOpenChange,
  onVoid,
  isVoiding = false,
  eoNumber,
  hasDraftInvoice,
}) => {
  const [voidNote, setVoidNote] = useState('');
  const [ackEo, setAckEo] = useState(false);
  const [ackInvoice, setAckInvoice] = useState(false);

  const canSubmit = voidNote.trim().length > 0 && ackEo && (!hasDraftInvoice || ackInvoice);

  const resetForm = () => {
    setVoidNote('');
    setAckEo(false);
    setAckInvoice(false);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) resetForm();
  };

  const handleVoid = async () => {
    if (!canSubmit) return;
    await onVoid(voidNote.trim());
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(34rem,94vw)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Expense Order {eoNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive space-y-1">
            <p className="font-semibold">This action is permanent and cannot be undone.</p>
            {hasDraftInvoice && (
              <p>The linked draft invoice will be deleted.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eo-void-note">
              Reason for voiding <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="eo-void-note"
              placeholder="Describe why this expense order is being voided..."
              value={voidNote}
              onChange={(e) => setVoidNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={ackEo}
                onChange={(e) => setAckEo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-destructive cursor-pointer"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                I understand that this expense order will be permanently voided and cannot be reopened.
              </span>
            </label>

            {hasDraftInvoice && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ackInvoice}
                  onChange={(e) => setAckInvoice(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-destructive cursor-pointer"
                />
                <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                  I understand the linked draft invoice will be deleted.
                </span>
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isVoiding}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={isVoiding || !canSubmit}
          >
            {isVoiding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Voiding...
              </>
            ) : (
              'Void Expense Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoidExpenseOrderDialog;
