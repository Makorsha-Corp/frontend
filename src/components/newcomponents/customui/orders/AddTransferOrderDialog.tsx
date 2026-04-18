import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTransferOrderMutation } from '@/features/transferOrders/transferOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { CreateTransferOrder, CreateTransferOrderItem } from '@/types/transferOrder';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';

const SOURCE_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

const DEST_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

interface AddTransferOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: { id: number } & Record<string, unknown>) => void;
}

const AddTransferOrderDialog: React.FC<AddTransferOrderDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [sourceType, setSourceType] = useState<'storage' | 'machine' | 'damaged'>('storage');
  const [sourceId, setSourceId] = useState<string>('');
  const [destType, setDestType] = useState<'storage' | 'machine' | 'project' | 'damaged'>('storage');
  const [destId, setDestId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ item_id: number; quantity: number; notes?: string }>>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [sourceMachineDisplayLine, setSourceMachineDisplayLine] = useState('');
  const [destMachineDisplayLine, setDestMachineDisplayLine] = useState('');
  const [sourceMachinePickerOpen, setSourceMachinePickerOpen] = useState(false);
  const [destMachinePickerOpen, setDestMachinePickerOpen] = useState(false);

  const [createOrder, { isLoading }] = useCreateTransferOrderMutation();
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });

  const reset = () => {
    setSourceType('storage');
    setSourceId('');
    setDestType('storage');
    setDestId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setNote('');
    setItems([]);
    setItemId('');
    setQty('');
    setSourceMachineDisplayLine('');
    setDestMachineDisplayLine('');
    setSourceMachinePickerOpen(false);
    setDestMachinePickerOpen(false);
  };

  const handleAddItem = () => {
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    if (isNaN(iid) || isNaN(q) || q <= 0) {
      toast.error('Enter valid item and quantity');
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity: q }]);
    setItemId('');
    setQty('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = parseInt(sourceId, 10);
    const did = parseInt(destId, 10);
    if (isNaN(sid) || !sourceId) {
      toast.error('Select source location');
      return;
    }
    if (isNaN(did) || !destId) {
      toast.error('Select destination location');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one transfer item');
      return;
    }

    const orderData: CreateTransferOrder = {
      source_location_type: sourceType,
      source_location_id: sid,
      destination_location_type: destType,
      destination_location_id: did,
      order_date: orderDate || undefined,
      description: description || undefined,
      note: note || undefined,
      current_status_id: 1,
      items: items.map((i) => ({ item_id: i.item_id, quantity: i.quantity, notes: i.notes })) as CreateTransferOrderItem[],
    };

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Transfer order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create transfer order');
    }
  };

  const lineItemsBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Label className="text-base">Transfer items *</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} added</span>
      </div>

      <div className="shrink-0 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {itemsList.map((i) => (
              <SelectItem key={i.id} value={i.id.toString()}>
                {i.name} {i.unit && `(${i.unit})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="bg-background"
            />
          </div>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-lg border border-border bg-background">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No transfer items yet</p>
        ) : (
          items.map((it, idx) => {
            const item = itemsList.find((i) => i.id === it.item_id);
            const unitSuffix = item?.unit ? ` ${item.unit}` : '';
            return (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {item?.name ?? `Item #${it.item_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Quantity {it.quantity}
                    {unitSuffix}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const orderFieldsBlock = (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Source type *</Label>
          <Select
            value={sourceType}
            onValueChange={(v) => {
              setSourceType(v as typeof sourceType);
              setSourceId('');
              setSourceMachineDisplayLine('');
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source *</Label>
          {sourceType === 'storage' || sourceType === 'damaged' ? (
            <Select value={sourceId} onValueChange={setSourceId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <MachineSelectSummaryButton
              onClick={() => setSourceMachinePickerOpen(true)}
              ariaLabel={
                sourceMachineDisplayLine
                  ? `Change source machine. Current: ${sourceMachineDisplayLine}`
                  : 'Select source machine'
              }
              selectedLine={sourceMachineDisplayLine || null}
              staleNumericId={sourceMachineDisplayLine ? null : sourceId || null}
              compactLabel
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Destination type *</Label>
          <Select
            value={destType}
            onValueChange={(v) => {
              setDestType(v as typeof destType);
              setDestId('');
              setDestMachineDisplayLine('');
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Destination *</Label>
          {destType === 'storage' || destType === 'damaged' ? (
            <Select value={destId} onValueChange={setDestId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : destType === 'machine' ? (
            <MachineSelectSummaryButton
              onClick={() => setDestMachinePickerOpen(true)}
              ariaLabel={
                destMachineDisplayLine
                  ? `Change destination machine. Current: ${destMachineDisplayLine}`
                  : 'Select destination machine'
              }
              selectedLine={destMachineDisplayLine || null}
              staleNumericId={destMachineDisplayLine ? null : destId || null}
              compactLabel
            />
          ) : (
            <Select value={destId} onValueChange={setDestId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div>
        <Label>Order date</Label>
        <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
      <div>
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>

      <MachineSelectorDialog
        open={sourceMachinePickerOpen}
        onOpenChange={setSourceMachinePickerOpen}
        title="Select source machine"
        description="Pick factory and section, highlight a machine, then confirm."
        onSelect={(m, ctx) => {
          setSourceId(String(m.id));
          setSourceMachineDisplayLine(`${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`);
        }}
      />
      <MachineSelectorDialog
        open={destMachinePickerOpen}
        onOpenChange={setDestMachinePickerOpen}
        title="Select destination machine"
        description="Pick factory and section, highlight a machine, then confirm."
        onSelect={(m, ctx) => {
          setDestId(String(m.id));
          setDestMachineDisplayLine(`${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`);
        }}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-0 text-left">
          <DialogTitle>Add Transfer Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto pl-2 pr-4 md:flex md:flex-col md:justify-center">
              {orderFieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {lineItemsBlock}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransferOrderDialog;
