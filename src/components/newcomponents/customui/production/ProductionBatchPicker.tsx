import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useGetProductionBatchesQuery } from '@/features/production/productionApi';

interface ProductionBatchPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductionBatchPicker({ value, onChange }: ProductionBatchPickerProps) {
  const { data: batches = [] } = useGetProductionBatchesQuery({ limit: 100 });
  const openBatches = batches.filter(
    (batch) =>
      batch.status === 'draft' ||
      batch.status === 'recurring' ||
      batch.status === 'in_progress',
  );

  return (
    <div>
      <Label>Production batch</Label>
      <Select value={value || 'none'} onValueChange={(next) => onChange(next === 'none' ? '' : next)}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Optional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No batch</SelectItem>
          {openBatches.map((batch) => (
            <SelectItem key={batch.id} value={String(batch.id)}>
              {batch.batch_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
