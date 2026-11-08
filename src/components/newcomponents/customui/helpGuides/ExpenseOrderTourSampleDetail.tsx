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
import { Receipt } from 'lucide-react';
import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
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

const ExpenseOrderTourSampleDetail: React.FC = () => (
  <div
    data-help-tour="expense.detail"
    className={`flex h-full min-h-0 flex-col overflow-hidden ${TOUR_SAMPLE_INERT_CLASS}`}
  >
    <div className={ORDER_DETAIL_SCROLL_CLASS}>
      <TourSampleApprovalsBar id="eo-tour-approvals-bar" approvedCount={0} required={1} />

      <div className={ORDER_DETAIL_BODY_CLASS}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_min(280px,32%)] items-start">
          <Card id="eo-section-details" className="scroll-mt-6">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Order details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 break-words">
                    Factory ·{' '}
                    <ReferenceId tone="inherit" weight="medium">
                      EXP-2026-SAMPLE
                    </ReferenceId>
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 self-start">
                  Pending approval
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TourSampleField label="Account">
                  <AccountSelectSummaryButton
                    onClick={() => {}}
                    ariaLabel="Account"
                    selectedLine="City Power & Light"
                    compactLabel
                    className="mt-0"
                  />
                </TourSampleField>
                <TourSampleField label="Attribute to">
                  <TourSampleDashedValue>Factory</TourSampleDashedValue>
                </TourSampleField>
              </div>
              <TourSampleField label="Factory">
                <TourSampleDashedValue>Factory 1</TourSampleDashedValue>
              </TourSampleField>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TourSampleField label="Created">
                  <TourSampleDashedValue>Mar 1, 2026</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Expense date">
                  <TourSampleDashedValue>Mar 1, 2026</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Due date">
                  <TourSampleDashedValue>Mar 15, 2026</TourSampleDashedValue>
                </TourSampleField>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="eo-description" className="text-xs font-medium text-muted-foreground">
                  Description *
                </Label>
                <Input id="eo-description" readOnly value="March electricity — production block" className="bg-background" />
              </div>
            </CardContent>
          </Card>

          <TourSampleWorkflowCard title="Expense workflow" />
        </div>

        <Card id="eo-section-items" className="scroll-mt-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  Expenses (2)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Total $1,850.00</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2">Description</TableHead>
                    <TableHead className="py-2 w-28 text-right">Qty</TableHead>
                    <TableHead className="py-2 w-32 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <p className="font-medium">Peak demand charge</p>
                      <p className="text-xs text-muted-foreground">City Power & Light</p>
                    </TableCell>
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right">$1,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <p className="font-medium">Meter service fee</p>
                      <p className="text-xs text-muted-foreground">City Power & Light</p>
                    </TableCell>
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right">$350.00</TableCell>
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

export default ExpenseOrderTourSampleDetail;
