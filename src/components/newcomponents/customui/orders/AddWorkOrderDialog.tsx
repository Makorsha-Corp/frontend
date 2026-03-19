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
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import type { WorkType, WorkOrderPriority } from '@/types/workOrder';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const WORK_TYPES: WorkType[] = ['MAINTENANCE', 'INSPECTION', 'INSTALLATION', 'REPAIR', 'CALIBRATION', 'OVERHAUL', 'FABRICATION', 'OTHER'];
const PRIORITIES: WorkOrderPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface AddWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: { id: number }) => void;
}

const AddWorkOrderDialog: React.FC<AddWorkOrderDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [workType, setWorkType] = useState<WorkType>('MAINTENANCE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [factoryId, setFactoryId] = useState<string>('');
  const [machineId, setMachineId] = useState<string>('__none__');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  const [createOrder, { isLoading }] = useCreateWorkOrderMutation();
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 }, { skip: !open });
  const { data: sections = [] } = useGetFactorySectionsQuery(
    { factory_id: factoryId ? parseInt(factoryId, 10) : 0, limit: 100 },
    { skip: !open || !factoryId }
  );
  const { data: allMachines = [] } = useGetMachinesQuery({ skip: 0, limit: 500 }, { skip: !open });

  const sectionIds = new Set(sections.map((s) => s.id));
  const machinesForFactory = allMachines.filter((m) => sectionIds.has(m.factory_section_id));

  const reset = () => {
    setWorkType('MAINTENANCE');
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setFactoryId('');
    setMachineId('__none__');
    setStartDate('');
    setEndDate('');
    setCost('');
    setAssignedTo('');
    setNotes('');
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

    try {
      const result = await createOrder({
        work_type: workType,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        factory_id: fid,
        machine_id: machineId && machineId !== '__none__' ? parseInt(machineId, 10) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        assigned_to: assignedTo.trim() || undefined,
        notes: notes.trim() || undefined,
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
            <Label>Work type</Label>
            <Select value={workType} onValueChange={(v) => setWorkType(v as WorkType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Factory *</Label>
            <Select value={factoryId} onValueChange={(v) => { setFactoryId(v); setMachineId('__none__'); }} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name} ({f.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Machine</Label>
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select machine (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {machinesForFactory.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start date</Label>
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
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
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
