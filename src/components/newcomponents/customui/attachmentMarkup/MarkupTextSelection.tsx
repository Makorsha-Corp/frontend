import type { MarkupText } from '@/types/attachment';

import { textMarkBounds } from './markupTextGeometry';

export default function MarkupTextSelection({ text }: { text: MarkupText }) {
  const bounds = textMarkBounds(text);
  return (
    <rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth={0.004}
      vectorEffect="non-scaling-stroke"
      rx={0.004}
    />
  );
}
