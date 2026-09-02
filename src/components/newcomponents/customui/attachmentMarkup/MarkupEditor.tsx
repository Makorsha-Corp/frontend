import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Eraser, Hand, Pencil, Search, Stamp, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MarkupPoint, MarkupStroke, MarkupStamp, PageMarks } from '@/types/attachment';
import type { SavedStamp } from '@/types/savedStamp';
import { stampPlacementFromPoint } from '@/types/savedStamp';

import { markupCopy } from './markupCopy';
import {
  MARKUP_PICKER_COLORS,
  PEN_WIDTH_PRESETS,
  TEXT_SIZE,
  type PenWidthPresetId,
} from './markupDefaults';
import MarkupOverlay from './MarkupOverlay';
import MarkupStampSelection from './MarkupStampSelection';
import { hitTestStamps } from './markupStampHitTest';
import { findStampById } from './stampIds';
import {
  applyMoveDrag,
  applyRotateDrag,
  applyUniformResize,
} from './markupStampTransform';

export type MarkupTool = 'pen' | 'text' | 'pan' | 'stamp';

export interface MarkupEditorToolbarProps {
  tool: MarkupTool;
  onToolChange: (tool: MarkupTool) => void;
  penPreset: PenWidthPresetId;
  onPenPresetChange: (preset: PenWidthPresetId) => void;
  color: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onClearPage: () => void;
  onResetView?: () => void;
  loupeEnabled?: boolean;
  onLoupeEnabledChange?: (enabled: boolean) => void;
  stampAvailable?: boolean;
  toolVisibility?: Partial<Record<MarkupTool, boolean>>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const DEFAULT_TOOL_VISIBILITY: Record<MarkupTool, boolean> = {
  pen: true,
  text: true,
  pan: true,
  stamp: true,
};

function ToolButton({
  active,
  label,
  icon,
  onClick,
  vertical,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  vertical: boolean;
}) {
  if (vertical) {
    return (
      <Button
        type="button"
        size="icon"
        variant={active ? 'default' : 'outline'}
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        title={label}
        className="h-9 w-9 shrink-0"
      >
        {icon}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      aria-pressed={active}
    >
      {icon}
      <span className="ml-1.5">{label}</span>
    </Button>
  );
}

export function MarkupEditorToolbar({
  tool,
  onToolChange,
  penPreset,
  onPenPresetChange,
  color,
  onColorChange,
  onUndo,
  canUndo,
  onClearPage,
  onResetView,
  loupeEnabled = false,
  onLoupeEnabledChange,
  stampAvailable = false,
  toolVisibility,
  orientation = 'vertical',
  className,
}: MarkupEditorToolbarProps) {
  const vertical = orientation === 'vertical';
  const visibility = { ...DEFAULT_TOOL_VISIBILITY, ...toolVisibility };
  const showPenPresets = tool === 'pen' && visibility.pen;

  return (
    <div
      className={cn(
        vertical
          ? 'flex w-11 shrink-0 flex-col items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-1.5 py-2'
          : 'flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-1.5',
        className,
      )}
      role="toolbar"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
    >
      <div className={cn('flex gap-1', vertical ? 'flex-col items-center' : 'items-center')}>
        {visibility.pen ? (
          <ToolButton
            vertical={vertical}
            active={tool === 'pen'}
            label={markupCopy.penLabel}
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => onToolChange('pen')}
          />
        ) : null}
        {visibility.text ? (
          <ToolButton
            vertical={vertical}
            active={tool === 'text'}
            label={markupCopy.textLabel}
            icon={<Type className="h-4 w-4" />}
            onClick={() => onToolChange('text')}
          />
        ) : null}
        {visibility.pan ? (
          <ToolButton
            vertical={vertical}
            active={tool === 'pan'}
            label={markupCopy.panLabel}
            icon={<Hand className="h-4 w-4" />}
            onClick={() => onToolChange('pan')}
          />
        ) : null}
        {visibility.stamp && stampAvailable ? (
          <ToolButton
            vertical={vertical}
            active={tool === 'stamp'}
            label={markupCopy.stampLabel}
            icon={<Stamp className="h-4 w-4" />}
            onClick={() => onToolChange('stamp')}
          />
        ) : null}
        {onLoupeEnabledChange && visibility.pen ? (
          vertical ? (
            <Button
              type="button"
              size="icon"
              variant={loupeEnabled ? 'default' : 'outline'}
              onClick={() => onLoupeEnabledChange(!loupeEnabled)}
              aria-pressed={loupeEnabled}
              aria-label={markupCopy.loupeLabel}
              title={markupCopy.loupeTooltip}
              className="h-9 w-9 shrink-0"
              disabled={tool !== 'pen'}
            >
              <Search className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant={loupeEnabled ? 'default' : 'outline'}
              onClick={() => onLoupeEnabledChange(!loupeEnabled)}
              aria-pressed={loupeEnabled}
              disabled={tool !== 'pen'}
              title={markupCopy.loupeTooltip}
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              {markupCopy.loupeLabel}
            </Button>
          )
        ) : null}
      </div>

      {showPenPresets ? (
        <div
          className={cn(
            'flex gap-0.5 rounded-md border border-border/60 p-0.5',
            vertical ? 'flex-col items-center' : 'items-center',
          )}
        >
          {(Object.keys(PEN_WIDTH_PRESETS) as PenWidthPresetId[]).map((presetId) => (
            <Button
              key={presetId}
              type="button"
              size="sm"
              variant={penPreset === presetId ? 'default' : 'ghost'}
              className={cn(
                'text-xs uppercase',
                vertical ? 'h-7 w-7 px-0' : 'h-7 px-2',
              )}
              onClick={() => onPenPresetChange(presetId)}
              aria-pressed={penPreset === presetId}
              aria-label={`${markupCopy.penLabel} ${PEN_WIDTH_PRESETS[presetId].label}`}
              title={PEN_WIDTH_PRESETS[presetId].label}
            >
              {presetId.toUpperCase()}
            </Button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'flex gap-1.5',
          vertical ? 'flex-col items-center' : 'items-center',
        )}
      >
        {MARKUP_PICKER_COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            className={cn(
              'h-6 w-6 shrink-0 rounded-full border-2',
              color === swatch ? 'border-foreground' : 'border-transparent',
            )}
            style={{ backgroundColor: swatch }}
            onClick={() => onColorChange(swatch)}
          />
        ))}
      </div>

      <div
        className={cn(
          'flex gap-1.5',
          vertical ? 'mt-auto flex-col items-center' : 'ml-auto items-center',
        )}
      >
        {onResetView ? (
          vertical ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onResetView}
              aria-label={markupCopy.resetViewLabel}
              title={markupCopy.resetViewLabel}
              className="h-9 w-9 shrink-0"
            >
              <span className="text-[10px] font-semibold leading-none">1:1</span>
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={onResetView}>
              {markupCopy.resetViewLabel}
            </Button>
          )
        ) : null}
        {vertical ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label={markupCopy.undoLabel}
            title={markupCopy.undoLabel}
            className="h-9 w-9 shrink-0"
          >
            <span className="text-xs font-semibold">↶</span>
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={onUndo} disabled={!canUndo}>
            {markupCopy.undoLabel}
          </Button>
        )}
        {vertical ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onClearPage}
            aria-label={markupCopy.clearPageLabel}
            title={markupCopy.clearPageLabel}
            className="h-9 w-9 shrink-0"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={onClearPage}>
            <Eraser className="mr-1.5 h-3.5 w-3.5" />
            {markupCopy.clearPageLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export type MapClientToMarkupPoint = (
  clientX: number,
  clientY: number,
) => MarkupPoint | null;

export interface MarkupEditorCanvasProps {
  marks: PageMarks;
  tool: MarkupTool;
  color: string;
  penWidth: number;
  mapClientPoint: MapClientToMarkupPoint;
  onChange: (marks: PageMarks) => void;
  onBeforeChange?: () => void;
  onStampPlace?: (point: MarkupPoint) => void;
  savedStamp?: SavedStamp | null;
  selectedStampId?: string | null;
  onSelectStamp?: (id: string | null) => void;
  onStampUpdate?: (id: string, stamp: MarkupStamp) => void;
  validateMarks?: (marks: PageMarks) => boolean;
  className?: string;
}

function cloneMarks(marks: PageMarks): PageMarks {
  return JSON.parse(JSON.stringify(marks)) as PageMarks;
}

function toNormalizedPoint(
  mapClientPoint: MapClientToMarkupPoint,
  clientX: number,
  clientY: number,
  imageWidth: number,
  imageHeight: number,
): MarkupPoint | null {
  const point = mapClientPoint(clientX, clientY);
  if (!point || imageWidth <= 0 || imageHeight <= 0) return null;
  return {
    x: Math.min(1, Math.max(0, point.x / imageWidth)),
    y: Math.min(1, Math.max(0, point.y / imageHeight)),
  };
}

export function MarkupEditorCanvas({
  marks,
  tool,
  color,
  penWidth,
  mapClientPoint,
  onChange,
  onBeforeChange,
  onStampPlace,
  savedStamp = null,
  selectedStampId = null,
  onSelectStamp,
  onStampUpdate,
  validateMarks,
  className,
  imageWidth,
  imageHeight,
}: MarkupEditorCanvasProps & { imageWidth: number; imageHeight: number }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const stampHistoryPushedRef = useRef(false);
  const [draftStroke, setDraftStroke] = useState<MarkupStroke | null>(null);
  const [stampHoverPoint, setStampHoverPoint] = useState<MarkupPoint | null>(null);
  const [stampGesture, setStampGesture] = useState<
    | {
        kind: 'move';
        id: string;
        startStamp: MarkupStamp;
        startPoint: MarkupPoint;
      }
    | {
        kind: 'resize';
        id: string;
        corner: 0 | 1 | 2 | 3;
        startStamp: MarkupStamp;
      }
    | {
        kind: 'rotate';
        id: string;
        startStamp: MarkupStamp;
        startPoint: MarkupPoint;
      }
    | null
  >(null);
  const [textDraft, setTextDraft] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  const mapNormalized = useCallback(
    (clientX: number, clientY: number) =>
      toNormalizedPoint(mapClientPoint, clientX, clientY, imageWidth, imageHeight),
    [imageHeight, imageWidth, mapClientPoint],
  );

  useEffect(() => {
    if (tool !== 'stamp') {
      setStampHoverPoint(null);
      setStampGesture(null);
    }
  }, [tool]);

  const finishStampGesture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (layerRef.current?.hasPointerCapture(event.pointerId)) {
      layerRef.current.releasePointerCapture(event.pointerId);
    }
    if (stampHistoryPushedRef.current) {
      suppressClickRef.current = true;
    }
    stampHistoryPushedRef.current = false;
    setStampGesture(null);
  }, []);

