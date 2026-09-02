import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, PencilLine } from 'lucide-react';

import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { appToast } from '@/lib/appToast';
import { usePdfPageTargetWidth } from '@/hooks/usePdfPageTargetWidth';
import { cn } from '@/lib/utils';
import { isPreviewableAttachment } from '@/lib/attachmentAllowlist';
import AttachmentPdfPageViewer from '@/components/newcomponents/customui/AttachmentPdfPageViewer';
import { useGetAttachmentMarkupsQuery } from '@/features/attachments/attachmentsApi';
import type { Attachment, MarkupPayload, MarkupPoint, MarkupStroke, MarkupStamp, PageMarks } from '@/types/attachment';
import { stampPlacementFromPoint } from '@/types/savedStamp';

import {
  MarkupEditorCanvas,
  MarkupEditorToolbar,
  clonePageMarks,
  type MapClientToMarkupPoint,
  type MarkupTool,
} from './MarkupEditor';
import MarkupDrawLoupe from './MarkupDrawLoupe';
import MarkupEventLogPanel from './MarkupEventLogPanel';
import MarkupImageViewport, { type MarkupViewportApi } from './MarkupImageViewport';
import MarkupOverlay from './MarkupOverlay';
import {
  DEFAULT_PEN_PRESET,
  layerColorForUser,
  MARKUP_PICKER_COLORS,
  penWidthForPreset,
  type PenWidthPresetId,
} from './markupDefaults';
import { loupeStrokeWidth, type ImagePixelPoint } from './markupLoupeCoords';
import { computeRectLoupePosition } from './markupLoupePlacement';
import { markupCopy } from './markupCopy';
import { wouldExceedMarkupBudget } from './markupPointBudget';
import {
  clonePayload,
  emptyPageMarks,
  getPageMarks,
  setPageMarks,
} from './pageMarks';
import { ensurePageMarkStampIds, ensurePayloadStampIds, findStampById } from './stampIds';
import { removeStampById, updateStampById } from './markupStampTransform';
import { useAutoSaveMarkup } from './useAutoSaveMarkup';
import {
  buildMineOnlyVisibility,
  buildShowAllVisibility,
} from './layerVisibilityState';

export interface AttachmentMarkupStageProps {
  attachment: Attachment;
  isPdf: boolean;
  previewUrl?: string | null;
  markMode: boolean;
  onMarkModeChange: (enabled: boolean) => void;
  portalContainer?: HTMLElement | null;
  className?: string;
}

const FALLBACK_IMAGE_WIDTH = 1600;
const FALLBACK_IMAGE_HEIGHT = 1200;

export function isMarkupableAttachment(attachment: Attachment): boolean {
  return attachment.upload_status === 'ready' && isPreviewableAttachment(attachment);
}

