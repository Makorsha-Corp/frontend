import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Clock, Loader2, Package, Plus, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import type { SalesOrderItem } from '@/types/salesOrderItem';
import type { SalesDelivery } from '@/types/salesDelivery';
import type { DeliveryMethod } from '@/types/deliveryMethod';
import {
  useGetSalesOrderDeliveriesQuery,
} from '@/features/salesOrders/salesOrdersApi';
import {
  useCreateSalesDeliveryMutation,
  useCompleteSalesDeliveryMutation,
  useGetSalesDeliveryItemsQuery,
} from '@/features/salesDeliveries/salesDeliveriesApi';
import { useGetDeliveryMethodsQuery } from '@/features/deliveryMethods/deliveryMethodsApi';
import AddDeliveryMethodDialog from '@/components/newcomponents/customui/AddDeliveryMethodDialog';

type Mode = 'overview' | 'add';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  items: SalesOrderItem[];
  onSaved?: () => void;
}

const SalesDeliveryDialog: React.FC<Props> = ({ open, onOpenChange, orderId, items, onSaved }) => {
  const [mode, setMode] = useState<Mode>('overview');

  const [scheduledDate, setScheduledDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const [deliveryMethodId, setDeliveryMethodId] = useState('');
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);

  const { data: deliveries = [], isLoading: deliveriesLoading } = useGetSalesOrderDeliveriesQuery(orderId, { skip: !open });
  const { data: deliveryMethods = [], refetch: refetchMethods } = useGetDeliveryMethodsQuery(undefined, { skip: !open });
  const [createDelivery, { isLoading: creating }] = useCreateSalesDeliveryMutation();

  const resetForm = () => {
    setScheduledDate('');
    setTrackingNumber('');
    setNotes('');
    setQtys({});
    setDeliveryMethodId('');
  };

  const handleCreateMethodSuccess = (method: DeliveryMethod) => {
    refetchMethods();
    setDeliveryMethodId(method.id.toString());
    setIsAddMethodOpen(false);
  };

  const handleClose = () => {
    if (creating) return;
    setMode('overview');
    resetForm();
    onOpenChange(false);
  };

  const handleBack = () => {
    setMode('overview');
    resetForm();
  };

  const remainingFor = (item: SalesOrderItem) =>
    item.quantity_remaining ?? Math.max(0, item.quantity_ordered - item.quantity_delivered);

  const lines = useMemo(() => {
    return items
      .map((item) => {
        const raw = qtys[item.id] ?? '';
        const qty = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)));
        return { item, qty };
      })
      .filter(({ qty }) => qty > 0);
  }, [items, qtys]);

  const canSubmit = lines.length > 0 && deliveryMethodId !== '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await createDelivery({
        delivery: {
          sales_order_id: orderId,
          delivery_method_id: parseInt(deliveryMethodId, 10),
          scheduled_date: scheduledDate || undefined,
          tracking_number: trackingNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        items: lines.map(({ item, qty }) => ({ sales_order_item_id: item.id, quantity_delivered: qty })),
      }).unwrap();
      toast.success('Delivery planned');
      onSaved?.();
      setMode('overview');
      resetForm();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to plan delivery');
    }
  };

  const totalDelivered = items.reduce((s, it) => s + Number(it.quantity_delivered), 0);
  const totalOrdered = items.reduce((s, it) => s + Number(it.quantity_ordered), 0);
  const allDelivered = totalOrdered > 0 && totalDelivered >= totalOrdered;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(46rem,95vw)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'overview' && <><Truck className="h-4 w-4 text-muted-foreground" />Manage Deliveries</>}
            {mode === 'add' && <><Truck className="h-4 w-4 text-muted-foreground" />Plan Delivery</>}
          </DialogTitle>
          {mode === 'overview' && (
            <p className="text-sm text-muted-foreground">
              {allDelivered
                ? 'All items on this order have been delivered.'
                : `${totalDelivered} / ${totalOrdered} units delivered across ${items.length} item(s).`}
            </p>
          )}
        </DialogHeader>

        {/* ── OVERVIEW ── */}
        {mode === 'overview' && (
          <>
            <div className="space-y-2 max-h-[26vh] overflow-y-auto pr-1">
              {items.map((item) => {
                const delivered = Number(item.quantity_delivered);
                const ordered = Number(item.quantity_ordered);
                const pct = ordered > 0 ? Math.min(100, (delivered / ordered) * 100) : 0;
                const complete = delivered >= ordered;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
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
                          {delivered} / {ordered} {item.item_unit ?? ''}
                        </span>
                      </div>
                    </div>
                    {complete && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => setMode('add')}
              disabled={allDelivered}
            >
              <Truck className="h-5 w-5 text-brand-primary" />
              <span className="text-sm font-medium">Plan Delivery</span>
              <span className="text-xs text-muted-foreground">Ship some or all of the remaining items</span>
            </Button>

            {deliveriesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />Loading deliveries...
              </div>
            ) : deliveries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">No deliveries planned yet.</p>
            ) : (
              <div className="space-y-2 max-h-[28vh] overflow-y-auto pr-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery history</p>
                {deliveries.map((d) => (
                  <DeliveryRow key={d.id} delivery={d} deliveryMethods={deliveryMethods} onCompleted={() => onSaved?.()} />
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}

        {/* ── PLAN DELIVERY ── */}
        {mode === 'add' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="so-delivery-method">Delivery method <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-1.5">
                <Select value={deliveryMethodId} onValueChange={setDeliveryMethodId}>
                  <SelectTrigger id="so-delivery-method" className="w-full bg-background">
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setIsAddMethodOpen(true)}
                  aria-label="Add delivery method"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="so-scheduled-date">Scheduled date <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="so-scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="so-tracking-number">Tracking number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="so-tracking-number"
                  placeholder="Shipment tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="so-delivery-notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="so-delivery-notes"
                placeholder="Any notes about this shipment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantities in this shipment</p>
              {items.map((item) => {
                const ordered = Number(item.quantity_ordered);
                const alreadyDelivered = Number(item.quantity_delivered);
                const remaining = remainingFor(item);
                const qty = Number(qtys[item.id] ?? 0);
                const willExceed = alreadyDelivered + qty > ordered;

                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.item_name ?? `Item #${item.item_id}`}</p>
                      <p className="text-xs text-muted-foreground">{alreadyDelivered} / {ordered} {item.item_unit ?? ''} already delivered · {remaining} remaining</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StepNumberInput
                        min={0}
                        max={remaining}
                        step={1}
                        placeholder="0"
                        value={qtys[item.id] ?? ''}
                        onChange={(e) => setQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                        disabled={remaining <= 0}
                        className={cn('h-8 w-24 text-sm text-right bg-background', willExceed && 'border-destructive')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs shrink-0"
                        onClick={() => setQtys((p) => ({ ...p, [item.id]: String(remaining) }))}
                        disabled={remaining <= 0}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {lines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {lines.reduce((s, l) => s + l.qty, 0)} unit(s) across {lines.length} item(s) will be planned.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} disabled={creating}>Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={creating || !canSubmit}
                className="bg-brand-primary hover:bg-brand-primary-hover"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                Plan Delivery
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      <AddDeliveryMethodDialog
        open={isAddMethodOpen}
        onOpenChange={setIsAddMethodOpen}
        deliveryMethods={deliveryMethods}
        onSuccess={handleCreateMethodSuccess}
      />
    </Dialog>
  );
};

const statusBadgeClass = (status: SalesDelivery['delivery_status']) => {
  if (status === 'delivered') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-transparent';
  if (status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-transparent';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-transparent';
};

const DeliveryRow: React.FC<{ delivery: SalesDelivery; deliveryMethods: DeliveryMethod[]; onCompleted: () => void }> = ({ delivery, deliveryMethods, onCompleted }) => {
  const [expanded, setExpanded] = useState(false);
  const { data: deliveryItems = [], isLoading: itemsLoading } = useGetSalesDeliveryItemsQuery(delivery.id, { skip: !expanded });
  const [completeDelivery, { isLoading: completing }] = useCompleteSalesDeliveryMutation();
  const methodName = deliveryMethods.find((m) => m.id === delivery.delivery_method_id)?.name;

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await completeDelivery(delivery.id).unwrap();
      for (const msg of result.messages ?? []) {
        toast.success(msg.message);
      }
      onCompleted();
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to complete delivery');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{delivery.delivery_number}</span>
            <Badge className={cn('text-xs px-1.5 py-0', statusBadgeClass(delivery.delivery_status))}>
              {delivery.delivery_status}
            </Badge>
            {methodName && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {methodName}
              </Badge>
            )}
            {delivery.tracking_number && (
              <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">
                {delivery.tracking_number}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(delivery.actual_delivery_date ?? delivery.scheduled_date ?? delivery.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        {delivery.delivery_status === 'planned' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs shrink-0"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
            Mark Delivered
          </Button>
        )}
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-1.5">
          {delivery.notes && <p className="text-xs text-muted-foreground italic">"{delivery.notes}"</p>}
          {itemsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />Loading items...
            </div>
          ) : (
            deliveryItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">
                  {item.item_id != null ? `Item #${item.item_id}` : 'Misc line'}
                </span>
                <span className="tabular-nums font-medium shrink-0 ml-2">{item.quantity_delivered}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SalesDeliveryDialog;
