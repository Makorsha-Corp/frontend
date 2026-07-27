import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { useCreateWorkOrderSheetEntryMutation } from '@/features/workOrders/workOrdersApi';
import type { Machine } from '@/types/machine';
import type { WorkOrderType } from '@/types/workOrderType';
import { workOrderEntryErrorMessage } from '@/pages/newpages/orders/workOrderEntryFeedback';
import { findOpenWorkOrderSlotConflict } from '@/pages/newpages/orders/workOrderSlotConflict';
import { WorkOrderSlotConflictDialog } from '@/components/newcomponents/customui/orders/WorkOrderSlotConflictDialog';
import type { Item } from '@/types/item';
import type { WorkOrder } from '@/types/workOrder';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface SheetInlineRowEditorProps {
  sheetDate: string;
  machines: Machine[];
  workOrderTypes: WorkOrderType[];
  partItems: Item[];
  defaultMachineId?: number | null;
  slotCheckOrders?: WorkOrder[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SheetInlineRowEditor: React.FC<SheetInlineRowEditorProps> = ({
  sheetDate,
  machines,
  workOrderTypes,
  partItems,
  defaultMachineId,
  slotCheckOrders,
  onSuccess,
  onCancel,
}) => {
  const [machineId, setMachineId] = useState('');
  const [worksTypeId, setWorksTypeId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [workers, setWorkers] = useState('');
  const [remarks, setRemarks] = useState('');

  const [submitEntry, { isLoading }] = useCreateWorkOrderSheetEntryMutation();

  useEffect(() => {
    if (defaultMachineId) setMachineId(String(defaultMachineId));
  }, [defaultMachineId]);

  useEffect(() => {
    if (!worksTypeId && workOrderTypes.length > 0) {
      setWorksTypeId(String(workOrderTypes[0].id));
    }
  }, [workOrderTypes, worksTypeId]);

  const canSave = useMemo(
    () => Boolean(machineId && worksTypeId),
    [machineId, worksTypeId],
  );

  const [slotConflictDialogOpen, setSlotConflictDialogOpen] = useState(false);
  const bypassSlotConflictRef = useRef(false);

  const slotConflict = useMemo(() => {
    if (!slotCheckOrders?.length || !machineId || !worksTypeId) return null;
    return findOpenWorkOrderSlotConflict({
      orders: slotCheckOrders,
      machineId: Number(machineId),
      workOrderTypeId: Number(worksTypeId),
      plannedDate: sheetDate,
    });
  }, [slotCheckOrders, machineId, worksTypeId, sheetDate]);

  const performSave = async () => {
    const hasPart = Boolean(itemId && Number(quantity) > 0);
    try {
      await submitEntry({
        machine_id: Number(machineId),
        work_order_type_id: Number(worksTypeId),
        planned_date: sheetDate,
        assigned_to: workers.trim() || undefined,
        description: remarks.trim() || undefined,
        items: hasPart
          ? [{ item_id: Number(itemId), quantity: Number(quantity) }]
          : undefined,
      }).unwrap();
      toast.success('Row saved');
      setItemId('');
      setQuantity('1');
      setWorkers('');
      setRemarks('');
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(workOrderEntryErrorMessage(err, 'Failed to save row'));
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    if (slotConflict && !bypassSlotConflictRef.current) {
      setSlotConflictDialogOpen(true);
      return;
    }
    bypassSlotConflictRef.current = false;
    await performSave();
  };

  const handleConfirmSeparateOrder = () => {
    bypassSlotConflictRef.current = true;
    setSlotConflictDialogOpen(false);
    void performSave();
  };

  return (
    <>
      <WorkOrderSlotConflictDialog
        open={slotConflictDialogOpen}
        onOpenChange={setSlotConflictDialogOpen}
        conflict={slotConflict}
        plannedDate={sheetDate}
        onConfirm={handleConfirmSeparateOrder}
        isConfirming={isLoading}
      />
      <tr className="border-b border-dashed border-brand-primary/40 bg-brand-primary/5">
      <td className="px-2 py-1.5">
        <Select value={machineId} onValueChange={setMachineId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Machine" />
          </SelectTrigger>
          <SelectContent>
            {machines.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1.5">
        <Select value={worksTypeId} onValueChange={setWorksTypeId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Works" />
          </SelectTrigger>
          <SelectContent>
            {workOrderTypes.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1.5">
        <Select value={itemId || '__none__'} onValueChange={(v) => setItemId(v === '__none__' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {partItems.map((i) => (
              <SelectItem key={i.id} value={String(i.id)}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1.5">
        <StepNumberInput
          min={0.01}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-8"
          disabled={!itemId}
        />
      </td>
      <td className="px-2 py-1.5 text-xs text-muted-foreground">—</td>
      <td className="px-2 py-1.5">
        <Input value={workers} onChange={(e) => setWorkers(e.target.value)} placeholder="Workers" className="h-8 text-xs" />
      </td>
      <td colSpan={3} className="px-2 py-1.5">
        <div className="flex items-center justify-end gap-2">
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks"
            className="h-8 max-w-[140px] text-xs"
          />
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Esc
            </Button>
          )}
          <Button type="button" size="sm" disabled={!canSave || isLoading} onClick={handleSave}>
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enter'}
          </Button>
        </div>
      </td>
    </tr>
    </>
  );
};

export default SheetInlineRowEditor;
