import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PoTourShape } from '@/features/helpGuides/helpGuideTourShape';

export type HelpGuideTourBarProps = {
  jobs: readonly string[];
  activeIndex: number;
  doneCount: number;
  stepLabel?: string;
  text?: string;
  shape: PoTourShape;
  onShapeChange: (shape: PoTourShape) => void;
  onExit: () => void;
};

const SHAPE_OPTIONS: { id: PoTourShape; label: string }[] = [
  { id: 'docked', label: 'Panel' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'card', label: 'Card' },
];

export default function HelpGuideTourBar({
  jobs,
  activeIndex,
  doneCount,
  stepLabel,
  text,
  shape,
  onShapeChange,
  onExit,
}: HelpGuideTourBarProps) {
  const showCoachCopy = shape === 'docked' || (shape === 'tooltip' && text);
  const panelReason =
    shape === 'tooltip' && text
      ? text.includes('·')
        ? text
        : text.split('.')[0]
      : undefined;

  return (
    <div
      className="help-guide-tour-bar fixed bottom-4 right-4 z-[10000001] flex max-w-[min(20rem,94vw)] flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-lg"
      role="region"
      aria-label="Tour progress"
    >
      {showCoachCopy && (stepLabel || text) ? (
        <div className="flex flex-col gap-1">
          {stepLabel ? (
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {stepLabel}
            </span>
          ) : null}
          {shape === 'docked' && text ? (
            <p className="text-sm font-medium leading-snug text-foreground">{text}</p>
          ) : null}
          {shape === 'tooltip' && panelReason ? (
            <p className="text-xs leading-snug text-muted-foreground">{panelReason}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5 text-[0.6875rem] font-medium text-muted-foreground">
        {jobs.map((label, index) => {
          const done = index < doneCount;
          const active = index === activeIndex;
          return (
            <span
              key={label}
              className={cn(
                'rounded-full border px-2 py-0.5 transition-colors',
                done && 'border-primary/40 bg-primary/10 text-foreground',
                active && !done && 'border-primary bg-primary/15 text-foreground',
                !done && !active && 'border-border bg-muted/40',
              )}
            >
              {label}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Guide shape">
          {SHAPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={cn(
                'rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium transition-colors',
                shape === opt.id
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onShapeChange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onExit}>
          Exit tour
        </Button>
      </div>
    </div>
  );
}
