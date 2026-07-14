import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAddBatchStageLogMutation,
  useUpdateBatchStageLogMutation,
} from '@/features/production/productionApi';
import type {
  BatchStageLogStatus,
  ProductionBatchStageLog,
  ProductionFormulaStage,
  ProductionLine,
} from '@/types/production';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGE_STATUSES: BatchStageLogStatus[] = ['pending', 'in_progress', 'completed', 'skipped'];

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoOrUndefined(local: string): string | undefined {
  if (!local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export interface BatchStageLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: number;
  lines: ProductionLine[];
  log?: ProductionBatchStageLog | null;
  formulaStages?: ProductionFormulaStage[];
  defaultStageOrder?: number;
}

const BatchStageLogDialog: React.FC<BatchStageLogDialogProps> = ({
  open,
  onOpenChange,
  batchId,
  lines,
  log,
  formulaStages = [],
  defaultStageOrder = 0,
}) => {
  const isEdit = !!log;
  const [addLog, { isLoading: isAdding }] = useAddBatchStageLogMutation();
  const [updateLog, { isLoading: isUpdating }] = useUpdateBatchStageLogMutation();

  const [stageName, setStageName] = useState('');
  const [formulaStageId, setFormulaStageId] = useState<string>('none');
  const [lineId, setLineId] = useState<string>('none');
  const [status, setStatus] = useState<BatchStageLogStatus>('in_progress');
  const [startedAt, setStartedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [inputQty, setInputQty] = useState('');
  const [outputQty, setOutputQty] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [notes, setNotes] = useState('');

  const selectedFormulaStage = useMemo(() => {
    if (formulaStageId === 'none') return null;
    return formulaStages.find((s) => s.id.toString() === formulaStageId) ?? null;
  }, [formulaStageId, formulaStages]);

  useEffect(() => {
    if (!open) return;
    if (log) {
      setStageName(log.stage_name);
      setFormulaStageId(log.formula_stage_id?.toString() ?? 'none');
      setLineId(log.production_line_id?.toString() ?? 'none');
      setStatus(log.status);
      setStartedAt(toLocalInputValue(log.started_at));
      setCompletedAt(toLocalInputValue(log.completed_at));
      setInputQty(log.input_quantity != null ? String(log.input_quantity) : '');
      setOutputQty(log.output_quantity != null ? String(log.output_quantity) : '');
      setWasteQty(log.waste_quantity != null ? String(log.waste_quantity) : '');
      setNotes(log.notes ?? '');
    } else {
      setStageName('');
      setFormulaStageId('none');
      setLineId('none');
      setStatus('in_progress');
      setStartedAt(toLocalInputValue(new Date().toISOString()));
      setCompletedAt('');
      setInputQty('');
      setOutputQty('');
      setWasteQty('');
      setNotes('');
    }
  }, [open, log]);

  useEffect(() => {
    if (!open || isEdit || formulaStageId === 'none' || !selectedFormulaStage) return;
    setStageName(selectedFormulaStage.name);
    if (selectedFormulaStage.production_line_id) {
      setLineId(selectedFormulaStage.production_line_id.toString());
    }
  }, [open, isEdit, formulaStageId, selectedFormulaStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = stageName.trim();
    if (!name) {
      toast.error('Stage name is required');
      return;
    }
    if (status === 'completed' && !outputQty.trim()) {
      toast.error('Output quantity required to complete stage (or mark skipped)');
      return;
    }

    const payload = {
      stage_name: name,
      production_line_id: lineId !== 'none' ? parseInt(lineId, 10) : undefined,
      status,
      started_at: toIsoOrUndefined(startedAt),
      completed_at: toIsoOrUndefined(completedAt),
      input_quantity: inputQty.trim() ? parseInt(inputQty, 10) : undefined,
      output_quantity: outputQty.trim() ? parseInt(outputQty, 10) : undefined,
      waste_quantity: wasteQty.trim() ? parseInt(wasteQty, 10) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit && log) {
        await updateLog({
          id: log.id,
          batchId,
          data: {
            ...payload,
            production_line_id: lineId !== 'none' ? parseInt(lineId, 10) : null,
            started_at: toIsoOrUndefined(startedAt) ?? null,
            completed_at: toIsoOrUndefined(completedAt) ?? null,
            input_quantity: inputQty.trim() ? parseInt(inputQty, 10) : null,
            output_quantity: outputQty.trim() ? parseInt(outputQty, 10) : null,
            waste_quantity: wasteQty.trim() ? parseInt(wasteQty, 10) : null,
            notes: notes.trim() || null,
          },
        }).unwrap();
        toast.success('Stage log updated');
      } else {
        await addLog({
          batchId,
          data: {
            batch_id: batchId,
            formula_stage_id: formulaStageId !== 'none' ? parseInt(formulaStageId, 10) : undefined,
            stage_order: defaultStageOrder,
            ...payload,
          },
        }).unwrap();
        toast.success('Stage logged');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to save stage log');
    }
  };

  const isSaving = isAdding || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(40rem,94vw)] max-w-none flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle>{isEdit ? 'Edit stage log' : 'Log production stage'}</DialogTitle>
          <DialogDescription>
            Manual stage record — does not move inventory. Use batch start/complete for ledger posting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {!isEdit && formulaStages.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="stage-template">From formula template (optional)</Label>
                <Select value={formulaStageId} onValueChange={setFormulaStageId}>
                  <SelectTrigger id="stage-template">
                    <SelectValue placeholder="Ad-hoc stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ad-hoc stage name</SelectItem>
                    {formulaStages.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.stage_order}. {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="stage-name">Stage name</Label>
              <Input
                id="stage-name"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="e.g. Blowroom, Ring spinning"
                required
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stage-line">Production line</Label>
                <Select value={lineId} onValueChange={setLineId}>
                  <SelectTrigger id="stage-line">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {lines.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BatchStageLogStatus)}>
                  <SelectTrigger id="stage-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stage-started">Started</Label>
                <Input
                  id="stage-started"
                  type="datetime-local"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage-completed">Completed</Label>
                <Input
                  id="stage-completed"
                  type="datetime-local"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="stage-in">Input qty</Label>
                <Input
                  id="stage-in"
                  type="number"
                  min={0}
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage-out">Output qty</Label>
                <Input
                  id="stage-out"
                  type="number"
                  min={0}
                  value={outputQty}
                  onChange={(e) => setOutputQty(e.target.value)}
                  placeholder={status === 'completed' ? 'Required' : 'Optional'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage-waste">Waste qty</Label>
                <Input
                  id="stage-waste"
                  type="number"
                  min={0}
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stage-notes">Notes</Label>
              <Textarea
                id="stage-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional — machine, operator, handoff details"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Save log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BatchStageLogDialog;
