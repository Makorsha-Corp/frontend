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
import { useCreateWorkOrderMutation } from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectComponentsQuery } from '@/features/projectComponents/projectComponentsApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import type { WorkOrderPriority } from '@/types/workOrder';
import {
  WORK_ORDER_PRIORITIES,
  priorityLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { API_LIMITS } from '@/constants/apiLimits';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutoSelectGlobalFactory } from '@/hooks/useGlobalFactoryContext';

type TargetValue = 'none' | `machine:${number}` | `component:${number}`;

interface AddWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: { id: number }) => void;
}

const AddWorkOrderDialog: React.FC<AddWorkOrderDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [workOrderTypeId, setWorkOrderTypeId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [factoryId, setFactoryId] = useState<string>('');
  const [target, setTarget] = useState<TargetValue>('none');
  const [accountId, setAccountId] = useState<string>('__none__');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [createOrder, { isLoading }] = useCreateWorkOrderMutation();
  const { markFactoryEdited } = useAutoSelectGlobalFactory(open, setFactoryId);
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 }, { skip: !open });
  const { data: allMachines = [] } = useGetMachinesQuery({ skip: 0, limit: 500 }, { skip: !open });
  const { data: projectComponents = [] } = useGetProjectComponentsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: accounts = [] } = useGetAccountsQuery(
    { skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX },
    { skip: !open }
  );

  const machinesForFactory = allMachines.filter((m) => m.factory_id === (factoryId ? parseInt(factoryId, 10) : -1));

  const reset = () => {
    setWorkOrderTypeId('');
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setFactoryId('');
    setTarget('none');
    setAccountId('__none__');
    setStartDate('');
    setEndDate('');
    setCost('');
    setAssignedTo('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fid = parseInt(factoryId, 10);
    if (isNaN(fid) || !factoryId) {
      toast.error('Select a factory');
      return;
    }
    if (!title.trim()) {
      toast.error('Enter a title');
      return;
    }
    if (!workOrderTypeId) {
      toast.error('Select a work order type');
      return;
    }

    const [targetKind, targetId] = target === 'none' ? [null, null] : target.split(':');

    try {
      const result = await createOrder({
        work_order_type_id: Number(workOrderTypeId),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        factory_id: fid,
        machine_id: targetKind === 'machine' ? Number(targetId) : undefined,
        project_component_id: targetKind === 'component' ? Number(targetId) : undefined,
        uses_inventory: true,
        account_id: accountId !== '__none__' ? parseInt(accountId, 10) : undefined,
        planned_date: startDate || undefined,
        end_date: endDate || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        assigned_to: assignedTo.trim() || undefined,
      }).unwrap();
      toast.success('Work order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create work order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Work Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Work order title" required />
          </div>
          <div>
            <Label>Work type *</Label>
            <Select value={workOrderTypeId || '__none__'} onValueChange={(v) => setWorkOrderTypeId(v === '__none__' ? '' : v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select type…</SelectItem>
                {workOrderTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as WorkOrderPriority)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_ORDER_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {priorityLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Factory *</Label>
            <Select
              value={factoryId || '__none__'}
              onValueChange={(v) => {
                markFactoryEdited();
                setFactoryId(v === '__none__' ? '' : v);
                setTarget('none');
              }}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select factory…</SelectItem>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name} ({f.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as TargetValue)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="What is this work for? (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No target (general work)</SelectItem>
                {machinesForFactory.map((m) => (
                  <SelectItem key={`machine:${m.id}`} value={`machine:${m.id}`}>
                    Machine: {m.name}
                  </SelectItem>
                ))}
                {projectComponents.map((c) => (
                  <SelectItem key={`component:${c.id}`} value={`component:${c.id}`}>
                    Component: {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Billed account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Internal / free (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Internal / free</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Set this if an external account is doing the work and should be invoiced.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Planned date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Cost</Label>
            <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Assigned to</Label>
            <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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

export default AddWorkOrderDialog;
