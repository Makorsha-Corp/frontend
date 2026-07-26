import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_LIMITS } from '@/constants/apiLimits';
import { sheetPageCount } from '@/pages/newpages/orders/workOrderSheetApiParams';

export interface WorkOrdersSheetPaginationProps {
  page: number;
  total: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = API_LIMITS.WORK_ORDERS_SHEET_PAGE_SIZE;

const WorkOrdersSheetPagination: React.FC<WorkOrdersSheetPaginationProps> = ({
  page,
  total,
  isFetching = false,
  onPageChange,
}) => {
  const pageCount = sheetPageCount(total, PAGE_SIZE);
  const showFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showTo = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);
  const pageOptions = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        {total === 0
          ? 'No work orders'
          : `Showing ${showFrom}–${showTo} of ${total}${isFetching ? '…' : ''}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">Page</span>
        <Select
          value={String(page)}
          onValueChange={(value) => onPageChange(Number(value))}
          disabled={isFetching || pageCount <= 1}
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
        <span className="text-muted-foreground">of {pageCount}</span>
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
          disabled={page >= pageCount || isFetching}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WorkOrdersSheetPagination;
