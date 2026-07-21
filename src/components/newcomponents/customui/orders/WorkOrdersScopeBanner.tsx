import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface WorkOrdersScopeBannerProps {
  visible: boolean;
  machineLabel?: string | null;
  factoryLabel?: string | null;
  orderCount: number;
  onClear: () => void;
}

const WorkOrdersScopeBanner: React.FC<WorkOrdersScopeBannerProps> = ({
  visible,
  machineLabel,
  factoryLabel,
  orderCount,
  onClear,
}) => {
  if (!visible) return null;

  const parts: string[] = [];
  if (machineLabel) parts.push(machineLabel);
  if (factoryLabel) parts.push(factoryLabel);
  parts.push(`${orderCount} work order${orderCount === 1 ? '' : 's'}`);

  return (
    <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-muted-foreground">{parts.join(' · ')}</span>
      <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2" onClick={onClear}>
        <X className="mr-1 h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
};

export default WorkOrdersScopeBanner;
