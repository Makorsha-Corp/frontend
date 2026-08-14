import type { OrderedCorners, Point } from './types';

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Sort four points into TL, TR, BR, BL order. */
export function orderCorners(points: Point[]): OrderedCorners {
  if (points.length !== 4) {
    throw new Error('orderCorners requires exactly four points.');
  }

  const sortedByY = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
  const topTwo = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottomTwo = sortedByY.slice(2, 4).sort((a, b) => a.x - b.x);

  return [topTwo[0], topTwo[1], bottomTwo[1], bottomTwo[0]];
}

export function defaultCorners(
  width: number,
  height: number,
  insetRatio = 0.05,
): OrderedCorners {
  const dx = width * insetRatio;
  const dy = height * insetRatio;

  return [
    { x: dx, y: dy },
    { x: width - dx, y: dy },
    { x: width - dx, y: height - dy },
    { x: dx, y: height - dy },
  ];
}

export function scaleCorners(corners: Point[], scale: number): OrderedCorners {
  return orderCorners(
    corners.map((point) => ({
      x: point.x * scale,
      y: point.y * scale,
    })),
  );
}

export { distance };
