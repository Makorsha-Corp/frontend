import type { MarkupStroke } from '@/types/attachment';

export interface SavedStampViewBox {
  width: number;
  height: number;
}

export interface SavedStampVector {
  kind: 'vector';
  strokes: MarkupStroke[];
  viewBox: SavedStampViewBox;
}

export interface SavedStampImage {
  kind: 'image';
  public_id: string;
  url: string;
  width: number;
  height: number;
}

export type SavedStamp = SavedStampVector | SavedStampImage;

export interface StampImageSignResponse {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  public_id: string;
  asset_folder: string;
  display_name: string;
  type: string;
  signature: string;
  resource_type: string;
  upload_url: string;
}

export interface CloudinaryDirectUploadSign {
  api_key: string;
  timestamp: number;
  signature: string;
  public_id: string;
  asset_folder: string;
  display_name: string;
  type: string;
  upload_url: string;
}

export const STAMP_VIEWBOX_WIDTH = 400;
export const STAMP_VIEWBOX_HEIGHT = 120;

export function stampAspectRatio(stamp: SavedStamp | null | undefined): number {
  if (!stamp) return STAMP_VIEWBOX_WIDTH / STAMP_VIEWBOX_HEIGHT;
  if (stamp.kind === 'image') {
    return stamp.width / stamp.height;
  }
  return stamp.viewBox.width / stamp.viewBox.height;
}

export function defaultStampSize(stamp: SavedStamp | null | undefined): {
  width: number;
  height: number;
} {
  const aspect = stampAspectRatio(stamp);
  const width = 0.28;
  return { width, height: width / aspect };
}

export function stampPlacementFromPoint(
  point: { x: number; y: number },
  stamp: SavedStamp,
): { id: string; x: number; y: number; width: number; height: number } {
  const size = defaultStampSize(stamp);
  return {
    id: crypto.randomUUID(),
    x: Math.max(0, Math.min(1 - size.width, point.x - size.width / 2)),
    y: Math.max(0, Math.min(1 - size.height, point.y - size.height / 2)),
    width: size.width,
    height: size.height,
  };
}
