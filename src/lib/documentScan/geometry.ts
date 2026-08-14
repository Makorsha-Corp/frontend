import { distance } from './orderCorners';
import type { OrderedCorners, Point } from './types';
import { MAX_OUTPUT_EDGE } from './types';

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function polygonArea(corners: OrderedCorners): number {
  const [a, b, c, d] = corners;
  return Math.abs(
    a.x * b.y - b.x * a.y +
      b.x * c.y - c.x * b.y +
      c.x * d.y - d.x * c.y +
      d.x * a.y - a.x * d.y,
  ) / 2;
}

export function isConvex(corners: OrderedCorners): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i += 1) {
    const o = corners[i];
    const a = corners[(i + 1) % 4];
    const b = corners[(i + 2) % 4];
    const value = cross(o, a, b);
    if (value === 0) continue;
    if (sign === 0) sign = Math.sign(value);
    else if (Math.sign(value) !== sign) return false;
  }
  return true;
}

export function isUsableQuad(corners: OrderedCorners, width: number, height: number): boolean {
  const imageArea = width * height;
  if (imageArea <= 0) return false;
  const area = polygonArea(corners);
  if (area < imageArea * 0.01) return false;
  return isConvex(corners);
}

export function clampCorner(point: Point, width: number, height: number): Point {
  return {
    x: Math.min(Math.max(point.x, 0), width),
    y: Math.min(Math.max(point.y, 0), height),
  };
}

export function clampCorners(corners: OrderedCorners, width: number, height: number): OrderedCorners {
  return corners.map((point) => clampCorner(point, width, height)) as OrderedCorners;
}

export function outputSizeFor(corners: OrderedCorners): { width: number; height: number } {
  const [tl, tr, br, bl] = corners;
  const topWidth = distance(tl, tr);
  const bottomWidth = distance(bl, br);
  const leftHeight = distance(tl, bl);
  const rightHeight = distance(tr, br);

  let width = Math.round(Math.max(topWidth, bottomWidth));
  let height = Math.round(Math.max(leftHeight, rightHeight));

  const maxEdge = Math.max(width, height);
  if (maxEdge > MAX_OUTPUT_EDGE) {
    const scale = MAX_OUTPUT_EDGE / maxEdge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  return {
    width: Math.max(width, 1),
    height: Math.max(height, 1),
  };
}

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number; scale: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height, scale: 1 };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}
