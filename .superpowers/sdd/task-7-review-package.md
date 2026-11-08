# Task 7 package

## dialog

`	sx
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateProductionBatchProgramMutation,
  useGetFormulaStagesQuery,
  useGetProductionBatchProgramsQuery,
  useGetProductionFormulasQuery,
  useStopProductionBatchProgramMutation,
} from '@/features/production/productionApi';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import { appToast } from '@/lib/appToast';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';
import type { ProductionBatchProgram, ProductionFormulaStage } from '@/types/production';
import { apiErrorDetail } from '@/utils/apiError';

const MISSING_DURATION_CONFIRM =
  'Some steps have no duration. They will start at the same time as the previous step.';

const CADENCE_LABEL: Record<ProductionBatchProgram['cadence'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

interface ProductionScheduleProgramsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number;
}

function formatProgramStart(iso: string, use24Hour: boolean): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return iso;
  const hm = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
  return `${format(when, 'MMM d, yyyy')} ${formatWallTimeHm(hm, use24Hour)}`;
}

function formatEndDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return format(new Date(year, month - 1, day), 'MMM d, yyyy');
}

function stagesMissingDuration(stages: ProductionFormulaStage[]): boolean {
  return stages.some((stage) => stage.expected_duration_minutes == null);
}

export function ProductionScheduleProgramsDialog({
  open,
  onOpenChange,
  factoryId,
}: ProductionScheduleProgramsDialogProps) {
  const { use24Hour } = useUserTimeFormat();
  const [formulaId, setFormulaId] = useState('');
  const [firstStart, setFirstStart] = useState('');
  const [cadence, setCadence] = useState<ProductionBatchProgram['cadence']>('daily');
  const [endDate, setEndDate] = useState('');
  const [stoppingId, setStoppingId] = useState<number | null>(null);

  const formulaIdNum = formulaId ? Number(formulaId) : 0;

  const { data: programs = [], isLoading: loadingPrograms, error: programsError } =
    useGetProductionBatchProgramsQuery({ factory_id: factoryId }, { skip: !open });
  const { data: formulas = [], isLoading: loadingFormulas } = useGetProductionFormulasQuery(
    { skip: 0, limit: 100, active_only: false },
    { skip: !open },
  );
  const stagesQuery = useGetFormulaStagesQuery(formulaIdNum, { skip: !open || !formulaIdNum });
  const stages = stagesQuery.data ?? [];

  const [createProgram, { isLoading: creating }] = useCreateProductionBatchProgramMutation();
  const [stopProgram] = useStopProductionBatchProgramMutation();

  const recipes = useMemo(
    () =>
      formulas
        .filter((formula) => formula.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [formulas],
  );

  const formulaNameById = useMemo(() => {
    const names = new Map<number, string>();
    for (const formula of formulas) names.set(formula.id, formula.name);
    return names;
  }, [formulas]);

  const stagesPending =
    Boolean(formulaIdNum) && (stagesQuery.isLoading || stagesQuery.isFetching || stagesQuery.isError);
  const canSave = Boolean(formulaId && firstStart.trim() && endDate.trim()) && !stagesPending && !creating;

  function resetForm() {
    setFormulaId('');
    setFirstStart('');
    setCadence('daily');
    setEndDate('');
  }

  async function handleSave() {
    if (!formulaId || !firstStart.trim() || !endDate.trim() || creating || stagesPending) return;
    if (stagesMissingDuration(stages)) {
      const confirmed = window.confirm(MISSING_DURATION_CONFIRM);
      if (!confirmed) return;
    }
    const start = new Date(firstStart);
    if (Number.isNaN(start.getTime())) {
      appToast.error('First start is not a valid date');
      return;
    }
    try {
      await createProgram({
        factory_id: factoryId,
        formula_id: Number(formulaId),
        first_start_at: start.toISOString(),
        cadence,
        end_date: endDate,
      }).unwrap();
      appToast.success('Recurring program created');
      resetForm();
    } catch (error) {
      appToast.error(apiErrorDetail(error, 'Failed to create program'));
    }
  }

  async function handleStop(programId: number) {
    if (stoppingId != null) return;
    setStoppingId(programId);
    try {
      await stopProgram(programId).unwrap();
      appToast.success('Program stopped');
    } catch (error) {
      appToast.error(apiErrorDetail(error, 'Failed to stop program'));
    } finally {
      setStoppingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(42rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Recurring programs</DialogTitle>
          <DialogDescription>
            Create a repeating run of a recipe. Stop a program to cancel its draft batches.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-0.5">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Programs</h3>
            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading programs
              </div>
            ) : programsError ? (
              <p className="text-sm text-destructive">{apiErrorDetail(programsError, 'Failed to load programs')}</p>
            ) : programs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No programs for this factory.</p>
            ) : (
              <ul className="space-y-2">
                {programs.map((program) => (
                  <li
                    key={program.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">
                        {formulaNameById.get(program.formula_id) ?? `Recipe #${program.formula_id}`}
                      </p>
                      <p className="text-muted-foreground">
                        {CADENCE_LABEL[program.cadence] ?? program.cadence}
                        {' · '}
                        {formatProgramStart(program.first_start_at, use24Hour)}
                        {' – '}
                        {formatEndDate(program.end_date)}
                      </p>
                      <p className="text-muted-foreground">
                        {program.status === 'active' ? 'Active' : 'Stopped'}
                        {' · '}
                        {program.batch_count} {program.batch_count === 1 ? 'batch' : 'batches'}
                      </p>
                    </div>
                    {program.status === 'active' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={stoppingId != null}
                        onClick={() => void handleStop(program.id)}
                      >
                        {stoppingId === program.id ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Stop
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <h3 className="text-sm font-medium sm:col-span-2">New program</h3>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="program-recipe">Recipe</Label>
              <Select value={formulaId || undefined} onValueChange={setFormulaId} disabled={loadingFormulas}>
                <SelectTrigger id="program-recipe">
                  <SelectValue placeholder={loadingFormulas ? 'Loading recipes' : 'Select a recipe'} />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map((formula) => (
                    <SelectItem key={formula.id} value={String(formula.id)}>
                      {formula.name} ({formula.formula_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {stagesQuery.isError ? (
                <p className="text-xs text-destructive">
                  {apiErrorDetail(stagesQuery.error, 'Failed to load recipe steps')}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program-first-start">First start</Label>
              <Input
                id="program-first-start"
                type="datetime-local"
                value={firstStart}
                onChange={(event) => setFirstStart(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program-cadence">Cadence</Label>
              <Select
                value={cadence}
                onValueChange={(value) => setCadence(value as ProductionBatchProgram['cadence'])}
              >
                <SelectTrigger id="program-cadence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program-end-date">End date</Label>
              <Input
                id="program-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </section>
        </div>
        <DialogFooter className="shrink-0">
          <Button type="button" onClick={() => void handleSave()} disabled={!canSave}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

`

## src/features/production/productionApi.ts hits

### 20
`
19:   ProductionRoute, ProductionRouteStep, ProductionScheduleBatch, StageLogScheduleMoveResponse, LinkedProductionOrder,
20:   ProductionBatchProgram, CreateProductionBatchProgramDTO,
21:   ProductionOverviewStats,
22:   ProductionBatchActivityStats,
23: } from '@/types/production';
24: 
25: export interface ListProductionLinesParams {
26:   skip?: number;
`

### 88
`
87:   baseQuery: baseQueryWithReauth,
88:   tagTypes: ['ProductionLine', 'ProductionFormula', 'FormulaStage', 'FormulaStageItem', 'FormulaStageParameter', 'ProductionBatch', 'BatchItem', 'BatchStageParameter', 'BatchStageItem', 'BatchStageLog', 'BatchEvent', 'ProductionBatchStats', 'ProductionRoute', 'ProductionSchedule', 'ProductionBatchProgram'],
89:   endpoints: (builder) => ({
90:     // ─── Production Lines ────────────────────────────────────────
91: 
92:     getProductionLines: builder.query<ProductionLine[], ListProductionLinesParams>({
93:       query: (params = {}) => {
94:         const searchParams = new URLSearchParams();
`

### 726
`
725:     }),
726:     getProductionBatchPrograms: builder.query<ProductionBatchProgram[], { factory_id: number }>({
727:       query: ({ factory_id }) => {
728:         const params = new URLSearchParams({ factory_id: String(factory_id) });
729:         return `production-batch-programs/?${params.toString()}`;
730:       },
731:       providesTags: ['ProductionBatchProgram'],
732:     }),
`

### 733
`
732:     }),
733:     createProductionBatchProgram: builder.mutation<ProductionBatchProgram, CreateProductionBatchProgramDTO>({
734:       query: (body) => ({
735:         url: 'production-batch-programs/',
736:         method: 'POST',
737:         body,
738:       }),
739:       invalidatesTags: ['ProductionSchedule', 'ProductionBatchProgram', 'ProductionBatch', 'ProductionBatchStats'],
`

### 741
`
740:     }),
741:     stopProductionBatchProgram: builder.mutation<ProductionBatchProgram, number>({
742:       query: (id) => ({
743:         url: `production-batch-programs/${id}/stop/`,
744:         method: 'POST',
745:       }),
746:       invalidatesTags: ['ProductionSchedule', 'ProductionBatchProgram', 'ProductionBatch', 'ProductionBatchStats'],
747:     }),
`

### 898
`
897:   useGetProductionScheduleQuery,
898:   useGetProductionBatchProgramsQuery,
899:   useCreateProductionBatchProgramMutation,
900:   useStopProductionBatchProgramMutation,
901:   useMoveStageLogOnScheduleMutation,
902:   useGetLinkedProductionOrdersQuery,
903:   useGetProductionRoutesQuery,
904:   useGetProductionRouteByIdQuery,
`

## src/types/production.ts hits

### 96
`
95:   machine_id?: number;
96:   expected_duration_minutes?: number;
97:   expected_output_quantity?: number;
98: }
99: 
100: export interface ProductionBatchItemSeedDTO {
101:   item_id: number;
102:   item_role: 'input' | 'output' | 'waste' | 'byproduct';
`

### 161
`
160: 
161: export interface ProductionBatchProgram {
162:   id: number;
163:   workspace_id: number;
164:   factory_id: number;
165:   formula_id: number;
166:   first_start_at: string;
167:   cadence: 'daily' | 'weekly' | 'monthly';
`

### 175
`
174: 
175: export interface CreateProductionBatchProgramDTO {
176:   factory_id: number;
177:   formula_id: number;
178:   first_start_at: string;
179:   cadence: 'daily' | 'weekly' | 'monthly';
180:   end_date: string;
181: }
`

### 212
`
211:   machine_id: number | null;
212:   expected_duration_minutes: number | null;
213:   expected_output_quantity: number | null;
214:   expected_output_item_id: number | null;
215:   notes: string | null;
216:   route_step_id?: number | null;
217:   is_used?: boolean;
218: }
`

### 226
`
225:   machine_id?: number;
226:   expected_duration_minutes?: number;
227:   expected_output_quantity?: number;
228:   expected_output_item_id?: number;
229:   notes?: string;
230: }
231: 
232: export interface UpdateProductionFormulaStageDTO {
`

### 237
`
236:   machine_id?: number | null;
237:   expected_duration_minutes?: number | null;
238:   expected_output_quantity?: number | null;
239:   expected_output_item_id?: number | null;
240:   notes?: string | null;
241:   is_used?: boolean;
242: }
243: 
`

### 361
`
360:   route_step_id?: number | null;
361:   expected_duration_minutes?: number | null;
362:   expected_output_quantity?: number | null;
363:   rework_quantity?: number | null;
364:   rework_of_log_id?: number | null;
365:   actual_duration_minutes?: number | null;
366:   yield_pct?: number | null;
367:   time_efficiency_pct?: number | null;
`

### 395
`
394:   machine_id?: number | null;
395:   expected_duration_minutes?: number | null;
396:   status?: BatchStageLogStatus;
397:   started_at?: string | null;
398:   completed_at?: string | null;
399:   input_quantity?: number | null;
400:   output_quantity?: number | null;
401:   waste_quantity?: number | null;
`

### 426
`
425:   expected_output_quantity: number | null;
426:   expected_duration_minutes: number | null;
427:   actual_output_quantity: number | null;
428:   actual_duration_minutes: number | null;
429:   actual_start_time: string | null;
430:   actual_end_time: string | null;
431:   output_variance_quantity: number | null;
432:   /** API may serialize Numeric as string */
`

### 459
`
458:   expected_output_quantity?: number;
459:   expected_duration_minutes?: number;
460:   notes?: string;
461:   stage_seeds?: ProductionBatchStageSeedDTO[];
462:   item_seeds?: ProductionBatchItemSeedDTO[];
463:   parameter_seeds?: ProductionBatchStageParameterSeedDTO[];
464: }
465: 
`

### 475
`
474:   expected_output_quantity?: number;
475:   expected_duration_minutes?: number;
476:   actual_output_quantity?: number;
477:   actual_duration_minutes?: number;
478:   notes?: string;
479: }
480: 
481: export interface StartBatchDTO {
`

## src/components/newcomponents/customui/production/ProductionScheduleTab.tsx hits

### 10
`
9: import { ProductionScheduleDayDialog } from '@/components/newcomponents/customui/production/ProductionScheduleDayDialog';
10: import { ProductionScheduleProgramsDialog } from '@/components/newcomponents/customui/production/ProductionScheduleProgramsDialog';
11: import ProductionScheduleWeekPicker from '@/components/newcomponents/customui/production/ProductionScheduleWeekPicker';
12: import {
13:   scheduleStepCardText,
14:   scheduleStepsForCell,
15: } from '@/components/newcomponents/customui/production/scheduleWeekBoard';
16: import {
`

### 90
`
89:             <Button type="button" variant="outline" size="sm" onClick={() => setProgramsOpen(true)}>
90:               Recurring programs
91:             </Button>
92:           ) : null}
93:           <ProductionScheduleWeekPicker
94:             weekAnchorIso={weekAnchorIso}
95:             onWeekAnchorChange={setWeekAnchorIso}
96:             planCountByDate={hasFactory ? planCountByDate : undefined}
`

### 207
`
206:       {factoryId != null ? (
207:         <ProductionScheduleProgramsDialog
208:           open={programsOpen}
209:           onOpenChange={setProgramsOpen}
210:           factoryId={factoryId}
211:         />
212:       ) : null}
213: 
`
