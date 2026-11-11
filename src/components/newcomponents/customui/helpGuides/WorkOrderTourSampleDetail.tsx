import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Wrench } from 'lucide-react';
import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';
import { Button } from '@/components/ui/button';
import {
  TOUR_SAMPLE_INERT_CLASS,
  TourSampleCollaborationSection,
  TourSampleDashedValue,
  TourSampleField,
} from '@/components/newcomponents/customui/helpGuides/tourSampleShared';
import { OrderApprovalsSummary } from '@/components/newcomponents/customui/orders/approvals/OrderApprovalsBarShell';
import { cn } from '@/lib/utils';

const WorkOrderTourSampleDetail: React.FC = () => (
  <div
    data-help-tour="work-orders.detail"
    className={`flex h-full min-h-0 flex-col overflow-hidden bg-background ${TOUR_SAMPLE_INERT_CLASS}`}
  >
    <div className="shrink-0 border-b border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:flex-nowrap lg:px-6">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" tabIndex={-1} aria-hidden>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg leading-tight">
              <ReferenceId size="base" tone="default" weight="medium" className="text-card-foreground">
                WO-2026-SAMPLE
              </ReferenceId>
            </h1>
            <p className="text-sm text-muted-foreground truncate">Replace ring frame belt · Ring frame #3</p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-400">
          Planned
        </Badge>
        <div className={cn('ml-auto flex shrink-0 items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1.5')}>
          <OrderApprovalsSummary approvalSummary={{ approved_count: 0, required: 1, met: false }} />
        </div>
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
                Work order details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TourSampleField label="Planned date">
                  <TourSampleDashedValue>Mar 14, 2026</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Work type">
                  <TourSampleDashedValue>Maintenance</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Machine">
                  <TourSampleDashedValue>Ring frame #3</TourSampleDashedValue>
                </TourSampleField>
                <TourSampleField label="Priority">
                  <TourSampleDashedValue>Normal</TourSampleDashedValue>
                </TourSampleField>
              </div>
              <TourSampleField label="Notes">
                <Textarea
                  readOnly
                  value="Shut down line 20 min before start. Belt kit in storage bin B-12."
                  className="min-h-[72px] resize-none bg-background"
                />
              </TourSampleField>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Shift</span>
              <span className="font-medium">Day</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Est. duration</span>
              <span className="font-medium">2 h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <TourSampleCollaborationSection />
    </div>
  </div>
);

export default WorkOrderTourSampleDetail;
