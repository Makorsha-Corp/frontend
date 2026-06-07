import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type OrdersTableColumnAlign = 'left' | 'right' | 'center';

export interface OrdersOverviewTableColumn<T> {
  id: string;
  header: string;
  align?: OrdersTableColumnAlign;
  headerClassName?: string;
  cellClassName?: string;
  cell: (row: T) => React.ReactNode;
}

export interface OrdersOverviewTableProps<T extends { id: number | string }> {
  title: string;
  subtitle?: string;
  columns: OrdersOverviewTableColumn<T>[];
  rows: T[];
  onRowClick: (row: T) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  titleAddon?: React.ReactNode;
}

function alignClass(align?: OrdersTableColumnAlign): string {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return '';
}

function OrdersOverviewTable<T extends { id: number | string }>({
  title,
  subtitle,
  columns,
  rows,
  onRowClick,
  emptyMessage = 'No orders match these filters.',
  emptyIcon,
  className,
  headerActions,
  titleAddon,
}: OrdersOverviewTableProps<T>) {
  const hasToolbar = Boolean(headerActions || titleAddon);

  return (
    <Card className={cn('border-border', className)}>
      {hasToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="text-base font-semibold leading-none">{title}</CardTitle>
            {titleAddon}
          </div>
          {headerActions ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">{headerActions}</div>
          ) : null}
        </div>
      ) : (
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
      )}
      <CardContent className="p-0 pb-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-muted-foreground">
            {emptyIcon}
            <p className="text-sm text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col.id}
                      className={cn(alignClass(col.align), col.headerClassName)}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick(row)}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(alignClass(col.align), col.cellClassName)}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrdersOverviewTable;
