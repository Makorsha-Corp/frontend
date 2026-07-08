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

export interface VoidWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoid: (voidNote: string) => Promise<void>;
  isVoiding?: boolean;
  woNumber: string;
  hasConsumedInventory: boolean;
  hasDraftInvoice: boolean;
}

const VoidWorkOrderDialog: React.FC<VoidWorkOrderDialogProps> = ({
  open,
  onOpenChange,
  onVoid,
  isVoiding = false,
  woNumber,
  hasConsumedInventory,
  hasDraftInvoice,
}) => {
  const [voidNote, setVoidNote] = useState('');
  const [ackWo, setAckWo] = useState(false);
  const [ackInventory, setAckInventory] = useState(false);

  const canSubmit = voidNote.trim().length > 0 && ackWo && (!hasConsumedInventory || ackInventory);

  const resetForm = () => {
    setVoidNote('');
    setAckWo(false);
    setAckInventory(false);
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
            Void Work Order {woNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive space-y-1">
            <p className="font-semibold">This action is permanent and cannot be undone.</p>
            {hasConsumedInventory && (
              <p>Any inventory already consumed by this order will be returned to its source.</p>
            )}
            {hasDraftInvoice && <p>The linked draft invoice will be deleted.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wo-void-note">
              Reason for voiding <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="wo-void-note"
              placeholder="Describe why this work order is being voided..."
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
                checked={ackWo}
                onChange={(e) => setAckWo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-destructive cursor-pointer"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                I understand that this work order will be permanently voided and cannot be reopened.
              </span>
            </label>

            {hasConsumedInventory && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ackInventory}
                  onChange={(e) => setAckInventory(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-destructive cursor-pointer"
                />
                <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                  I understand consumed inventory will be returned to its source.
                </span>
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isVoiding}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleVoid} disabled={isVoiding || !canSubmit}>
            {isVoiding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Voiding...
              </>
            ) : (
              'Void Work Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoidWorkOrderDialog;