  const applyMarks = useCallback(
    (next: PageMarks) => {
      if (validateMarks && !validateMarks(next)) return;
      onBeforeChange?.();
      onChange(next);
    },
    [onBeforeChange, onChange, validateMarks],
  );

  const finishStroke = useCallback(
    (stroke: MarkupStroke) => {
      if (stroke.points.length < 2) {
        setDraftStroke(null);
        return;
      }
      applyMarks({
        ...marks,
        strokes: [...marks.strokes, stroke],
      });
      setDraftStroke(null);
    },
    [applyMarks, marks],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool === 'stamp' && savedStamp && event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      const point = mapNormalized(event.clientX, event.clientY);
      if (!point) return;

      const hit = hitTestStamps(point, marks.stamps, selectedStampId);
      if (hit) {
        const startStamp = findStampById(marks.stamps, hit.id);
        if (!startStamp) return;

        onSelectStamp?.(hit.id);
        layerRef.current?.setPointerCapture(event.pointerId);
        setStampHoverPoint(null);

        if (hit.kind === 'rotate') {
          onBeforeChange?.();
          stampHistoryPushedRef.current = true;
          setStampGesture({
            kind: 'rotate',
            id: hit.id,
            startStamp,
            startPoint: point,
          });
          return;
        }

        if (hit.kind === 'resize') {
          onBeforeChange?.();
          stampHistoryPushedRef.current = true;
          setStampGesture({
            kind: 'resize',
            id: hit.id,
            corner: hit.corner,
            startStamp,
          });
          return;
        }

        stampHistoryPushedRef.current = false;
        setStampGesture({
          kind: 'move',
          id: hit.id,
          startStamp,
          startPoint: point,
        });
        return;
      }

      return;
    }

