import React from 'react';
import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';
import { API_LIMITS } from '@/constants/apiLimits';

export interface WorkOrdersSheetPaginationProps {
  page: number;
  total: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

const WorkOrdersSheetPagination: React.FC<WorkOrdersSheetPaginationProps> = ({
  page,
  total,
  isFetching = false,
  onPageChange,
}) => (
  <ListPagePagination
    page={page}
    total={total}
    pageSize={API_LIMITS.WORK_ORDERS_SHEET_PAGE_SIZE}
    isFetching={isFetching}
    onPageChange={onPageChange}
  />
);

export default WorkOrdersSheetPagination;
