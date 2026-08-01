import React, { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';

import { useGetItemOrdersQuery } from '@/features/items/itemsApi';

import {

  formatMoney,

  formatOrderDate,

  formatQty,

} from '@/components/newcomponents/customui/item-details/itemDetailsFormatters';

import {

  placementTableBodyRow,

  placementTableHeadCell,

  placementTableHeadRow,

  placementTableShell,

} from '@/components/newcomponents/customui/item-details/itemDetailsStyles';

import { cn } from '@/lib/utils';



const PAGE_SIZE = 10;



export interface PoItemPurchaseHistoryDialogProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  itemId: number | null;

  itemName?: string | null;

  itemUnit?: string | null;

  excludePurchaseOrderId?: number | null;

  onSelectPurchaseOrder: (purchaseOrderId: number) => void;

}



function formatUnitPrice(value: number | string | null | undefined): string {

  if (value == null || value === '') return '—';

  return `$${formatMoney(value)}`;

}



const PoItemPurchaseHistoryDialog: React.FC<PoItemPurchaseHistoryDialogProps> = ({

  open,

  onOpenChange,

  itemId,

  itemName,

  itemUnit,

  excludePurchaseOrderId,

  onSelectPurchaseOrder,

}) => {

  const [page, setPage] = useState(1);



  useEffect(() => {

    if (open) setPage(1);

  }, [open, itemId, excludePurchaseOrderId]);



  const { data, isLoading, isFetching, isError } = useGetItemOrdersQuery(

    {

      itemId: itemId!,

      order_type: 'purchase_order',

      skip: (page - 1) * PAGE_SIZE,

      limit: PAGE_SIZE,

      excludePurchaseOrderId: excludePurchaseOrderId ?? undefined,

    },

    { skip: !open || itemId == null },

  );



  const rows = data?.items ?? [];

  const total = data?.total ?? 0;

  const showPagination = total > PAGE_SIZE;



  const title = itemName?.trim()

    ? `Purchase history · ${itemName.trim()}`

    : 'Purchase history';



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent

        className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden p-0"

        data-testid="po-item-purchase-history-dialog"

      >

        <DialogHeader className="shrink-0 px-6 pt-6">

          <DialogTitle>{title}</DialogTitle>

          <DialogDescription className="sr-only">

            Prior purchase orders for this catalog item. Select a row to view order summary.

          </DialogDescription>

          {!isLoading && !isError && total > 0 ? (

            <p className="text-sm text-muted-foreground">

              {total} purchase order{total === 1 ? '' : 's'}

            </p>

          ) : null}

        </DialogHeader>



        <div className="flex-1 min-h-0 overflow-y-auto px-6 pr-7">

          {isLoading ? (

            <div className="flex items-center justify-center py-12 text-muted-foreground">

              <Loader2 className="h-5 w-5 animate-spin" />

            </div>

          ) : isError ? (

            <p className="py-8 text-center text-sm text-destructive">

              Unable to load purchase history.

            </p>

          ) : rows.length === 0 ? (

            <p className="py-8 text-center text-sm text-muted-foreground">

              No prior purchase orders for this item.

            </p>

          ) : (

            <div className={placementTableShell}>

              <table className="w-full text-sm">

                <thead>

                  <tr className={placementTableHeadRow}>

                    <th className={cn(placementTableHeadCell, 'text-left')}>PO</th>

                    <th className={cn(placementTableHeadCell, 'text-left')}>Date</th>

                    <th className={cn(placementTableHeadCell, 'text-left')}>Supplier</th>

                    <th className={cn(placementTableHeadCell, 'text-left')}>Destination</th>

                    <th className={cn(placementTableHeadCell, 'text-right')}>Qty</th>

                    <th className={cn(placementTableHeadCell, 'text-right')}>Unit price</th>

                    <th className={cn(placementTableHeadCell, 'text-left')}>Status</th>

                  </tr>

                </thead>

                <tbody>

                  {rows.map((row) => (

                    <tr

                      key={row.order_id}

                      className={cn(

                        placementTableBodyRow,

                        'cursor-pointer hover:bg-muted/40',

                      )}

                      data-testid={`po-item-history-row-${row.order_id}`}

                      onClick={() => onSelectPurchaseOrder(row.order_id)}

                    >

                      <td className="px-3 py-2.5 font-medium text-brand-primary">

                        {row.order_number}

                      </td>

                      <td className="px-3 py-2.5 text-muted-foreground">

                        {formatOrderDate(row.order_date)}

                      </td>

                      <td className="px-3 py-2.5">

                        <span className="block truncate">{row.account_name || '—'}</span>

                      </td>

                      <td className="px-3 py-2.5">

                        <span className="block truncate text-muted-foreground">

                          {row.destination_label || '—'}

                        </span>

                      </td>

                      <td className="px-3 py-2.5 text-right tabular-nums">

                        {formatQty(row.quantity, itemUnit ?? undefined)}

                      </td>

                      <td className="px-3 py-2.5 text-right tabular-nums">

                        {formatUnitPrice(row.unit_price)}

                      </td>

                      <td className="px-3 py-2.5">

                        {row.status_name ? (

                          <Badge

                            variant="secondary"

                            className="max-w-[120px] truncate text-[10px] font-medium"

                          >

                            {row.status_name.replace(/_/g, ' ')}

                          </Badge>

                        ) : (

                          '—'

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>



        {showPagination ? (

          <ListPagePagination

            page={page}

            total={total}

            pageSize={PAGE_SIZE}

            isFetching={isFetching}

            onPageChange={setPage}

          />

        ) : null}



        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">

          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>

            Close

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

};



export default PoItemPurchaseHistoryDialog;


