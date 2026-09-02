import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePdfPageTargetWidth } from '@/hooks/usePdfPageTargetWidth';
import { cn } from '@/lib/utils';
import { useGetAttachmentPdfPageQuery } from '@/features/attachments/attachmentsApi';
import type { Attachment } from '@/types/attachment';

export interface PdfPageImageContext {
  url: string;
  page: number;
  onImageDimensions: (width: number, height: number) => void;
}

export interface AttachmentPdfPageViewerProps {
  attachment: Attachment;
  className?: string;
  imageClassName?: string;
  page?: number;
  onPageChange?: (page: number) => void;
  imageOverlay?: React.ReactNode;
  renderPageImage?: (ctx: PdfPageImageContext) => React.ReactNode;
  /** Page width/height ratio for sharper raster when height-limited. */
  pageAspect?: number;
  /** When set, overrides internal ResizeObserver width bucket. */
  targetWidth?: number;
}

export default function AttachmentPdfPageViewer({
  attachment,
  className,
  imageClassName,
  page: controlledPage,
  onPageChange,
  imageOverlay,
  renderPageImage,
  pageAspect,
  targetWidth: targetWidthProp,
}: AttachmentPdfPageViewerProps) {
  const [internalPage, setInternalPage] = useState(1);
  const page = controlledPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;

  const viewportRef = useRef<HTMLDivElement>(null);
  const internalTargetWidth = usePdfPageTargetWidth(viewportRef, { pageAspect });
  const targetWidth = targetWidthProp ?? internalTargetWidth;

  const [knownPageCount, setKnownPageCount] = useState<number | null>(
    attachment.page_count,
  );
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (controlledPage === undefined) {
      setInternalPage(1);
    }
    setKnownPageCount(attachment.page_count);
    setImageError(false);
  }, [attachment.id, attachment.page_count, controlledPage]);

  useEffect(() => {
    setImageError(false);
  }, [page]);

  const { data, isFetching, isError, error } = useGetAttachmentPdfPageQuery(
    { attachmentId: attachment.id, page, width: targetWidth },
    { skip: !attachment.id },
  );

  useEffect(() => {
    if (data?.page_count != null) {
      setKnownPageCount(data.page_count);
    }
  }, [data?.page_count]);

  useEffect(() => {
    setImageError(false);
  }, [data?.url, page, targetWidth]);

  const canGoPrev = page > 1;
  const canGoNext =
    knownPageCount != null ? page < knownPageCount : !imageError && !isError;

  const goPrev = () => {
    if (!canGoPrev) return;
    setPage(Math.max(1, page - 1));
  };

  const goNext = () => {
    if (!canGoNext) return;
    setPage(page + 1);
  };

  const pageLabel =
    knownPageCount != null
      ? `Page ${page} of ${knownPageCount}`
      : `Page ${page}`;

  const apiDetail =
    error && typeof error === 'object' && 'data' in error
      ? (error as { data?: { detail?: string } }).data?.detail
      : undefined;

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      <div
        ref={viewportRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-muted/20"
      >
        {isFetching && !data?.url ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading page…
          </div>
        ) : null}

        {data?.url && !imageError ? (
          renderPageImage ? (
            <div className="flex h-full min-h-0 w-full flex-1 flex-col [&>*]:min-h-0 [&>*]:flex-1">
              {renderPageImage({
                url: data.url,
                page,
                onImageDimensions: () => undefined,
              })}
            </div>
          ) : (
            <div className="relative flex h-full min-h-0 w-full items-center justify-center">
              <img
                key={`${attachment.id}-${page}-${targetWidth}-${data.url}`}
                src={data.url}
                alt={`${attachment.file_name} — page ${page}`}
                className={cn(
                  'h-full w-full rounded-md object-contain',
                  isFetching && 'opacity-60',
                  imageClassName,
                )}
                onError={() => setImageError(true)}
              />
              {imageOverlay ? (
                <div className="absolute inset-0">{imageOverlay}</div>
              ) : null}
            </div>
          )
        ) : null}

        {(isError || imageError) && !isFetching && !data?.url ? (
          <p className="px-4 text-center text-sm text-muted-foreground">
            {apiDetail ?? `Could not load page ${page}.`}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrev || isFetching}
          onClick={goPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[7rem] text-center text-sm tabular-nums text-muted-foreground">
          {pageLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext || isFetching}
          onClick={goNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
