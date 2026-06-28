import React, { useState, useMemo } from 'react';
import { CheckCircle2, ChevronRight, Clock, Loader2, Package, RotateCcw, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PurchaseOrderItem, PoReceiveEvent } from '@/types/purchaseOrder';
import {
  useGetPoReceiveEventsQuery,
  useCreatePoReceiveEventMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';

type Mode = 'overview' | 'add' | 'correction';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poId: number;
  items: PurchaseOrderItem[];
  onSaved?: () => void;
}

const PoReceivingDialog: React.FC<Props> = ({ open, onOpenChange, poId, items, onSaved }) => {
  const [mode, setMode] = useState<Mode>('overview');

  // Add receipt form state
  const [rcc, setRcc] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [addQtys, setAddQtys] = useState<Record<number, string>>({});

  // Correction form state
  const [correctionNote, setCorrectionNote] = useState('');
  const [correctionQtys, setCorrectionQtys] = useState<Record<number, string>>({});

  const { data: receiveEvents = [], isLoading: eventsLoading } = useGetPoReceiveEventsQuery(poId, { skip: !open });
  const [createEvent, { isLoading: saving }] = useCreatePoReceiveEventMutation();

  const resetForms = () => {
    setRcc('');
    setReceivedBy('');
    setAddQtys({});
    setCorrectionNote('');
    setCorrectionQtys({});
  };

  const handleClose = () => {
    if (saving) return;
    setMode('overview');
    resetForms();
    onOpenChange(false);
  };

  const handleBack = () => {
    setMode('overview');
    resetForms();
  };

  // ── Add receipt ─────────────────────────────────────────────

  const addLines = useMemo(() => {
    return items
      .map((item) => {
        const raw = addQtys[item.id] ?? '';
        const qty = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)));
        return { item, qty };
      })
      .filter(({ qty }) => qty > 0);
  }, [items, addQtys]);

  const canSubmitAdd = addLines.length > 0;

  const handleSubmitAdd = async () => {
    if (!canSubmitAdd) return;
    try {
      await createEvent({
        poId,
        data: {
          event_type: 'receive',
          rcc: rcc.trim() || null,
          received_by: receivedBy.trim() || null,
          items: addLines.map(({ item, qty }) => ({ po_item_id: item.id, quantity_delta: qty })),
        },
      }).unwrap();
      onSaved?.();
      setMode('overview');
      resetForms();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      alert(e?.data?.detail || 'Failed to record receipt');
    }
  };

  // ── Correction ──────────────────────────────────────────────

  const correctionLines = useMemo(() => {
    return items
      .map((item) => {
        const raw = correctionQtys[item.id] ?? '';
        if (raw === '') return null;
        const newTotal = Math.max(0, Math.floor(Number(raw)));
        const delta = newTotal - Number(item.quantity_received ?? 0);
        return delta !== 0 ? { item, newTotal, delta } : null;
      })
      .filter(Boolean) as { item: PurchaseOrderItem; newTotal: number; delta: number }[];
  }, [items, correctionQtys]);

  const canSubmitCorrection = correctionLines.length > 0 && correctionNote.trim().length > 0;

  const handleSubmitCorrection = async () => {
    if (!canSubmitCorrection) return;
    try {
      await createEvent({
        poId,
        data: {
          event_type: 'correction',
          correction_note: correctionNote.trim(),
          items: correctionLines.map(({ item, delta }) => ({ po_item_id: item.id, quantity_delta: delta })),
        },
      }).unwrap();
      onSaved?.();
      setMode('overview');
      resetForms();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      alert(e?.data?.detail || 'Failed to apply correction');
    }
  };

  const totalReceived = items.reduce((s, it) => s + Number(it.quantity_received ?? 0), 0);
  const totalOrdered = items.reduce((s, it) => s + Number(it.quantity_ordered), 0);
  const allReceived = totalOrdered > 0 && totalReceived >= totalOrdered;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(46rem,95vw)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'overview' && <><Truck className="h-4 w-4 text-muted-foreground" />Manage Receiving</>}
            {mode === 'add' && <><Truck className="h-4 w-4 text-muted-foreground" />Receive Items</>}
            {mode === 'correction' && <><RotateCcw className="h-4 w-4 text-muted-foreground" />Correction</>}
          </DialogTitle>
          {mode === 'overview' && (
            <p className="text-sm text-muted-foreground">
              {allReceived
                ? 'All items on this order have been received.'
                : `${totalReceived} / ${totalOrdered} units received across ${items.length} item(s).`}
            </p>
          )}
        </DialogHeader>

        {/* ── OVERVIEW ── */}
        {mode === 'overview' && (
          <>
            {/* Current quantities */}
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
              {items.map((item) => {
                const received = Number(item.quantity_received ?? 0);
                const ordered = Number(item.quantity_ordered);
                const pct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0;
                const complete = received >= ordered;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.item_name ?? `Item #${item.item_id}`}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', complete ? 'bg-green-500' : 'bg-brand-primary')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                          {received} / {ordered} {item.item_unit ?? ''}
                        </span>
                      </div>
                    </div>
                    {complete && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => setMode('add')}
              >
                <Truck className="h-5 w-5 text-brand-primary" />
                <span className="text-sm font-medium">Receive Items</span>
                <span className="text-xs text-muted-foreground">Log new goods received</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => {
                  const init: Record<number, string> = {};
                  for (const it of items) init[it.id] = String(Number(it.quantity_received ?? 0));
                  setCorrectionQtys(init);
                  setMode('correction');
                }}
              >
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Correction</span>
                <span className="text-xs text-muted-foreground">Adjust recorded quantities</span>
              </Button>
            </div>

            {/* History */}
            {eventsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />Loading history...
              </div>
            ) : receiveEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">No receive events recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[28vh] overflow-y-auto pr-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receive history</p>
                {receiveEvents.map((ev) => (
                  <ReceiveEventRow key={ev.id} event={ev} />
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}

        {/* ── ADD RECEIPT ── */}
        {mode === 'add' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="po-rcc">RCC <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="po-rcc"
                  placeholder="Receive confirmation code"
                  value={rcc}
                  onChange={(e) => setRcc(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-received-by">Received by <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="po-received-by"
                  placeholder="Person who received goods"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantities received this shipment</p>
              {items.map((item) => {
                const ordered = Number(item.quantity_ordered);
                const alreadyReceived = Number(item.quantity_received ?? 0);
                const remaining = Math.max(0, ordered - alreadyReceived);
                const addQty = Number(addQtys[item.id] ?? 0);
                const willExceed = alreadyReceived + addQty > ordered;

                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.item_name ?? `Item #${item.item_id}`}</p>
                      <p className="text-xs text-muted-foreground">{alreadyReceived} / {ordered} {item.item_unit ?? ''} already received · {remaining} remaining</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={remaining}
                        placeholder="0"
                        value={addQtys[item.id] ?? ''}
                        onChange={(e) => setAddQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                        className={cn('w-20 h-8 text-sm text-right', willExceed && 'border-destructive')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs shrink-0"
                        onClick={() => setAddQtys((p) => ({ ...p, [item.id]: String(remaining) }))}
                        disabled={remaining <= 0}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {addLines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {addLines.reduce((s, l) => s + l.qty, 0)} unit(s) across {addLines.length} item(s) will be recorded.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} disabled={saving}>Back</Button>
              <Button
                onClick={handleSubmitAdd}
                disabled={saving || !canSubmitAdd}
                className="bg-brand-primary hover:bg-brand-primary-hover"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirm Receipt
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── CORRECTION ── */}
        {mode === 'correction' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="po-correction-note">
                Correction note <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="po-correction-note"
                placeholder="Explain why quantities are being adjusted..."
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Set correct received quantity</p>
              {items.map((item) => {
                const current = Number(item.quantity_received ?? 0);
                const ordered = Number(item.quantity_ordered);
                const newVal = correctionQtys[item.id] !== undefined
                  ? Math.max(0, Math.floor(Number(correctionQtys[item.id])))
                  : current;
                const delta = newVal - current;
                const changed = delta !== 0;

                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.item_name ?? `Item #${item.item_id}`}</p>
                      <p className="text-xs text-muted-foreground">ordered: {ordered} {item.item_unit ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {changed && (
                        <span className={cn('text-xs font-medium tabular-nums', delta > 0 ? 'text-green-600' : 'text-destructive')}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      )}
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={ordered}
                        value={correctionQtys[item.id] ?? current}
                        onChange={(e) => setCorrectionQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                        className={cn('w-20 h-8 text-sm text-right', changed && 'border-amber-400 ring-1 ring-amber-400/30')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {correctionLines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {correctionLines.length} item(s) will be adjusted.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} disabled={saving}>Back</Button>
              <Button
                variant="outline"
                onClick={handleSubmitCorrection}
                disabled={saving || !canSubmitCorrection}
                className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Save Correction
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ReceiveEventRow: React.FC<{ event: PoReceiveEvent }> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);
  const isReceive = event.event_type === 'receive';
  const totalDelta = event.items.reduce((s, i) => s + Number(i.quantity_delta), 0);

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          isReceive ? 'bg-green-100 dark:bg-green-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
        )}>
          {isReceive
            ? <Truck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            : <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {isReceive ? 'Receipt' : 'Correction'}
            </span>
            {event.rcc && (
              <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">
                RCC: {event.rcc}
              </Badge>
            )}
            <span className={cn(
              'text-xs font-medium tabular-nums',
              isReceive ? 'text-green-600 dark:text-green-400' : (totalDelta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive')
            )}>
              {totalDelta > 0 ? '+' : ''}{totalDelta} unit(s)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
            </span>
            {event.performer_name && <span>· {event.performer_name}</span>}
            {event.received_by && <span>· Received by: {event.received_by}</span>}
          </div>
        </div>
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-1.5">
          {event.correction_note && (
            <p className="text-xs text-muted-foreground italic">"{event.correction_note}"</p>
          )}
          {event.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">{item.po_item_name ?? `Item #${item.po_item_id}`}</span>
              <span className={cn(
                'tabular-nums font-medium shrink-0 ml-2',
                Number(item.quantity_delta) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}>
                {Number(item.quantity_delta) > 0 ? '+' : ''}{Number(item.quantity_delta)} {item.po_item_unit ?? ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoReceivingDialog;