    if (tool !== 'pen' || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const point = mapNormalized(event.clientX, event.clientY);
    if (!point) return;
    layerRef.current?.setPointerCapture(event.pointerId);
    setDraftStroke({
      color,
      width: penWidth,
      points: [point],
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (stampGesture && tool === 'stamp') {
      const point = mapNormalized(event.clientX, event.clientY);
      if (!point) return;

      let nextStamp: MarkupStamp;
      if (stampGesture.kind === 'move') {
        const movedEnough =
          Math.hypot(point.x - stampGesture.startPoint.x, point.y - stampGesture.startPoint.y) >
          0.002;
        if (!stampHistoryPushedRef.current && !movedEnough) {
          return;
        }
        if (!stampHistoryPushedRef.current) {
          onBeforeChange?.();
          stampHistoryPushedRef.current = true;
        }
        nextStamp = applyMoveDrag(stampGesture.startStamp, stampGesture.startPoint, point);
      } else if (stampGesture.kind === 'resize') {
        nextStamp = applyUniformResize(stampGesture.startStamp, stampGesture.corner, point);
      } else {
        nextStamp = applyRotateDrag(stampGesture.startStamp, stampGesture.startPoint, point);
      }

      onStampUpdate?.(stampGesture.id, nextStamp);
      return;
    }

    if (tool === 'stamp' && savedStamp && !stampGesture) {
      const point = mapNormalized(event.clientX, event.clientY);
      setStampHoverPoint(point);
    }
    if (!draftStroke || tool !== 'pen') return;
    const point = mapNormalized(event.clientX, event.clientY);
    if (!point) return;
    setDraftStroke((current) =>
      current ? { ...current, points: [...current.points, point] } : current,
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (stampGesture) {
      finishStampGesture(event);
      return;
    }
    if (!draftStroke) return;
    if (layerRef.current?.hasPointerCapture(event.pointerId)) {
      layerRef.current.releasePointerCapture(event.pointerId);
    }
    finishStroke(draftStroke);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (stampGesture) {
      finishStampGesture(event);
      return;
    }
    if (tool === 'stamp') {
      setStampHoverPoint(null);
      return;
    }
    handlePointerUp(event);
  };

  const handleLayerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'stamp') {
      event.stopPropagation();
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      const point = mapNormalized(event.clientX, event.clientY);
      if (!point) return;

      const hit = hitTestStamps(point, marks.stamps, selectedStampId);
      if (hit) {
        onSelectStamp?.(hit.id);
        return;
      }

      onStampPlace?.(point);
      return;
    }
    if (tool !== 'text') return;
    event.stopPropagation();
    const point = mapNormalized(event.clientX, event.clientY);
    if (!point) return;
    setTextDraft({ x: point.x, y: point.y, value: '' });
  };

  const commitText = () => {
    if (!textDraft?.value.trim()) {
      setTextDraft(null);
      return;
    }
    applyMarks({
      ...marks,
      texts: [
        ...marks.texts,
        {
          x: textDraft.x,
          y: textDraft.y,
          text: textDraft.value.trim(),
          color,
          size: TEXT_SIZE,
        },
      ],
    });
    setTextDraft(null);
  };

  const previewMarks: PageMarks = draftStroke
    ? { ...marks, strokes: [...marks.strokes, draftStroke] }
    : marks;

  const hoverHit =
    stampHoverPoint && tool === 'stamp'
      ? hitTestStamps(stampHoverPoint, marks.stamps, selectedStampId)
      : null;

  const stampPreview =
    tool === 'stamp' && savedStamp && stampHoverPoint && !stampGesture && !hoverHit
      ? stampPlacementFromPoint(stampHoverPoint, savedStamp)
      : null;

  const selectedStamp = findStampById(marks.stamps, selectedStampId ?? null) ?? null;

  const stampCursor =
    stampGesture?.kind === 'move'
      ? 'cursor-grabbing'
      : stampGesture
        ? 'cursor-grabbing'
        : hoverHit?.kind === 'body'
          ? 'cursor-grab'
          : hoverHit
            ? 'cursor-pointer'
            : 'cursor-crosshair';

  if (tool === 'pan') {
    return null;
  }

  return (
    <div
      ref={layerRef}
      className={cn(
        'absolute inset-0 z-20 touch-none',
        tool === 'stamp' && savedStamp && stampCursor,
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleLayerClick}
    >
      <MarkupOverlay
        marks={previewMarks}
        savedStamp={savedStamp}
        stampPreview={stampPreview}
        interactive
        className="pointer-events-none"
      />

      {selectedStamp && tool === 'stamp' ? (
        <svg
          className="pointer-events-none absolute inset-0 z-[21] h-full w-full"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden
        >
          <MarkupStampSelection stamp={selectedStamp} />
        </svg>
      ) : null}

      {textDraft ? (
        <input
          autoFocus
          className="absolute z-30 min-w-[8rem] rounded border border-border bg-background/95 px-2 py-1 text-sm shadow-sm"
          style={{
            left: `${textDraft.x * 100}%`,
            top: `${textDraft.y * 100}%`,
            color,
          }}
          value={textDraft.value}
          onChange={(event) =>
            setTextDraft((current) =>
              current ? { ...current, value: event.target.value } : current,
            )
          }
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitText();
            }
            if (event.key === 'Escape') {
              setTextDraft(null);
            }
          }}
          placeholder="Type here"
          onPointerDown={(event) => event.stopPropagation()}
        />
      ) : null}
    </div>
  );
}

export { cloneMarks as clonePageMarks };
