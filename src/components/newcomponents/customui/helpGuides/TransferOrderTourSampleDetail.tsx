import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeftRight, ArrowRight, Package, Warehouse } from 'lucide-react';
import {
  ORDER_DETAIL_BODY_CLASS,
  ORDER_DETAIL_SCROLL_CLASS,
} from '@/components/newcomponents/customui/orders/orderListConstants';
import {
  TOUR_SAMPLE_INERT_CLASS,
  TourSampleApprovalsBar,
  TourSampleCollaborationSection,
  TourSampleDashedValue,
  TourSampleField,
  TourSampleWorkflowCard,
} from '@/components/newcomponents/customui/helpGuides/tourSampleShared';

const TransferOrderTourSampleDetail: React.FC = () => (
  <div
    data-help-tour="transfer.detail"
    className={`flex h-full min-h-0 flex-col overflow-hidden ${TOUR_SAMPLE_INERT_CLASS}`}
  >
    <div className={ORDER_DETAIL_SCROLL_CLASS}>
      <TourSampleApprovalsBar id="tr-tour-approvals-bar" approvedCount={0} required={1} />

      <div className={ORDER_DETAIL_BODY_CLASS}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_min(280px,32%)] lg:items-stretch">
          <Card id="tr-section-route" className="scroll-mt-6 flex h-full flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    Order details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">storage → machine</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  In transit
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4">
              <div className="relative rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex w-full items-center gap-4">
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From</span>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                      <span className="font-semibold text-card-foreground truncate">Factory 1 storage</span>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-brand-primary shrink-0" aria-hidden />
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</span>
                    <span className="font-semibold text-card-foreground truncate">Ring frame #3</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TourSampleField label="Created">
                  <TourSampleDashedValue>Mar 10, 2026</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Completed">
                  <TourSampleDashedValue>
                    <span className="text-muted-foreground">—</span>
                  </TourSampleDashedValue>
                </TourSampleField>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="tr-description" className="text-xs font-medium text-muted-foreground">
                  Description
                </Label>
                <Input
                  id="tr-description"
                  readOnly
                  value="Move belts and oil to machine stock"
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          <TourSampleWorkflowCard title="Transfer workflow" />
        </div>

        <Card id="tr-section-items" className="scroll-mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Transfer items
              <Badge variant="outline" className="ml-1 font-normal">
                2
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2">Item</TableHead>
                    <TableHead className="py-2 w-28 text-right">Requested</TableHead>
                    <TableHead className="py-2 w-28 text-right">Transferred</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Ring frame spare belt</TableCell>
                    <TableCell className="text-right">4</TableCell>
                    <TableCell className="text-right text-muted-foreground">0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lubricating oil (20L)</TableCell>
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right text-muted-foreground">0</TableCell>
                  </TableRow>
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

export default TransferOrderTourSampleDetail;
