# Task 6 package

## ProductionScheduleDayDialog.tsx

`	sx
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { machinesForLine } from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import { scheduleStepStatusLabel, scheduleStepsForDay } from '@/components/newcomponents/customui/production/scheduleWeekBoard';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';
import type { ProductionLine, ProductionScheduleBatch, ProductionScheduleStep } from '@/types/production';

interface ProductionScheduleDayDialogProps {
  day: Date | null;
  batches: ProductionScheduleBatch[];
  lines: ProductionLine[];
  onOpenChange: (open: boolean) => void;
  onOpenBatch: (batchId: number) => void;
  onAddBatch: (day: Date) => void;
}

function wallClock(iso: string, use24Hour: boolean): string {
  const when = new Date(iso);
  const hm = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
  return formatWallTimeHm(hm, use24Hour);
}

function machineNameOnStep(step: ProductionScheduleStep, lines: ProductionLine[]): string | null {
  if (step.machine_id == null) return null;
  const line = lines.find((row) => row.id === step.production_line_id);
  const match = machinesForLine(line).find((machine) => machine.id === step.machine_id);
  if (!match) return null;
  if (match.name === `Machine #${match.id}`) return null;
  return match.name;
}

export function ProductionScheduleDayDialog({
  day,
  batches,
  lines,
  onOpenChange,
  onOpenBatch,
  onAddBatch,
}: ProductionScheduleDayDialogProps) {
  const { use24Hour } = useUserTimeFormat();
  const rows = day ? scheduleStepsForDay(batches, day) : [];
  const title = day ? format(day, 'EEE dd.MM.yyyy') : '';

  return (
    <Dialog open={day != null} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(42rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Steps planned on this day.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No planned steps this day.</p>
          ) : (
            <ul className="space-y-1">
              {rows.map(({ batch, step }) => {
                const line = lines.find((row) => row.id === step.production_line_id);
                const lineLabel = line?.name ?? 'Unassigned';
                const showStepName = line ? step.stage_name !== line.name : Boolean(step.stage_name);
                const machineName = machineNameOnStep(step, lines);
                const status = scheduleStepStatusLabel(batch.status, step.status);
                return (
                  <li key={step.stage_log_id}>
                    <button
                      type="button"
                      className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                      onClick={() => {
                        onOpenBatch(batch.batch_id);
                        onOpenChange(false);
                      }}
                    >
                      <span className="text-muted-foreground">
                        {wallClock(step.planned_start_at, use24Hour)}–{wallClock(step.planned_end_at, use24Hour)}
                      </span>
                      <span>{lineLabel}</span>
                      <span className="font-medium">{batch.batch_number}</span>
                      {showStepName ? <span className="text-muted-foreground">{step.stage_name}</span> : null}
                      {machineName ? <span className="text-muted-foreground">{machineName}</span> : null}
                      {status ? <span className="text-muted-foreground">{status}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            onClick={() => {
              if (!day) return;
              onAddBatch(day);
              onOpenChange(false);
            }}
          >
            Add batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

`

## src/components/newcomponents/customui/production/ProductionScheduleTab.tsx matching lines

### around 8

`
6: import type { ProductionLine, ProductionScheduleBatch } from '@/types/production';
7: import { cn } from '@/lib/utils';
8: import { ProductionScheduleDayDialog } from '@/components/newcomponents/customui/production/ProductionScheduleDayDialog';
9: import ProductionScheduleWeekPicker from '@/components/newcomponents/customui/production/ProductionScheduleWeekPicker';
10: import {
11:   scheduleStepCardText,
12:   scheduleStepsForCell,
13: } from '@/components/newcomponents/customui/production/scheduleWeekBoard';
14: import {
15:   buildProductionScheduleWeekRange,
16:   productionScheduleTodayWeekAnchor,
`

### around 11

`
9: import ProductionScheduleWeekPicker from '@/components/newcomponents/customui/production/ProductionScheduleWeekPicker';
10: import {
11:   scheduleStepCardText,
12:   scheduleStepsForCell,
13: } from '@/components/newcomponents/customui/production/scheduleWeekBoard';
14: import {
15:   buildProductionScheduleWeekRange,
16:   productionScheduleTodayWeekAnchor,
17: } from '@/components/newcomponents/customui/production/productionScheduleWeek';
18: import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
19: import { format } from 'date-fns';
`

### around 12

`
10: import {
11:   scheduleStepCardText,
12:   scheduleStepsForCell,
13: } from '@/components/newcomponents/customui/production/scheduleWeekBoard';
14: import {
15:   buildProductionScheduleWeekRange,
16:   productionScheduleTodayWeekAnchor,
17: } from '@/components/newcomponents/customui/production/productionScheduleWeek';
18: import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
19: import { format } from 'date-fns';
20: import type { Factory } from '@/types/factory';
`

### around 33

`
31:   scheduleBatches?: ProductionScheduleBatch[];
32:   onCreateOnCell?: (lineId: number, day: Date) => void;
33:   onCreateOnDay?: (day: Date) => void;
34:   onOpenBatch?: (batchId: number) => void;
35: }
36: 
37: const ProductionScheduleTab: React.FC<ProductionScheduleTabProps> = ({
38:   factoryId,
39:   factories = [],
40:   isLoadingFactories = false,
41:   onSelectFactory,
`

### around 44

`
42:   lines,
43:   onCreateOnCell,
44:   onCreateOnDay,
45:   onOpenBatch,
46: }) => {
47:   const hasFactory = factoryId != null;
48:   const { data: workspaceShifts = [] } = useGetWorkspaceShiftsQuery({ activeOnly: true });
49:   const { use24Hour } = useUserTimeFormat();
50:   const [dayDialog, setDayDialog] = useState<Date | null>(null);
51: 
52:   const [weekAnchorIso, setWeekAnchorIso] = useState(productionScheduleTodayWeekAnchor);
`

### around 50

`
48:   const { data: workspaceShifts = [] } = useGetWorkspaceShiftsQuery({ activeOnly: true });
49:   const { use24Hour } = useUserTimeFormat();
50:   const [dayDialog, setDayDialog] = useState<Date | null>(null);
51: 
52:   const [weekAnchorIso, setWeekAnchorIso] = useState(productionScheduleTodayWeekAnchor);
53: 
54:   const range = useMemo(
55:     () => buildProductionScheduleWeekRange(weekAnchorIso),
56:     [weekAnchorIso],
57:   );
58: 
`

### around 110

`
108:               type="button"
109:               className="border-b border-border px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
110:               onClick={() => setDayDialog(day)}
111:             >
112:               {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
113:             </button>
114:           ))}
115:           {lines.map((line) => (
116:             <React.Fragment key={line.id}>
117:               <div className="border-b border-border py-2 pr-2 text-sm font-medium">{line.name}</div>
118:               {range.days.map((day) => {
`

### around 119

`
117:               <div className="border-b border-border py-2 pr-2 text-sm font-medium">{line.name}</div>
118:               {range.days.map((day) => {
119:                 const blocks = scheduleStepsForCell(scheduleBatches, line.id, day);
120:                 const canCreate = Boolean(onCreateOnCell);
121:                 return (
122:                   <div
123:                     key={day.toISOString()}
124:                     className={cn(
125:                       'relative min-h-12 border-b border-l border-border p-1',
126:                       canCreate && 'group/cell',
127:                       canCreate && blocks.length === 0 && 'cursor-pointer hover:bg-muted/40',
`

### around 134

`
132:                   >
133:                     {blocks.map(({ batch, step }) => {
134:                       const card = scheduleStepCardText(
135:                         step,
136:                         batch.batch_number,
137:                         workspaceShifts,
138:                         use24Hour,
139:                       );
140:                       return (
141:                         <div
142:                           key={step.stage_log_id}
`

### around 171

`
169:                       <button
170:                         type="button"
171:                         className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded border border-border/80 bg-background/90 text-muted-foreground opacity-0 shadow-sm hover:text-foreground group-hover/cell:opacity-100 focus-visible:opacity-100"
172:                         aria-label="New run on this line and day"
173:                         onClick={(e) => {
174:                           e.stopPropagation();
175:                           onCreateOnCell!(line.id, day);
176:                         }}
177:                       >
178:                         <Plus className="h-3 w-3" aria-hidden />
179:                       </button>
`

### around 194

`
192:       </div>
193: 
194:       <ProductionScheduleDayDialog
195:         day={dayDialog}
196:         batches={scheduleBatches}
197:         lines={lines}
198:         onOpenChange={(open) => {
199:           if (!open) setDayDialog(null);
200:         }}
201:         onOpenBatch={(batchId) => onOpenBatch?.(batchId)}
202:         onAddBatch={(day) => onCreateOnDay?.(day)}
`

### around 199

`
197:         lines={lines}
198:         onOpenChange={(open) => {
199:           if (!open) setDayDialog(null);
200:         }}
201:         onOpenBatch={(batchId) => onOpenBatch?.(batchId)}
202:         onAddBatch={(day) => onCreateOnDay?.(day)}
203:       />
204:     </>
205:   );
206: };
207: 
`

### around 202

`
200:         }}
201:         onOpenBatch={(batchId) => onOpenBatch?.(batchId)}
202:         onAddBatch={(day) => onCreateOnDay?.(day)}
203:       />
204:     </>
205:   );
206: };
207: 
208: export default ProductionScheduleTab;
`

## src/pages/newpages/ProductionPage.tsx matching lines

### around 1190

`
1188:                   setIsAddBatchOpen(true);
1189:                 }}
1190:                 onCreateOnDay={(day) => {
1191:                   setScheduleCreateSeed({ day: new Date(day) });
1192:                   setIsAddBatchOpen(true);
1193:                 }}
1194:                 onOpenBatch={(batchId) => setSelectedBatchId(batchId)}
1195:               />
1196:             </TabsContent>
1197:           </div>
1198:         </Tabs>
`
