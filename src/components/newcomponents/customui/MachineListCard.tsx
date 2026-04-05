import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { Machine, MachineEvent } from '@/types/machine';
import { Cog, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  brandIconGlyphClass,
  brandIconTileClass,
  getMachineVisualKind,
  getMachineStatusLabel,
  machineTopBarClass,
  machineBadgeClass,
} from '@/lib/machineVisualStatus';
import { useGetLatestMachineEventQuery } from '@/features/machines/machinesApi';

export interface MachineListCardProps {
  machine: Machine;
  selected: boolean;
  onSelect: () => void;
  /** When set (e.g. from latest-event API), maintenance vs idle/off is shown correctly. */
  latestEvent?: MachineEvent | null;
}

export const MachineListCard: React.FC<MachineListCardProps> = ({
  machine,
  selected,
  onSelect,
  latestEvent,
}) => {
  const kind = getMachineVisualKind(machine, latestEvent);
  const label = getMachineStatusLabel(machine, latestEvent);

  return (
    <Card
      className={cn(
        'flex cursor-pointer flex-col border-border transition-all hover:border-brand-primary/30 hover:shadow-md group',
        selected && 'ring-2 ring-brand-primary ring-offset-2 ring-offset-background border-brand-primary'
      )}
      onClick={onSelect}
    >
      <div className={cn('h-1.5 shrink-0 rounded-t-lg', machineTopBarClass[kind])} aria-hidden />
      <CardHeader className="space-y-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={brandIconTileClass} aria-hidden>
              <Cog className={brandIconGlyphClass} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base font-semibold leading-snug text-card-foreground">
                {machine.name}
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', machineBadgeClass[kind])}>
                  {label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">#{machine.id}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-primary" />
        </div>
        {machine.model_number || machine.manufacturer ? (
          <p className="mt-2 truncate pl-[3.25rem] text-xs text-muted-foreground">
            {[machine.model_number, machine.manufacturer].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </CardHeader>
    </Card>
  );
};

/** Fetches latest machine event so maintenance (yellow) is distinct from idle/off (red). */
export const MachineListCardWithLatest: React.FC<
  Omit<MachineListCardProps, 'latestEvent'>
> = (props) => {
  const { data: latest } = useGetLatestMachineEventQuery(props.machine.id, {
    skip: !props.machine.id,
  });
  return <MachineListCard {...props} latestEvent={latest} />;
};

export default MachineListCard;
