import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import ProductionLineMachinesSelector from '@/components/newcomponents/customui/production/ProductionLineMachinesSelector';
import {
  formatMachineStatusSummary,
  lineMachineIds,
  type FactoryMachineOption,
} from '@/components/newcomponents/customui/production/StationMachinesField';
import { useGetProductionOverviewStatsQuery, useGetProductionScheduleQuery } from '@/features/production/productionApi';
import { buildMachineHref } from '@/lib/entityLinks';
import { productionLineHasMachines } from '@/lib/productionLineMachines';
import {
  getMachineStatusLabelFromBrief,
  machineStatusDotClass,
  machineVisualKindFromBrief,
} from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';
import type { ProductionLine } from '@/types/production';

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + delta);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function fmtPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

function fmtQty(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return String(value);
}

export interface ProductionLineDetailDialogProps {
  line: ProductionLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number | null;
  factoryMachineOptions: FactoryMachineOption[];
  onSave: (payload: { name: string; description: string; machineIds: number[] }) => void | Promise<void>;
  onDeactivate: (line: ProductionLine) => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const ProductionLineDetailDialog: React.FC<ProductionLineDetailDialogProps> = ({
  line,
  open,
  onOpenChange,
  factoryId,
  factoryMachineOptions,
  onSave,
  onDeactivate,
  isSaving = false,
  isDeleting = false,
}) => {
  const [tab, setTab] = useState<'overview' | 'setup'>('overview');
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftMachineIds, setDraftMachineIds] = useState<number[]>([]);

  useEffect(() => {
    if (!line || !open) return;
    setDraftName(line.name);
    setDraftDescription(line.description ?? '');
    setDraftMachineIds(lineMachineIds(line));
    setTab('overview');
  }, [line, open]);

  const scheduleRange = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const { data: overviewStats, isLoading: loadingOverview } = useGetProductionOverviewStatsQuery(
    {
      factory_id: factoryId!,
      production_line_id: line?.id,
    },
    { skip: !open || !line || factoryId == null },
  );

  const { data: scheduleBatches = [], isLoading: loadingSchedule } = useGetProductionScheduleQuery(
    {
      factory_id: factoryId ?? 0,
      start: scheduleRange.start,
      end: scheduleRange.end,
    },
    { skip: !open || !line || factoryId == null },
  );

  const lineStats = useMemo(() => {
    if (!line || !overviewStats?.lines?.length) return null;
    return (
      overviewStats.lines.find((row) => row.production_line_id === line.id) ?? overviewStats.lines[0]
    );
  }, [line, overviewStats]);

  const onLineNow = useMemo(() => {
    if (!line) return [];
    const rows: { batchNumber: string; stageName: string; status: string }[] = [];
    for (const batch of scheduleBatches) {
      if (batch.status !== 'in_progress') continue;
      for (const step of batch.steps) {
        if (step.production_line_id !== line.id) continue;
        rows.push({
          batchNumber: batch.batch_number,
          stageName: step.stage_name,
          status: batch.status,
        });
      }
    }
    return rows.slice(0, 5);
  }, [line, scheduleBatches]);

  const hasMachines = line ? productionLineHasMachines(line) : false;
  const statusLine = formatMachineStatusSummary(line?.machine_status_summary);

  const handleSave = () => {
    if (!draftName.trim()) return;
    void onSave({
      name: draftName.trim(),
      description: draftDescription.trim(),
      machineIds: draftMachineIds,
    });
  };

  const overviewSubtitle =
    line?.description?.trim() || (hasMachines && statusLine ? statusLine : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden p-6">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'overview' | 'setup')}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <DialogHeader className="shrink-0 space-y-0 text-left">
            <div className="flex items-start gap-4 pr-14">
              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="leading-tight">{line?.name ?? 'Production line'}</DialogTitle>
                {overviewSubtitle ? (
                  <DialogDescription className="line-clamp-2">{overviewSubtitle}</DialogDescription>
                ) : !hasMachines ? (
                  <DialogDescription className="text-amber-700 dark:text-amber-300">
                    No machines — add in Setup before recipes or batches.
                  </DialogDescription>
                ) : null}
              </div>
              <TabsList className="h-9 w-fit shrink-0">
                <TabsTrigger value="overview" className="px-3 text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="setup" className="px-3 text-sm">
                  Setup
                </TabsTrigger>
              </TabsList>
            </div>
          </DialogHeader>

          <TabsContent
            value="overview"
            className="mt-3 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
          >
            <div className="space-y-3 pr-1">
              <section className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Machines</h3>
                  {hasMachines && statusLine && line?.description?.trim() ? (
                    <span className="text-xs text-muted-foreground">{statusLine}</span>
                  ) : null}
                </div>
                {line?.machines?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {line.machines.map((machine) => (
                      <Link
                        key={machine.id}
                        to={buildMachineHref(machine.id)}
                        onClick={() => onOpenChange(false)}
                        title={`${getMachineStatusLabelFromBrief(machine)} — open on Machines`}
                        aria-label={`Open ${machine.name} on Machines page`}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/35 px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted/60 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            machineStatusDotClass[machineVisualKindFromBrief(machine)],
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{machine.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </section>

              <section className="space-y-1.5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Performance</h3>
                {loadingOverview ? (
                  <div className="flex py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                  </div>
                ) : lineStats ? (
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm tabular-nums">
                    <div className="flex gap-1.5">
                      <dt className="text-muted-foreground">Batches</dt>
                      <dd className="font-medium">{lineStats.batch_count}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-muted-foreground">Output</dt>
                      <dd className="font-medium">{fmtQty(lineStats.output_quantity)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-muted-foreground">Yield</dt>
                      <dd className="font-medium">{fmtPct(lineStats.yield_pct)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <section className="space-y-1.5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Now</h3>
                  {loadingSchedule ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                  ) : onLineNow.length > 0 ? (
                    <p className="text-sm leading-relaxed text-foreground">
                      {onLineNow.map((row, index) => (
                        <span key={`${row.batchNumber}-${row.stageName}-${index}`}>
                          {index > 0 ? <span className="text-muted-foreground"> · </span> : null}
                          <span className="font-medium">{row.batchNumber}</span>
                          <span className="text-muted-foreground"> ({row.stageName})</span>
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recipes</h3>
                  {loadingOverview ? null : lineStats?.recipes?.length ? (
                    <p className="text-sm leading-relaxed text-foreground">
                      {lineStats.recipes.map((recipe, index) => (
                        <span key={recipe.formula_id ?? recipe.recipe_name}>
                          {index > 0 ? <span className="text-muted-foreground"> · </span> : null}
                          {recipe.recipe_name}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="mt-3 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-3 pr-1">
              <div className="grid gap-1.5">
                <Label htmlFor="line-detail-name">Name</Label>
                <Input
                  id="line-detail-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="line-detail-description">Description</Label>
                <Textarea
                  id="line-detail-description"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Machines</Label>
                <ProductionLineMachinesSelector
                  factoryId={factoryId}
                  machines={factoryMachineOptions}
                  selectedIds={draftMachineIds}
                  onChange={setDraftMachineIds}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {tab === 'setup' ? (
          <DialogFooter className="shrink-0 gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => line && void onDeactivate(line)}
              disabled={isDeleting || !line}
            >
              {isDeleting ? 'Deactivating…' : 'Deactivate line'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving || !draftName.trim()}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        ) : (
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" variant="secondary" onClick={() => setTab('setup')}>
              Edit setup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductionLineDetailDialog;
