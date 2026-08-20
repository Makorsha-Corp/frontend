/** Normalized stroke/text defaults (0–1 of image min-side). */
export const PEN_WIDTH = 0.018;
export const TEXT_SIZE = 0.04;

/** Legacy scribble render floor only (tool removed from UI in v1.2). */
export const SCRIBBLE_RENDER_FLOOR = 0.035;

/** Minimum render widths so legacy v1 marks stay visible. */
export const PEN_RENDER_FLOOR = 0.012;

export const PEN_WIDTH_PRESETS = {
  s: { id: 's' as const, label: 'Fine', width: 0.012 },
  m: { id: 'm' as const, label: 'Medium', width: 0.018 },
  l: { id: 'l' as const, label: 'Bold', width: 0.028 },
} as const;

export type PenWidthPresetId = keyof typeof PEN_WIDTH_PRESETS;

export const DEFAULT_PEN_PRESET: PenWidthPresetId = 'm';

export function penWidthForPreset(preset: PenWidthPresetId): number {
  return PEN_WIDTH_PRESETS[preset].width;
}

export const MARKUP_PICKER_COLORS = ['#6366f1', '#000000'] as const;

export function renderStrokeWidth(
  width: number,
  kind: 'pen' | 'scribble',
): number {
  const floor = kind === 'scribble' ? SCRIBBLE_RENDER_FLOOR : PEN_RENDER_FLOOR;
  return Math.max(width, floor);
}

/** Stable hue per user for read-only layer tinting. */
export function layerColorForUser(userId: number): string {
  const hue = (userId * 47) % 360;
  return `hsl(${hue} 68% 42%)`;
}

export function getMarkupSaveErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

export function isMarkupServiceUnavailable(error: unknown): boolean {
  const status = getMarkupSaveErrorStatus(error);
  return status === 503 || status === 500;
}
