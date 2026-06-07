import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/purchaseOrder';
import {
  PO_MILESTONES,
  derivePurchaseOrderMilestones,
  type PoMilestoneState,
} from './purchaseOrderMilestones';

export interface PurchaseOrderMilestoneTrackerProps {
  order: PurchaseOrder;
  items: PurchaseOrderItem[];
  className?: string;
}

function circleClasses(state: PoMilestoneState): string {
  if (state === 'complete') {
    return 'h-7 w-7 bg-brand-primary text-white ring-2 ring-brand-primary/20';
  }
  if (state === 'partial') {
    return 'h-7 w-7 bg-brand-primary/70 text-white ring-2 ring-brand-primary/20';
  }
  return 'h-7 w-7 border-2 border-muted-foreground/30 bg-background';
}

function labelClasses(state: PoMilestoneState): string {
  return cn(
    'mt-1 text-center text-[10px] leading-tight whitespace-nowrap',
    state === 'complete' && 'font-semibold text-brand-primary',
    state === 'partial' && 'font-medium text-brand-primary/80',
    state === 'pending' && 'text-muted-foreground/70'
  );
}

const CONFIRM_MILESTONE_LABELS = new Set(['Order details', 'Supplier', 'Items']);

function MilestoneCircle({ state, label }: { state: PoMilestoneState; label: string }) {
  const title =
    state === 'complete' && CONFIRM_MILESTONE_LABELS.has(label)
      ? `${label} confirmed`
      : `${label}: ${state}`;

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full', circleClasses(state))}
      title={title}
    >
      {state === 'complete' && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
    </div>
  );
}

const PurchaseOrderMilestoneTracker: React.FC<PurchaseOrderMilestoneTrackerProps> = ({
  order,
  items,
  className,
}) => {
  const states = derivePurchaseOrderMilestones(order, items);

  return (
    <div className={cn('flex w-full min-w-[11rem] items-center', className)}>
      {PO_MILESTONES.map((milestone, index) => {
        const state = states[milestone.id];
        return (
          <React.Fragment key={milestone.id}>
            <div className="flex shrink-0 flex-col items-center">
              <MilestoneCircle state={state} label={milestone.label} />
              <span className={labelClasses(state)}>{milestone.shortLabel}</span>
            </div>
            {index < PO_MILESTONES.length - 1 && (
              <div className="mx-1.5 mb-4 h-px min-w-2 flex-1 self-center bg-muted-foreground/20" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PurchaseOrderMilestoneTracker;
