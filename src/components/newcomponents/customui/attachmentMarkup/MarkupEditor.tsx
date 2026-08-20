import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Eraser, Hand, Pencil, Search, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MarkupPoint, MarkupStroke, PageMarks } from '@/types/attachment';

import { markupCopy } from './markupCopy';
import {
  MARKUP_PICKER_COLORS,
  PEN_WIDTH_PRESETS,
  TEXT_SIZE,
  type PenWidthPresetId,
} from './markupDefaults';
import MarkupOverlay from './MarkupOverlay';

export type MarkupTool = 'pen' | 'text' | 'pan';

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
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

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
  orientation = 'vertical',
  className,
}: MarkupEditorToolbarProps) {
  const vertical = orientation === 'vertical';

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
        <ToolButton
          vertical={vertical}
          active={tool === 'pen'}
          label={markupCopy.penLabel}
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onToolChange('pen')}
        />
        <ToolButton
          vertical={vertical}
          active={tool === 'text'}
          label={markupCopy.textLabel}
          icon={<Type className="h-4 w-4" />}
          onClick={() => onToolChange('text')}
        />
        <ToolButton
          vertical={vertical}
          active={tool === 'pan'}
          label={markupCopy.panLabel}
          icon={<Hand className="h-4 w-4" />}
          onClick={() => onToolChange('pan')}
        />
        {onLoupeEnabledChange ? (
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

      {tool === 'pen' ? (
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
  className,
  imageWidth,
  imageHeight,
}: MarkupEditorCanvasProps & { imageWidth: number; imageHeight: number }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [draftStroke, setDraftStroke] = useState<MarkupStroke | null>(null);
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

  const applyMarks = useCallback(
    (next: PageMarks) => {
      onBeforeChange?.();
      onChange(next);
    },
    [onBeforeChange, onChange],
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
    if (!draftStroke || tool !== 'pen') return;
    const point = mapNormalized(event.clientX, event.clientY);
    if (!point) return;
    setDraftStroke((current) =>
      current ? { ...current, points: [...current.points, point] } : current,
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftStroke) return;
    if (layerRef.current?.hasPointerCapture(event.pointerId)) {
      layerRef.current.releasePointerCapture(event.pointerId);
    }
    finishStroke(draftStroke);
  };

  const handleLayerClick = (event: React.MouseEvent<HTMLDivElement>) => {
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

  if (tool === 'pan') {
    return null;
  }

  return (
    <div
      ref={layerRef}
      className={cn('absolute inset-0 z-20 touch-none', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleLayerClick}
    >
      <MarkupOverlay marks={previewMarks} interactive className="pointer-events-none" />

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
