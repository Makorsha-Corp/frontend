import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, Plus, Sparkles } from 'lucide-react';
import type { MachineDayChecklist } from '@/pages/newpages/orders/workOrderSheetData';
import { cn } from '@/lib/utils';

export interface SheetMachineDayChecklistProps {
  checklist: MachineDayChecklist;
  onLogMachine?: (machineId: number) => void;
  onGenerateDay?: () => void;
  isGenerating?: boolean;
  showGenerate?: boolean;
}

const SheetMachineDayChecklist: React.FC<SheetMachineDayChecklistProps> = ({
  checklist,
  onLogMachine,
  onGenerateDay,
  isGenerating,
  showGenerate,
}) => {
  const { entries, loggedCount, totalCount } = checklist;

  return (
    <div className="space-y-3 px-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Machine log status</p>
          <p className="text-xs text-muted-foreground">
            {loggedCount}/{totalCount} machines logged for this day
          </p>
        </div>
        {showGenerate && onGenerateDay && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={onGenerateDay}
          >
            {isGenerating ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3.5 w-3.5" />
            )}
            Generate today&apos;s drafts
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Select a factory and section to see machines for this day.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-md border border-border/60">
          {entries.map((entry) => (
            <li
              key={entry.machineId}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2',
                entry.logged ? 'bg-muted/20' : 'bg-background',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {entry.logged ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                )}
                <span className="truncate text-sm">{entry.machineName}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 text-[10px] font-normal',
                    entry.logged
                      ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {entry.logged ? 'Logged' : 'Missing'}
                </Badge>
              </div>
              {!entry.logged && onLogMachine && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 text-xs"
                  onClick={() => onLogMachine(entry.machineId)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Log
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SheetMachineDayChecklist;
