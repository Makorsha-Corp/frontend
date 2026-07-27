import React from 'react';
import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';
import { ORDER_HUB_PAGE_SIZE } from '@/pages/newpages/orders/orderHubApiParams';

export interface OrderHubPaginationProps {
  page: number;
  total: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

const OrderHubPagination: React.FC<OrderHubPaginationProps> = ({
  page,
  total,
  isFetching = false,
  onPageChange,
}) => (
  <ListPagePagination
    page={page}
    total={total}
    pageSize={ORDER_HUB_PAGE_SIZE}
    isFetching={isFetching}
    onPageChange={onPageChange}
  />
);

export default OrderHubPagination;
