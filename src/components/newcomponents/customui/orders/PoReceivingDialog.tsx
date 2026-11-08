import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, ChevronRight, Clock, Loader2, Package, RotateCcw, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepNumberInput } from '@/components/ui/step-number-input';
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
import { appToast } from '@/lib/appToast';
import {
  HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT,
  HELP_GUIDE_PO_TOUR_ACTION_EVENT,
  HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT,
  type HelpGuidePoReceivingTourMode,
  type HelpGuidePoTourAction,
} from '@/features/helpGuides/helpGuideSession';

function emitPoTourActionDoneForSample(isTourSample: boolean, action: HelpGuidePoTourAction): void {
  if (!isTourSample) return;
  window.dispatchEvent(new CustomEvent(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, { detail: action }));
}

type Mode = 'overview' | 'add' | 'correction';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poId: number;
  items: PurchaseOrderItem[];
  onSaved?: () => void;
  isTourSample?: boolean;
}

const PoReceivingDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  poId,
  items,
  onSaved,
  isTourSample = false,
}) => {
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

  const handleSubmitAdd = useCallback(async () => {
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
      emitPoTourActionDoneForSample(isTourSample, 'confirm_receipt');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to record receipt');
    }
  }, [addLines, canSubmitAdd, createEvent, isTourSample, onSaved, poId, rcc, receivedBy]);

  const tourLine0QtyDone = useRef(false);

  useEffect(() => {
    if (!open) {
      tourLine0QtyDone.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!isTourSample || mode !== 'add' || items.length === 0 || tourLine0QtyDone.current) return;
    const item = items[0];
    const target = Math.max(
      0,
      Math.floor(Number(item.quantity_ordered) - Number(item.quantity_received ?? 0)),
    );
    if (target <= 0) return;
    const raw = addQtys[item.id] ?? '';
    const qty = raw === '' ? 0 : Math.floor(Number(raw));
    if (qty >= target) {
      tourLine0QtyDone.current = true;
      emitPoTourActionDoneForSample(isTourSample, 'receive_qty_line_0');
    }
  }, [addQtys, isTourSample, mode, items]);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!isTourSample) return;

    const onReceivingTourMode = (event: Event) => {
      const mode = (event as CustomEvent<HelpGuidePoReceivingTourMode>).detail;
      if (mode === 'overview') {
        setMode('overview');
        resetForms();
        tourLine0QtyDone.current = false;
      } else if (mode === 'add') {
        setMode('add');
      }
    };

    window.addEventListener(HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT, onReceivingTourMode);
    return () =>
      window.removeEventListener(HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT, onReceivingTourMode);
  }, [isTourSample]);

  useEffect(() => {
    if (!isTourSample) return;

    const onPoTourAction = (event: Event) => {
      const action = (event as CustomEvent<HelpGuidePoTourAction>).detail;

      if (action === 'receive_items') {
        if (!open) return;
        if (modeRef.current === 'add') {
          emitPoTourActionDoneForSample(true, 'receive_items');
          return;
        }
        setMode('add');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            emitPoTourActionDoneForSample(true, 'receive_items');
          });
        });
        return;
      }
      if (action === 'receive_qty_line_0') {
        const item = items[0];
        if (!item) return;
        const remaining = Math.max(
          0,
          Math.floor(Number(item.quantity_ordered) - Number(item.quantity_received ?? 0)),
        );
        if (remaining <= 0) {
          emitPoTourActionDoneForSample(true, 'receive_qty_line_0');
          return;
        }
        setAddQtys((p) => ({ ...p, [item.id]: String(remaining) }));
        tourLine0QtyDone.current = true;
        emitPoTourActionDoneForSample(true, 'receive_qty_line_0');
        return;
      }
      if (action === 'receive_all_line_1') {
        const item = items[1];
        if (!item) return;
        const remaining = Math.max(
          0,
          Math.floor(Number(item.quantity_ordered) - Number(item.quantity_received ?? 0)),
        );
        if (remaining <= 0) {
          emitPoTourActionDoneForSample(true, 'receive_all_line_1');
          return;
        }
        setAddQtys((p) => ({ ...p, [item.id]: String(remaining) }));
        emitPoTourActionDoneForSample(true, 'receive_all_line_1');
        return;
      }
      if (action === 'confirm_receipt') {
        void handleSubmitAdd();
      }
    };

    window.addEventListener(HELP_GUIDE_PO_TOUR_ACTION_EVENT, onPoTourAction);
    return () => window.removeEventListener(HELP_GUIDE_PO_TOUR_ACTION_EVENT, onPoTourAction);
  }, [handleSubmitAdd, isTourSample, items, open]);

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
                id="po-receive-items-btn"
                type="button"
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => {
                  setMode('add');
                  emitPoTourActionDoneForSample(isTourSample, 'receive_items');
                }}
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
              <div
                id="po-receive-history"
                className="space-y-2 max-h-[28vh] overflow-y-auto pr-1"
              >
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
                <Label htmlFor="po-rcc">RCC / MRR number <span className="text-muted-foreground font-normal">(optional)</span></Label>
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
              {items.map((item, lineIndex) => {
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
                      {lineIndex === 0 ? (
                        <div id="po-receive-qty-line-0-stepper" className="shrink-0">
                          <StepNumberInput
                            id="po-receive-qty-line-0"
                            min={0}
                            max={remaining}
                            step={1}
                            placeholder="0"
                            value={addQtys[item.id] ?? ''}
                            onChange={(e) => setAddQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                            disabled={remaining <= 0}
                            className={cn(
                              'h-8 w-24 text-sm text-right bg-background',
                              willExceed && 'border-destructive',
                            )}
                          />
                        </div>
                      ) : (
                        <StepNumberInput
                          min={0}
                          max={remaining}
                          step={1}
                          placeholder="0"
                          value={addQtys[item.id] ?? ''}
                          onChange={(e) => setAddQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                          disabled={remaining <= 0}
                          className={cn(
                            'h-8 w-24 text-sm text-right bg-background',
                            willExceed && 'border-destructive',
                          )}
                        />
                      )}
                      <Button
                        id={lineIndex === 1 ? 'po-receive-all-btn-1' : undefined}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs shrink-0"
                        onClick={() => {
                          setAddQtys((p) => ({ ...p, [item.id]: String(remaining) }));
                          if (lineIndex === 1) {
                            emitPoTourActionDoneForSample(isTourSample, 'receive_all_line_1');
                          }
                        }}
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
                id="po-confirm-receipt-btn"
                onClick={() => void handleSubmitAdd()}
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
                      <StepNumberInput
                        min={0}
                        max={ordered}
                        step={1}
                        value={correctionQtys[item.id] ?? String(current)}
                        onChange={(e) => setCorrectionQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                        className={cn('h-8 w-24 text-sm text-right bg-background', changed && 'border-amber-400 ring-1 ring-amber-400/30')}
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
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                <ReferenceId tone="inherit" size="xs">
                  RCC: {event.rcc}
                </ReferenceId>
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
            <p className="text-xs text-muted-foreground italic">&ldquo;{event.correction_note}&rdquo;</p>
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
