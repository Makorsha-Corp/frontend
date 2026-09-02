import { cn } from '@/lib/utils';
import type { AttachmentMarkupLayer } from '@/types/attachment';

import { layerColorForUser } from './markupDefaults';

export interface MarkupLayerVisibilityProps {
  layers: AttachmentMarkupLayer[];
  visibleUsers: Record<number, boolean>;
  onVisibleUsersChange: (userId: number, visible: boolean) => void;
  markMode: boolean;
  ownLayerColor: string;
  className?: string;
}

export default function MarkupLayerVisibility({
  layers,
  visibleUsers,
  onVisibleUsersChange,
  markMode,
  ownLayerColor,
  className,
}: MarkupLayerVisibilityProps) {
  if (layers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {layers.map((layer) => {
        const layerColor = layer.is_mine ? ownLayerColor : layerColorForUser(layer.user_id);
        const isVisible = visibleUsers[layer.user_id] ?? true;
        const isOwnLayerLocked = layer.is_mine && markMode;
        const label = layer.is_mine ? 'You' : layer.user_name;

        return (
          <button
            key={layer.user_id}
            type="button"
            aria-pressed={isVisible}
            disabled={isOwnLayerLocked}
            onClick={() => onVisibleUsersChange(layer.user_id, !isVisible)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isVisible
                ? 'border-border/60 bg-muted/40 text-foreground'
                : 'border-border/40 bg-transparent text-muted-foreground hover:bg-muted/20',
              isOwnLayerLocked && 'cursor-default opacity-80',
            )}
          >
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: layerColor }}
            />
            <span className={cn(layer.is_mine && 'font-medium')}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
