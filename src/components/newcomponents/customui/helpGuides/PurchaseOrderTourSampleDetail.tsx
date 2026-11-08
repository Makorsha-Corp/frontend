import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, FileText, Package } from 'lucide-react';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import {
  ORDER_DETAIL_BODY_CLASS_LOOSE,
  ORDER_DETAIL_SCROLL_CLASS,
} from '@/components/newcomponents/customui/orders/orderListConstants';
import {
  TOUR_SAMPLE_INERT_CLASS,
  TourSampleApprovalsBar,
  TourSampleCollaborationSection,
  TourSampleDashedValue,
  TourSampleField,
  TourSampleSectionConfirm,
  TourSampleWorkflowCard,
} from '@/components/newcomponents/customui/helpGuides/tourSampleShared';

const SAMPLE_ITEMS = [
  { name: 'Ring frame spare belt', qty: '4', unit: 'pcs', price: '$48.00', total: '$192.00' },
  { name: 'Lubricating oil (20L)', qty: '2', unit: 'drum', price: '$125.00', total: '$250.00' },
];

const PurchaseOrderTourSampleDetail: React.FC = () => (
  <div
    data-help-tour="purchase.detail"
    className={`flex h-full min-h-0 flex-col overflow-hidden bg-background ${TOUR_SAMPLE_INERT_CLASS}`}
  >
    <div className={ORDER_DETAIL_SCROLL_CLASS}>
      <TourSampleApprovalsBar id="po-tour-approvals-bar" approvedCount={1} required={2} />

      <div className={ORDER_DETAIL_BODY_CLASS_LOOSE}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto] lg:items-stretch">
          <Card
            id="po-section-details"
            className="order-1 scroll-mt-6 lg:col-span-2 lg:row-start-1 flex flex-col"
          >
            <CardHeader className="p-4 pb-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Order Details
                </CardTitle>
                <TourSampleSectionConfirm id="po-confirm-details" label="order details" confirmed />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TourSampleField label="Destination Type">
                  <TourSampleDashedValue>Storage</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Location">
                  <TourSampleDashedValue>Factory 1 · Main storage</TourSampleDashedValue>
                </TourSampleField>
              </div>
              <TourSampleField label="Order Date" className="sm:max-w-xs">
                <TourSampleDashedValue>Mar 12, 2026</TourSampleDashedValue>
              </TourSampleField>
              <TourSampleField label="Description">
                <Textarea
                  readOnly
                  value="Routine spares restock for ring frame section."
                  className="min-h-[56px] resize-none bg-background"
                />
              </TourSampleField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TourSampleField label="Expected Delivery">
                  <TourSampleDashedValue>Mar 20, 2026</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Completed">
                  <TourSampleDashedValue>
                    <span className="text-muted-foreground text-xs">Set when all items received</span>
                  </TourSampleDashedValue>
                </TourSampleField>
              </div>
            </CardContent>
          </Card>

          <TourSampleWorkflowCard
            title="Purchase workflow"
            className="order-3 max-lg:h-auto max-lg:w-full lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:h-full"
          />

          <Card id="po-section-supplier" className="order-2 scroll-mt-6 lg:col-span-2 lg:row-start-2">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Supplier
                </CardTitle>
                <TourSampleSectionConfirm id="po-confirm-supplier" label="supplier" confirmed={false} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <AccountSelectSummaryButton
                onClick={() => {}}
                ariaLabel="Supplier"
                selectedLine="Akbar Cotton Supplies"
                compactLabel
                className="mt-0"
              />
            </CardContent>
          </Card>
        </div>

        <Card id="po-section-items" className="scroll-mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Order Items and Prices
                <Badge variant="outline" className="ml-1 font-normal">
                  {SAMPLE_ITEMS.length}
                </Badge>
              </CardTitle>
              <TourSampleSectionConfirm id="po-confirm-items" label="order items and prices" confirmed={false} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2 w-12 text-center">#</TableHead>
                    <TableHead className="py-2">Item</TableHead>
                    <TableHead className="py-2 w-20 text-right">Qty</TableHead>
                    <TableHead className="py-2 w-28 text-right">Unit price</TableHead>
                    <TableHead className="py-2 w-28 text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_ITEMS.map((row, i) => (
                    <TableRow key={row.name}>
                      <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium text-card-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.unit}</p>
                      </TableCell>
                      <TableCell className="text-right">{row.qty}</TableCell>
                      <TableCell className="text-right">{row.price}</TableCell>
                      <TableCell className="text-right font-medium">{row.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <TourSampleCollaborationSection />
      </div>
    </div>
  </div>
);

export default PurchaseOrderTourSampleDetail;
