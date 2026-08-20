import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  clampPan,
  clampViewportScale,
  computeFitLayout,
  MAX_VIEWPORT_SCALE,
  MIN_VIEWPORT_SCALE,
  panForZoomAtAnchor,
  type FitLayout,
  type ViewportTransform,
} from '@/lib/documentScan/viewportCoords';

type PointerRecord = { x: number; y: number };

function pointerDistance(a: PointerRecord, b: PointerRecord): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function pointerMidpoint(a: PointerRecord, b: PointerRecord): PointerRecord {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export interface UseImageViewportOptions {
  imageWidth: number;
  imageHeight: number;
  disabled?: boolean;
  /** Mouse button for pan at any zoom (e.g. 2 = right-click). */
  secondaryPanButton?: number;
}

export interface UseImageViewportResult {
  viewportRef: React.RefObject<HTMLDivElement>;
  layout: FitLayout;
  viewport: ViewportTransform;
  isPanning: boolean;
  isPinching: boolean;
  resetViewport: () => void;
  onViewportPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onViewportPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onViewportPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSecondaryPanPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSecondaryPanPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSecondaryPanPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onViewportWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
}

export function useImageViewport({
  imageWidth,
  imageHeight,
  disabled = false,
  secondaryPanButton,
}: UseImageViewportOptions): UseImageViewportResult {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<ViewportTransform>({ scale: 1, panX: 0, panY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const activePointersRef = useRef<Map<number, PointerRecord>>(new Map());
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const secondaryPanStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );
  const secondaryPanPointerIdRef = useRef<number | null>(null);
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    panX: number;
    panY: number;
    anchorX: number;
    anchorY: number;
  } | null>(null);

  const layout = useMemo(
    () => computeFitLayout(containerSize.width, containerSize.height, imageWidth, imageHeight),
    [containerSize.height, containerSize.width, imageHeight, imageWidth],
  );

  const applyViewport = useCallback(
    (next: ViewportTransform) => {
      const scale = clampViewportScale(next.scale);
      const clamped = clampPan(
        next.panX,
        next.panY,
        layout,
        scale,
        containerSize.width,
        containerSize.height,
      );
      setViewport({ scale, ...clamped });
    },
    [containerSize.height, containerSize.width, layout],
  );

  const resetViewport = useCallback(() => {
    setViewport({ scale: 1, panX: 0, panY: 0 });
    activePointersRef.current.clear();
    panStartRef.current = null;
    secondaryPanStartRef.current = null;
    secondaryPanPointerIdRef.current = null;
    pinchStartRef.current = null;
    setIsPanning(false);
    setIsPinching(false);
  }, []);

  useEffect(() => {
    resetViewport();
  }, [imageWidth, imageHeight, resetViewport]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    setContainerSize({ width: node.clientWidth, height: node.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setViewport((current) => {
      const scale = clampViewportScale(current.scale);
      return {
        scale,
        ...clampPan(
          current.panX,
          current.panY,
          layout,
          scale,
          containerSize.width,
          containerSize.height,
        ),
      };
    });
  }, [
    containerSize.height,
    containerSize.width,
    layout.displayHeight,
    layout.displayWidth,
    layout.offsetX,
    layout.offsetY,
  ]);

  const localPoint = useCallback((event: React.PointerEvent<HTMLDivElement>): PointerRecord => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const onViewportPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      const point = localPoint(event);
      activePointersRef.current.set(event.pointerId, point);
      event.currentTarget.setPointerCapture(event.pointerId);

      if (activePointersRef.current.size === 2) {
        const [first, second] = [...activePointersRef.current.values()];
        const midpoint = pointerMidpoint(first, second);
        pinchStartRef.current = {
          distance: pointerDistance(first, second),
          scale: viewport.scale,
          panX: viewport.panX,
          panY: viewport.panY,
          anchorX: midpoint.x,
          anchorY: midpoint.y,
        };
        panStartRef.current = null;
        setIsPinching(true);
        setIsPanning(false);
        return;
      }

      if (activePointersRef.current.size === 1 && viewport.scale > 1) {
        panStartRef.current = {
          x: point.x,
          y: point.y,
          panX: viewport.panX,
          panY: viewport.panY,
        };
        setIsPanning(true);
      }
    },
    [disabled, localPoint, viewport.panX, viewport.panY, viewport.scale],
  );

  const onViewportPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!activePointersRef.current.has(event.pointerId)) return;

      const point = localPoint(event);
      activePointersRef.current.set(event.pointerId, point);

      if (activePointersRef.current.size >= 2) {
        const [first, second] = [...activePointersRef.current.values()];
        const start = pinchStartRef.current;
        if (!start || start.distance <= 0) return;

        const distance = pointerDistance(first, second);
        const midpoint = pointerMidpoint(first, second);
        const nextScale = clampViewportScale(start.scale * (distance / start.distance));
        const zoomPan = panForZoomAtAnchor(
          midpoint.x,
          midpoint.y,
          layout,
          start.scale,
          nextScale,
          start.panX,
          start.panY,
        );
        applyViewport({ scale: nextScale, ...zoomPan });
        setIsPinching(true);
        return;
      }

      const panStart = panStartRef.current;
      if (panStart && viewport.scale > 1) {
        applyViewport({
          scale: viewport.scale,
          panX: panStart.panX + (point.x - panStart.x),
          panY: panStart.panY + (point.y - panStart.y),
        });
      }
    },
    [applyViewport, disabled, layout, localPoint, viewport.scale],
  );

  const endPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
      setIsPinching(false);
    }
    if (activePointersRef.current.size === 0) {
      panStartRef.current = null;
      setIsPanning(false);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onViewportPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      endPointer(event);
    },
    [endPointer],
  );

  const onSecondaryPanPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || secondaryPanButton === undefined || event.button !== secondaryPanButton) {
        return;
      }
      const point = localPoint(event);
      secondaryPanPointerIdRef.current = event.pointerId;
      secondaryPanStartRef.current = {
        x: point.x,
        y: point.y,
        panX: viewport.panX,
        panY: viewport.panY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
    },
    [disabled, localPoint, secondaryPanButton, viewport.panX, viewport.panY],
  );

  const onSecondaryPanPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || secondaryPanPointerIdRef.current !== event.pointerId) return;
      const panStart = secondaryPanStartRef.current;
      if (!panStart) return;
      const point = localPoint(event);
      applyViewport({
        scale: viewport.scale,
        panX: panStart.panX + (point.x - panStart.x),
        panY: panStart.panY + (point.y - panStart.y),
      });
    },
    [applyViewport, disabled, localPoint, viewport.scale],
  );

  const onSecondaryPanPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (secondaryPanPointerIdRef.current !== event.pointerId) return;
      secondaryPanPointerIdRef.current = null;
      secondaryPanStartRef.current = null;
      setIsPanning(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const onViewportWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();

      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;

      const anchorX = event.clientX - rect.left;
      const anchorY = event.clientY - rect.top;
      const delta = event.deltaY > 0 ? -0.12 : 0.12;
      const nextScale = clampViewportScale(viewport.scale * (1 + delta));
      if (nextScale === viewport.scale) return;

      const zoomPan = panForZoomAtAnchor(
        anchorX,
        anchorY,
        layout,
        viewport.scale,
        nextScale,
        viewport.panX,
        viewport.panY,
      );
      applyViewport({ scale: nextScale, ...zoomPan });
    },
    [applyViewport, disabled, layout, viewport.panX, viewport.panY, viewport.scale],
  );

  return {
    viewportRef,
    layout,
    viewport,
    isPanning,
    isPinching,
    resetViewport,
    onViewportPointerDown,
    onViewportPointerMove,
    onViewportPointerUp,
    onSecondaryPanPointerDown,
    onSecondaryPanPointerMove,
    onSecondaryPanPointerUp,
    onViewportWheel,
  };
}

export { MAX_VIEWPORT_SCALE, MIN_VIEWPORT_SCALE };