export default function AttachmentMarkupStage({
  attachment,
  isPdf,
  previewUrl,
  markMode,
  onMarkModeChange,
  portalContainer,
  className,
}: AttachmentMarkupStageProps) {
  const [page, setPage] = useState(1);
  const [visibleUsers, setVisibleUsers] = useState<Record<number, boolean>>({});
  const [ownPayload, setOwnPayload] = useState<MarkupPayload>({ pages: {} });
  const [pageMarks, setPageMarksState] = useState<PageMarks>(emptyPageMarks());
  const [tool, setTool] = useState<MarkupTool>('pen');
  const [penPreset, setPenPreset] = useState<PenWidthPresetId>(DEFAULT_PEN_PRESET);
  const [color, setColor] = useState<string>(MARKUP_PICKER_COLORS[0]);
  const [loupeEnabled, setLoupeEnabled] = useState(false);
  const [loupeCenter, setLoupeCenter] = useState<ImagePixelPoint>({ x: 0, y: 0 });
  const [loupeLockedCenter, setLoupeLockedCenter] = useState<ImagePixelPoint>({ x: 0, y: 0 });
  const [loupePlacement, setLoupePlacement] = useState<{ left: number; top: number } | null>(null);
  const [loupePlaced, setLoupePlaced] = useState(false);
  const [loupeDrawing, setLoupeDrawing] = useState(false);
  const [history, setHistory] = useState<PageMarks[]>([]);
  const [imageDims, setImageDims] = useState({
    width: attachment.width ?? FALLBACK_IMAGE_WIDTH,
    height: attachment.height ?? FALLBACK_IMAGE_HEIGHT,
  });
  const [markSessionId, setMarkSessionId] = useState<string | null>(null);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const pdfPageUrlRef = useRef<string | null>(null);
  const skipAutoSaveRef = useRef(false);
  const prevMarkModeRef = useRef(markMode);
  const viewportApiRef = useRef<MarkupViewportApi | null>(null);
  const mapClientPointRef = useRef<MapClientToMarkupPoint>(() => null);
  const ownPayloadRef = useRef(ownPayload);
  const pageHistoryRef = useRef<Record<number, PageMarks[]>>({});
  const loadedAttachmentIdRef = useRef<number | null>(null);
  const pdfMeasureRef = useRef<HTMLDivElement>(null);

  const pageAspect =
    imageDims.width > 0 && imageDims.height > 0
      ? imageDims.width / imageDims.height
      : attachment.width != null &&
          attachment.height != null &&
          attachment.width > 0 &&
          attachment.height > 0
        ? attachment.width / attachment.height
        : undefined;

  const pdfTargetWidth = usePdfPageTargetWidth(pdfMeasureRef, {
    pageAspect,
  });

  const userSavedStamp = useAppSelector((state) => state.auth.user?.saved_stamp ?? null);

  ownPayloadRef.current = ownPayload;

  const markupEnabled = isMarkupableAttachment(attachment);
  const { data, isLoading, isError } = useGetAttachmentMarkupsQuery(attachment.id, {
    skip: !markupEnabled,
  });

  const { status: saveStatus, scheduleSave, flushSave, resumeSave } = useAutoSaveMarkup(
    attachment.id,
    markupEnabled && markMode,
    markSessionId,
  );

  const imageUrl = isPdf ? pdfPageUrlRef.current : (previewUrl ?? null);

  const ownLayer = useMemo(
    () => data?.items.find((layer) => layer.is_mine) ?? null,
    [data?.items],
  );

  const layerCount = data?.items.length ?? 0;
  const layers = data?.items ?? [];

  useEffect(() => {
    loadedAttachmentIdRef.current = null;
    setPage(1);
    setLoupeEnabled(false);
    setLoupeDrawing(false);
    setLoupePlaced(false);
    setLoupePlacement(null);
    setHistory([]);
    pdfPageUrlRef.current = null;
    pageHistoryRef.current = {};
    setImageDims({
      width: attachment.width ?? FALLBACK_IMAGE_WIDTH,
      height: attachment.height ?? FALLBACK_IMAGE_HEIGHT,
    });
  }, [attachment.id, attachment.width, attachment.height]);

  useEffect(() => {
    setLoupeCenter({
      x: (attachment.width ?? FALLBACK_IMAGE_WIDTH) / 2,
      y: (attachment.height ?? FALLBACK_IMAGE_HEIGHT) / 2,
    });
  }, [attachment.id, attachment.width, attachment.height]);

  useEffect(() => {
    if (tool !== 'pen') {
      setLoupeEnabled(false);
    }
  }, [tool]);

  useEffect(() => {
    if (tool !== 'stamp') {
      setSelectedStampId(null);
    }
  }, [tool]);

  useEffect(() => {
    if (selectedStampId && !findStampById(pageMarks.stamps, selectedStampId)) {
      setSelectedStampId(null);
    }
  }, [pageMarks.stamps, selectedStampId]);

  useEffect(() => {
    if (!loupeEnabled) {
      setLoupePlaced(false);
      setLoupePlacement(null);
    }
  }, [loupeEnabled]);

  useEffect(() => {
    setLoupePlaced(false);
    setLoupePlacement(null);
  }, [page]);

  useEffect(() => {
    pageHistoryRef.current[page] = history;
  }, [history, page]);

  useEffect(() => {
    if (!markupEnabled || isLoading) return;
    if (loadedAttachmentIdRef.current === attachment.id) return;

    loadedAttachmentIdRef.current = attachment.id;
    skipAutoSaveRef.current = true;
    const payload = ensurePayloadStampIds(ownLayer?.payload ?? { pages: {} });
    setOwnPayload(clonePayload(payload));
    setPageMarksState(ensurePageMarkStampIds(getPageMarks(payload, 1)));
    setHistory([]);
    pageHistoryRef.current = {};
    queueMicrotask(() => {
      skipAutoSaveRef.current = false;
    });
  }, [attachment.id, isLoading, markupEnabled, ownLayer]);

  useEffect(() => {
    if (loadedAttachmentIdRef.current !== attachment.id) return;
    const raw = getPageMarks(ownPayloadRef.current, page);
    const marks = ensurePageMarkStampIds(raw);
    if (marks !== raw) {
      setOwnPayload((current) => setPageMarks(current, page, marks));
    }
    setPageMarksState(marks);
    setHistory(pageHistoryRef.current[page] ?? []);
  }, [page, attachment.id]);

  const validateMarksBudget = useCallback(
    (marks: PageMarks) => {
      if (!wouldExceedMarkupBudget(ownPayloadRef.current, page, marks)) {
        return true;
      }
      appToast.error(markupCopy.markupPointBudgetExceeded);
      return false;
    },
    [page],
  );

  useEffect(() => {
    if (!data?.items) return;
    setVisibleUsers((current) => {
      const next = { ...current };
      for (const layer of data.items) {
        if (next[layer.user_id] === undefined) {
          next[layer.user_id] = true;
        }
      }
      return next;
    });
  }, [data?.items]);

  useEffect(() => {
    if (skipAutoSaveRef.current || !markMode) return;
    scheduleSave(ownPayload);
  }, [ownPayload, markMode, scheduleSave]);

  useEffect(() => {
    if (markMode && !prevMarkModeRef.current) {
      setMarkSessionId(crypto.randomUUID());
    }
    if (prevMarkModeRef.current && !markMode) {
      flushSave();
    }
    prevMarkModeRef.current = markMode;
  }, [markMode, flushSave]);

  const handlePageMarksChange = useCallback((marks: PageMarks) => {
    resumeSave();
    setPageMarksState(marks);
    setOwnPayload((current) => setPageMarks(current, page, marks));
  }, [page, resumeSave]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-19), clonePageMarks(pageMarks)]);
  }, [pageMarks]);

  const handleClearPage = () => {
    pushHistory();
    resumeSave();
    handlePageMarksChange(emptyPageMarks());
    flushSave();
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((stack) => stack.slice(0, -1));
    handlePageMarksChange(clonePageMarks(previous));
  };

  const handleViewportReady = useCallback((api: MarkupViewportApi) => {
    viewportApiRef.current = api;
    mapClientPointRef.current = api.mapClientPoint;
  }, []);

  const handleResetView = () => {
    viewportApiRef.current?.resetView();
  };

  const loupeActive = loupeEnabled && tool === 'pen' && markMode;

  const placeLoupeAt = useCallback(
    (clientX: number, clientY: number) => {
      const point = mapClientPointRef.current(clientX, clientY);
      if (!point) return;

      setLoupeCenter({ x: point.x, y: point.y });
      setLoupeLockedCenter({ x: point.x, y: point.y });

      const container = portalContainer;
      if (container) {
        const rect = container.getBoundingClientRect();
        setLoupePlacement(
          computeRectLoupePosition({
            pointerClientX: clientX,
            pointerClientY: clientY,
            containerRect: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
          }),
        );
      }
      setLoupePlaced(true);
    },
    [portalContainer],
  );

  const handleMainViewportClick = useCallback(
    (clientX: number, clientY: number) => {
      placeLoupeAt(clientX, clientY);
    },
    [placeLoupeAt],
  );

  const handleLoupeDrawingChange = useCallback(
    (drawing: boolean) => {
      setLoupeDrawing(drawing);
      if (drawing) {
        setLoupeLockedCenter(loupeCenter);
      }
    },
    [loupeCenter],
  );

  const handleLoupeStrokeComplete = useCallback(
    (stroke: MarkupStroke) => {
      const nextMarks = {
        ...pageMarks,
        strokes: [...pageMarks.strokes, stroke],
      };
      if (wouldExceedMarkupBudget(ownPayloadRef.current, page, nextMarks)) {
        appToast.error(markupCopy.markupPointBudgetExceeded);
        return;
      }
      handlePageMarksChange(nextMarks);
    },
    [handlePageMarksChange, page, pageMarks],
  );

  const handleStampPlace = useCallback(
    (point: MarkupPoint) => {
      if (!userSavedStamp) return;
      const newStamp = stampPlacementFromPoint(point, userSavedStamp);
      const nextMarks = { ...pageMarks, stamps: [...pageMarks.stamps, newStamp] };
      if (wouldExceedMarkupBudget(ownPayloadRef.current, page, nextMarks)) {
        appToast.error(markupCopy.markupPointBudgetExceeded);
        return;
      }
      pushHistory();
      handlePageMarksChange(nextMarks);
      setSelectedStampId(newStamp.id);
    },
    [handlePageMarksChange, page, pageMarks, pushHistory, userSavedStamp],
  );

  const handleStampUpdate = useCallback(
    (id: string, stamp: MarkupStamp) => {
      handlePageMarksChange({
        ...pageMarks,
        stamps: updateStampById(pageMarks.stamps, id, stamp),
      });
    },
    [handlePageMarksChange, pageMarks],
  );

  const handleStampDelete = useCallback(() => {
    if (!selectedStampId) return;
    pushHistory();
    const stamps = removeStampById(pageMarks.stamps, selectedStampId);
    handlePageMarksChange({ ...pageMarks, stamps });
    setSelectedStampId(null);
  }, [handlePageMarksChange, pageMarks, pushHistory, selectedStampId]);

  useEffect(() => {
    if (tool !== 'stamp' || !selectedStampId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      handleStampDelete();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tool, selectedStampId, handleStampDelete]);

  const effectiveLoupeCenter = loupeDrawing ? loupeLockedCenter : loupeCenter;

  const otherLayers = useMemo(
    () => layers.filter((layer) => !layer.is_mine),
    [layers],
  );

  const handleShowAllLayers = useCallback(() => {
    setVisibleUsers(buildShowAllVisibility(layers));
  }, [layers]);

  const handleShowMineOnly = useCallback(() => {
    setVisibleUsers(buildMineOnlyVisibility(layers));
  }, [layers]);

  const renderOverlays = () => (
    <>
      {otherLayers
        .filter((layer) => visibleUsers[layer.user_id] ?? true)
        .map((layer) => (
          <MarkupOverlay
            key={layer.user_id}
            marks={getPageMarks(layer.payload, page)}
            layerColor={layerColorForUser(layer.user_id)}
            savedStamp={layer.saved_stamp ?? null}
          />
        ))}
      {!markMode && ownLayer ? (
        <MarkupOverlay
          marks={getPageMarks(ownPayload, page)}
          savedStamp={userSavedStamp}
        />
      ) : null}
      {markMode && loupeActive ? (
        <MarkupOverlay marks={pageMarks} savedStamp={userSavedStamp} />
      ) : null}
    </>
  );

  const editorOverlay = markMode ? (
    <MarkupEditorCanvas
      marks={pageMarks}
      tool={tool}
      color={color}
      penWidth={penWidthForPreset(penPreset)}
      mapClientPoint={(x, y) => mapClientPointRef.current(x, y)}
      imageWidth={imageDims.width}
      imageHeight={imageDims.height}
      onChange={handlePageMarksChange}
      onBeforeChange={pushHistory}
      onStampPlace={handleStampPlace}
      savedStamp={userSavedStamp}
      selectedStampId={selectedStampId}
      onSelectStamp={setSelectedStampId}
      onStampUpdate={handleStampUpdate}
      validateMarks={validateMarksBudget}
    />
  ) : null;

  const renderViewport = (url: string) => (
    <MarkupImageViewport
      imageUrl={url}
      imageWidth={imageDims.width}
      imageHeight={imageDims.height}
      activeTool={markMode ? tool : 'pan'}
      loupeDrawMode={loupeActive}
      viewportMeasureRef={pdfMeasureRef}
      onMainViewportClick={loupeActive ? handleMainViewportClick : undefined}
      onViewportReady={handleViewportReady}
      onImageDimensions={(width, height) => {
        setImageDims({ width, height });
        setLoupeCenter((current) =>
          current.x === 0 && current.y === 0 ? { x: width / 2, y: height / 2 } : current,
        );
      }}
      className="min-h-0 flex-1"
      overlay={renderOverlays()}
      editorOverlay={editorOverlay}
    />
  );

  const previewContent = isPdf ? (
    <AttachmentPdfPageViewer
      attachment={attachment}
      page={page}
      onPageChange={setPage}
      className="min-h-0 flex-1"
      pageAspect={pageAspect}
      targetWidth={pdfTargetWidth}
      renderPageImage={({ url }) => {
        pdfPageUrlRef.current = url;
        return renderViewport(url);
      }}
    />
  ) : previewUrl ? (
    renderViewport(previewUrl)
  ) : null;

  const loupePortal = portalContainer ?? null;
  const loupeElement =
    loupeActive && loupePlaced && imageUrl && loupePortal ? (
      <MarkupDrawLoupe
        imageUrl={imageUrl}
        imageWidth={imageDims.width}
        imageHeight={imageDims.height}
        center={effectiveLoupeCenter}
        lockedCenter={loupeLockedCenter}
        locked={loupeDrawing}
        marks={pageMarks}
        penColor={color}
        penWidth={loupeStrokeWidth(penWidthForPreset(penPreset))}
        pointerClientX={0}
        pointerClientY={0}
        placement={loupePlacement}
        portalContainer={loupePortal}
        onDrawingChange={handleLoupeDrawingChange}
        onBeforeStroke={pushHistory}
        onStrokeComplete={handleLoupeStrokeComplete}
      />
    ) : null;

  const eventLogPanel = (
    <MarkupEventLogPanel
      attachmentId={attachment.id}
      markupEnabled={markupEnabled}
      layers={layers}
      visibleUsers={visibleUsers}
      onVisibleUsersChange={(userId, visible) =>
        setVisibleUsers((current) => ({ ...current, [userId]: visible }))
      }
      onShowAllLayers={handleShowAllLayers}
      onShowMineOnly={handleShowMineOnly}
      markMode={markMode}
      ownLayerColor={color}
    />
  );

  const saveStatusLabel =
    saveStatus === 'saving'
      ? markupCopy.savingLabel
      : saveStatus === 'saved'
        ? markupCopy.savedLabel
        : saveStatus === 'error'
          ? markupCopy.saveFailedStatus
          : null;

  const markButtonLabel =
    !markMode && layerCount > 0
      ? `${markupCopy.markModeLabel} (${layerCount})`
      : markupCopy.markModeLabel;

  const marksUnavailableMessage = import.meta.env.DEV
    ? markupCopy.marksUnavailable
    : markupCopy.marksUnavailableShort;

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      {markupEnabled && isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {marksUnavailableMessage}
        </p>
      ) : null}

      {markupEnabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={markMode ? 'default' : 'outline'}
            aria-pressed={markMode}
            onClick={() => onMarkModeChange(!markMode)}
          >
            <PencilLine className="mr-1.5 h-4 w-4" />
            {markButtonLabel}
          </Button>
          {isLoading ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading marks…
            </span>
          ) : null}
          {markMode && saveStatusLabel ? (
            <span
              className={cn(
                'text-xs',
                saveStatus === 'saved'
                  ? 'text-muted-foreground'
                  : saveStatus === 'error'
                    ? 'text-destructive'
                    : 'text-foreground',
              )}
            >
              {saveStatusLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {markMode ? (
        <div className="flex min-h-0 min-w-0 flex-1 gap-3">
          <div className="flex min-h-0 min-w-0 flex-1 gap-3">
            <MarkupEditorToolbar
              orientation="vertical"
              tool={tool}
              onToolChange={setTool}
              penPreset={penPreset}
              onPenPresetChange={setPenPreset}
              color={color}
              onColorChange={setColor}
              onUndo={undo}
              canUndo={history.length > 0}
              onClearPage={handleClearPage}
              onResetView={handleResetView}
              loupeEnabled={loupeEnabled}
              onLoupeEnabledChange={setLoupeEnabled}
              stampAvailable={!!userSavedStamp}
              className="self-stretch shrink-0"
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              {loupeActive && !loupePlaced ? (
                <p className="shrink-0 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
                  {markupCopy.loupePlaceHint}
                </p>
              ) : null}
              {tool === 'stamp' && userSavedStamp ? (
                <p className="shrink-0 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
                  {markupCopy.stampPlaceHint}
                </p>
              ) : null}
              {previewContent}
            </div>
          </div>
          {eventLogPanel}
          {loupeElement}
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 gap-3">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">{previewContent}</div>
          {eventLogPanel}
        </div>
      )}
    </div>
  );
}
