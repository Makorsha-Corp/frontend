import { useCallback, useEffect, type ReactNode } from 'react';

import { clientToImagePoint } from '@/lib/documentScan/viewportCoords';
import { cn } from '@/lib/utils';

import { useImageViewport } from '@/components/newcomponents/customui/scan/useImageViewport';

import type { MapClientToMarkupPoint, MarkupTool } from './MarkupEditor';

export interface MarkupViewportApi {
  resetView: () => void;
  mapClientPoint: MapClientToMarkupPoint;
}

export interface MarkupImageViewportProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  activeTool: MarkupTool;
  className?: string;
  overlay?: ReactNode;
  editorOverlay?: ReactNode;
  onViewportReady?: (api: MarkupViewportApi) => void;
  onImageDimensions?: (width: number, height: number) => void;
  /** When set, left-click on viewport places or moves the pinned loupe. */
  onMainViewportClick?: (clientX: number, clientY: number) => void;
  /** When true, pen drawing on main canvas is disabled (loupe draws instead). */
  loupeDrawMode?: boolean;
}

export default function MarkupImageViewport({
  imageUrl,
  imageWidth,
  imageHeight,
  activeTool,
  className,
  overlay,
  editorOverlay,
  onViewportReady,
  onImageDimensions,
  onMainViewportClick,
  loupeDrawMode = false,
}: MarkupImageViewportProps) {
  const panActive = activeTool === 'pan';

  const {
    viewportRef,
    layout,
    viewport,
    isPanning,
    onViewportPointerDown,
    onViewportPointerMove,
    onViewportPointerUp,
    onSecondaryPanPointerDown,
    onSecondaryPanPointerMove,
    onSecondaryPanPointerUp,
    onViewportWheel,
    resetViewport,
  } = useImageViewport({
    imageWidth,
    imageHeight,
    disabled: false,
    secondaryPanButton: 2,
  });

  const mapClientPoint = useCallback<MapClientToMarkupPoint>(
    (clientX, clientY) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect || imageWidth <= 0 || imageHeight <= 0) return null;
      return clientToImagePoint(
        clientX,
        clientY,
        rect,
        layout,
        imageWidth,
        imageHeight,
        viewport,
      );
    },
    [imageHeight, imageWidth, layout, viewport, viewportRef],
  );

  useEffect(() => {
    onViewportReady?.({
      resetView: resetViewport,
      mapClientPoint,
    });
  }, [mapClientPoint, onViewportReady, resetViewport]);

  const layoutReady = layout.displayWidth > 0 && layout.displayHeight > 0;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === 2) {
      onSecondaryPanPointerDown(event);
      return;
    }
    if (event.button !== 0) return;
    if (panActive) {
      onViewportPointerDown(event);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onSecondaryPanPointerMove(event);
    if (panActive) {
      onViewportPointerMove(event);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    onSecondaryPanPointerUp(event);
    if (panActive) {
      onViewportPointerUp(event);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !onMainViewportClick) return;
    onMainViewportClick(event.clientX, event.clientY);
  };

  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  const drawOnMain = !loupeDrawMode && activeTool !== 'pan';

  return (
    <div
      className={cn(
        'relative min-h-[20rem] w-full overflow-hidden rounded-md bg-muted/20',
        className,
      )}
    >
      <div
        ref={viewportRef}
        className={cn(
          'relative h-full min-h-[20rem] w-full touch-none overflow-hidden',
          isPanning ? 'cursor-grabbing' : panActive ? 'cursor-grab' : 'cursor-crosshair',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={onViewportWheel}
        onContextMenu={(event) => event.preventDefault()}
        onClick={loupeDrawMode ? handleClick : undefined}
      >
        {layoutReady ? (
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: layout.displayWidth,
              height: layout.displayHeight,
              transform: `translate(${layout.offsetX + viewport.panX}px, ${layout.offsetY + viewport.panY}px) scale(${viewport.scale})`,
              transformOrigin: '0 0',
            }}
          >
            <img
              src={imageUrl}
              alt=""
              className="block h-full w-full select-none rounded-md object-fill"
              width={imageWidth}
              height={imageHeight}
              draggable={false}
              onLoad={(event) => {
                const img = event.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  onImageDimensions?.(img.naturalWidth, img.naturalHeight);
                }
              }}
            />
            <div className="pointer-events-none absolute inset-0">{overlay}</div>
            {drawOnMain ? editorOverlay : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
