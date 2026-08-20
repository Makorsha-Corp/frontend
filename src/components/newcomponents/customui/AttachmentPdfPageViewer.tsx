import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
}

export default function AttachmentPdfPageViewer({
  attachment,
  className,
  imageClassName,
  page: controlledPage,
  onPageChange,
  imageOverlay,
  renderPageImage,
}: AttachmentPdfPageViewerProps) {
  const [internalPage, setInternalPage] = useState(1);
  const page = controlledPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;

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

  const { data, isFetching, isError, error } = useGetAttachmentPdfPageQuery(
    { attachmentId: attachment.id, page },
    { skip: !attachment.id },
  );

  useEffect(() => {
    if (data?.page_count != null) {
      setKnownPageCount(data.page_count);
    }
  }, [data?.page_count]);

  useEffect(() => {
    setImageError(false);
  }, [data?.url, page]);

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
      <div className="relative flex min-h-[20rem] flex-1 items-center justify-center overflow-hidden rounded-md bg-muted/20">
        {isFetching && !data?.url ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading page…
          </div>
        ) : null}

        {data?.url && !imageError ? (
          renderPageImage ? (
            <div className="w-full">{renderPageImage({ url: data.url, page, onImageDimensions: () => undefined })}</div>
          ) : (
            <div className="relative mx-auto flex max-h-[70vh] w-fit max-w-full items-center justify-center">
              <img
                key={`${attachment.id}-${page}-${data.url}`}
                src={data.url}
                alt={`${attachment.file_name} — page ${page}`}
                className={cn(
                  'max-h-[70vh] w-auto max-w-full rounded-md object-contain',
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

        {(isError || imageError) && !isFetching ? (
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
