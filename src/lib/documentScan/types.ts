export interface Point {
  x: number;
  y: number;
}

/** Top-left, top-right, bottom-right, bottom-left. */
export type OrderedCorners = [Point, Point, Point, Point];

export type ScanPresetId = 'bw' | 'grayscale' | 'colour';

export const MAX_DETECT_EDGE = 1000;
export const MAX_OUTPUT_EDGE = 2200;
export const MAX_DECODE_MEGAPIXELS = 24_000_000;
export const DEFAULT_CORNER_INSET_RATIO = 0.05;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
