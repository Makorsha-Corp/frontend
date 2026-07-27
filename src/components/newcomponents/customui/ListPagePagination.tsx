import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ListPagePaginationProps {
  page: number;
  total: number;
  pageSize: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

const MAX_PAGE_SELECT_OPTIONS = 200;

function pageCount(total: number, pageSize: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

const ListPagePagination: React.FC<ListPagePaginationProps> = ({
  page,
  total,
  pageSize,
  isFetching = false,
  onPageChange,
}) => {
  const totalPages = pageCount(total, pageSize);
  const usePageSelect = totalPages <= MAX_PAGE_SELECT_OPTIONS;
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  const commitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page));
      return;
    }
    const clamped = Math.min(totalPages, Math.max(1, Math.floor(parsed)));
    setPageInput(String(clamped));
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">Page</span>
      {usePageSelect ? (
          <Select
            value={String(page)}
            onValueChange={(value) => onPageChange(Number(value))}
            disabled={isFetching || totalPages <= 1}
          >
            <SelectTrigger className="h-8 w-[4.5rem]" aria-label="Go to page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageOptions.map((pageNumber) => (
                <SelectItem key={pageNumber} value={String(pageNumber)}>
                  {pageNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitPageInput();
              }}
              disabled={isFetching || totalPages <= 1}
              className="h-8 w-[4.5rem] px-2 tabular-nums"
              aria-label="Go to page"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isFetching || totalPages <= 1}
              onClick={commitPageInput}
            >
              Go
            </Button>
          </>
        )}
      <span className="text-muted-foreground">of {totalPages}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page <= 1 || isFetching}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page >= totalPages || isFetching}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ListPagePagination;
