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
import { useCreateMachineMaintenanceLogMutation } from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import type { MaintenanceType } from '@/types/machineMaintenanceLog';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MAINTENANCE_TYPES: MaintenanceType[] = ['PREVENTIVE', 'REPAIR', 'EMERGENCY', 'INSPECTION'];

interface AddMachineMaintenanceLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: number;
  machineName: string;
  onSuccess?: () => void;
}

const AddMachineMaintenanceLogDialog: React.FC<AddMachineMaintenanceLogDialogProps> = ({
  open,
  onOpenChange,
  machineId,
  machineName,
  onSuccess,
}) => {
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('REPAIR');
  const [maintenanceDate, setMaintenanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const [cost, setCost] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  const [createLog, { isLoading }] = useCreateMachineMaintenanceLogMutation();

  const reset = () => {
    setMaintenanceType('REPAIR');
    setMaintenanceDate(new Date().toISOString().slice(0, 10));
    setSummary('');
    setCost('');
    setPerformedBy('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error('Summary is required');
      return;
    }
    try {
      await createLog({
        machine_id: machineId,
        maintenance_type: maintenanceType,
        maintenance_date: maintenanceDate,
        summary: summary.trim(),
        cost: cost ? parseFloat(cost) : undefined,
        performed_by: performedBy.trim() || undefined,
      }).unwrap();
      toast.success('Maintenance log added');
      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add log');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Log – {machineName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={maintenanceType} onValueChange={(v) => setMaintenanceType(v as MaintenanceType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date *</Label>
            <Input type="date" value={maintenanceDate} onChange={(e) => setMaintenanceDate(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Summary *</Label>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What was done" required className="mt-1" />
          </div>
          <div>
            <Label>Cost</Label>
            <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Optional" className="mt-1" />
          </div>
          <div>
            <Label>Performed by</Label>
            <Input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Optional" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMachineMaintenanceLogDialog;
