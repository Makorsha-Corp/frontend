import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TransferOrderItem } from '@/types/transferOrder';
import { useUpdateTransferOrderItemMutation } from '@/features/transferOrders/transferOrdersApi';

export interface ManageTransferOrderTransfersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toId: number;
  items: TransferOrderItem[];
  onSaved?: () => void;
}

const ManageTransferOrderTransfersDialog: React.FC<ManageTransferOrderTransfersDialogProps> = ({
  open,
  onOpenChange,
  toId,
  items,
  onSaved,
}) => {
  const [updateItem, { isLoading }] = useUpdateTransferOrderItemMutation();
  const [transferredByDraft, setTransferredByDraft] = useState<Record<number, string>>({});
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  const pendingCount = useMemo(
    () => items.filter((i) => !i.transferred_at).length,
    [items]
  );

  const itemLabel = (it: TransferOrderItem) => it.item_name ?? `Item #${it.item_id}`;

  const handleRecordTransfer = async (item: TransferOrderItem) => {
    setSavingItemId(item.id);
    try {
      await updateItem({
        itemId: item.id,
        toId,
        data: {
          transferred_at: new Date().toISOString(),
          transferred_by: transferredByDraft[item.id]?.trim() || null,
        },
      }).unwrap();
      toast.success(`Transfer recorded for ${itemLabel(item)}`);
      onSaved?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail ?? 'Failed to record transfer');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleClearTransfer = async (item: TransferOrderItem) => {
    setSavingItemId(item.id);
    try {
      await updateItem({
        itemId: item.id,
        toId,
        data: {
          transferred_at: null,
          transferred_by: null,
        },
      }).unwrap();
      toast.success(`Transfer cleared for ${itemLabel(item)}`);
      onSaved?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail ?? 'Failed to clear transfer');
    } finally {
      setSavingItemId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(42rem,94vw)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Record item transfers
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} item(s) still need a transfer recorded.`
              : 'All items on this order have transfer recorded.'}
          </p>
        </DialogHeader>
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((item) => {
            const isTransferred = Boolean(item.transferred_at);
            const isSaving = savingItemId === item.id || isLoading;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {itemLabel(item)}
                    </p>
                    {isTransferred && (
                      <Badge className="shrink-0 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Transferred
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Item #{item.line_number} · Qty {item.quantity}
                    {item.item_unit ? ` ${item.item_unit}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end shrink-0">
                  {!isTransferred && (
                    <div className="space-y-1">
                      <Label htmlFor={`tr-by-${item.id}`} className="text-xs text-muted-foreground">
                        Transferred by (optional)
                      </Label>
                      <Input
                        id={`tr-by-${item.id}`}
                        className="h-8 w-full sm:w-44"
                        value={transferredByDraft[item.id] ?? ''}
                        onChange={(e) =>
                          setTransferredByDraft((d) => ({ ...d, [item.id]: e.target.value }))
                        }
                        placeholder="Name"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {isTransferred ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => void handleClearTransfer(item)}
                      >
                        Clear
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-brand-primary hover:bg-brand-primary-hover"
                        disabled={isSaving}
                        onClick={() => void handleRecordTransfer(item)}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          'Record transfer'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTransferOrderTransfersDialog;
