import { useMemo } from 'react';
import { History, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useGetAttachmentMarkupEventsQuery } from '@/features/attachments/attachmentsApi';
import type { AttachmentMarkupLayer } from '@/types/attachment';

import { groupEventsBySession } from './formatMarkupEventDisplay';
import MarkupEventLogSession from './MarkupEventLogSession';
import MarkupLayerVisibility from './MarkupLayerVisibility';
import {
  areAllLayersVisible,
  isMineOnlyView,
} from './layerVisibilityState';
import { markupCopy } from './markupCopy';

export interface MarkupEventLogPanelProps {
  attachmentId: number;
  markupEnabled: boolean;
  layers: AttachmentMarkupLayer[];
  visibleUsers: Record<number, boolean>;
  onVisibleUsersChange: (userId: number, visible: boolean) => void;
  onShowAllLayers: () => void;
  onShowMineOnly: () => void;
  markMode: boolean;
  ownLayerColor: string;
  className?: string;
}

export default function MarkupEventLogPanel({
  attachmentId,
  markupEnabled,
  layers,
  visibleUsers,
  onVisibleUsersChange,
  onShowAllLayers,
  onShowMineOnly,
  markMode,
  ownLayerColor,
  className,
}: MarkupEventLogPanelProps) {
  const { data, isLoading } = useGetAttachmentMarkupEventsQuery(attachmentId, {
    skip: !markupEnabled,
  });
  const events = data?.items ?? [];

  const sessionGroups = useMemo(() => groupEventsBySession(events), [events]);
  const hasLayers = layers.length > 0;
  const allLayersVisible = areAllLayersVisible(layers, visibleUsers);
  const mineOnlyView = isMineOnlyView(layers, visibleUsers);

  if (!markupEnabled) {
    return null;
  }

  const hasEvents = events.length > 0;
  if (!hasLayers && !hasEvents && !isLoading) {
    return null;
  }

  return (
    <aside
      className={cn(
        'flex w-[min(16rem,28vw)] shrink-0 flex-col overflow-hidden self-stretch rounded-md border border-border/60 bg-muted/10',
        className,
      )}
    >
      <div className="shrink-0 space-y-2 border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <History className="h-4 w-4 shrink-0 text-muted-foreground" />
            Marks
          </div>
          {hasLayers ? (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={onShowAllLayers}
                className={cn(
                  'rounded-sm px-1 py-0.5 transition-colors hover:text-foreground',
                  allLayersVisible
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {markupCopy.showAllLayersLabel}
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={onShowMineOnly}
                className={cn(
                  'rounded-sm px-1 py-0.5 transition-colors hover:text-foreground',
                  mineOnlyView ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {markupCopy.showMineOnlyLabel}
              </button>
            </div>
          ) : null}
        </div>
        {hasLayers ? (
          <MarkupLayerVisibility
            layers={layers}
            visibleUsers={visibleUsers}
            onVisibleUsersChange={onVisibleUsersChange}
            markMode={markMode}
            ownLayerColor={ownLayerColor}
          />
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading activity…
          </div>
        ) : null}

        {!isLoading && !hasEvents ? (
          <p className="py-4 text-xs text-muted-foreground">No mark activity yet.</p>
        ) : null}

        {sessionGroups.map((group, index) => {
          const groupKey = group.sessionId ?? `legacy-${group.events[0]?.id ?? 'none'}`;
          return (
            <MarkupEventLogSession
              key={groupKey}
              events={group.events}
              isLast={index === sessionGroups.length - 1}
            />
          );
        })}
      </div>
    </aside>
  );
}
