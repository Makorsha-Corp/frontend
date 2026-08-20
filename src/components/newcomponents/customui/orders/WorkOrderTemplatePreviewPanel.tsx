import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileX2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import {
  useGetWorkOrderTemplateApproversQuery,
  useGetWorkOrderTemplateItemsQuery,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import {
  formatRecurrenceCadence,
  formatRecurrenceRange,
} from '@/pages/newpages/orders/workOrderTemplateLabels';
import { priorityLabel, workOrderItemActionLabel } from '@/pages/newpages/orders/workOrderConstants';
import { cn } from '@/lib/utils';

export interface WorkOrderTemplatePreviewPanelProps {
  template: WorkOrderTemplate | null;
  highlightNone?: boolean;
  /** Pick = Add work template selector; manage = header Templates manager. */
  context?: 'pick' | 'manage';
  machines?: Machine[];
  sections?: FactorySection[];
  className?: string;
}

function formatBillingSummary(template: WorkOrderTemplate): string {
  if (template.account_id) return 'External vendor account';
  if (template.cost != null && Number(template.cost) > 0) {
    return `Internal misc cost · ${template.cost}`;
  }
  return 'None';
}

function resolveMachineName(template: WorkOrderTemplate, machines: Machine[]): string | null {
  if (!template.default_machine_id) return null;
  return machines.find((m) => m.id === template.default_machine_id)?.name ?? `Machine #${template.default_machine_id}`;
}

function PreviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2 text-xs">
      <span className="w-[5.5rem] shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-foreground">{value}</span>
    </div>
  );
}

const WorkOrderTemplatePreviewPanel: React.FC<WorkOrderTemplatePreviewPanelProps> = ({
  template,
  highlightNone = false,
  context = 'pick',
  machines = [],
  sections: _sections = [],
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const templateId = template?.id ?? 0;
  const showPartsDetail = expanded && Boolean(template);
  const showApproversDetail = expanded && Boolean(template?.requires_approval);

  useEffect(() => {
    setExpanded(false);
  }, [template?.id, highlightNone]);

  const { data: items = [], isLoading: itemsLoading } = useGetWorkOrderTemplateItemsQuery(templateId, {
    skip: !templateId,
  });

  const { data: approvers = [], isLoading: approversLoading } = useGetWorkOrderTemplateApproversQuery(
    templateId,
    { skip: !templateId || !template?.requires_approval },
  );

  const hasExpandableDetail =
    Boolean(template && (template.uses_inventory || items.length > 0 || template.requires_approval));

  if (!template) {
    if (context === 'manage') {
      return (
        <div
          className={cn(
            'flex min-h-[8rem] flex-col justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center',
            className,
          )}
        >
          <FileX2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-foreground">Template details</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a template to preview work type, parts, billing, and recurrence.
          </p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex min-h-[8rem] flex-col justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center',
          className,
        )}
      >
        <FileX2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">No template</p>
        <p className="mt-1 text-xs text-muted-foreground">Start from scratch — fill fields manually on the entry.</p>
      </div>
    );
  }

  if (highlightNone) {
    return (
      <div
        className={cn(
          'flex min-h-[8rem] flex-col justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center',
          className,
        )}
      >
        <FileX2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">No template</p>
        <p className="mt-1 text-xs text-muted-foreground">Start from scratch — fill fields manually on the entry.</p>
      </div>
    );
  }

  const machineName = resolveMachineName(template, machines);
  const cadence = formatRecurrenceCadence(template);
  const range = formatRecurrenceRange(template);
  const partCount = items.length;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/15',
        className,
      )}
    >
      <div className="shrink-0 border-b border-border/60 px-3 py-2">
        <p className="truncate text-sm font-medium text-foreground">{template.template_name}</p>
        {template.is_recurring && cadence ? (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
              Recurring · {cadence}
            </Badge>
            {range ? <span className="text-[10px] text-muted-foreground">{range}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2.5">
        <PreviewRow label="Work type" value={template.work_order_type_name ?? 'Not set'} />
        <PreviewRow label="Workers" value={template.assigned_to?.trim() || 'Not set'} />
        <PreviewRow label="Machine" value={machineName ?? 'Not set'} />
        <PreviewRow label="Priority" value={priorityLabel(template.priority)} />
        <PreviewRow label="Billing" value={formatBillingSummary(template)} />
        <PreviewRow
          label="Parts"
          value={
            template.uses_inventory || partCount > 0
              ? `${partCount} line${partCount === 1 ? '' : 's'}`
              : 'None'
          }
        />
        <PreviewRow
          label="Approval"
          value={
            template.requires_approval
              ? approvers.length > 0
                ? `${approvers.length} approver${approvers.length === 1 ? '' : 's'}`
                : 'Required'
              : 'None'
          }
        />
        {template.is_recurring && !range ? (
          <p className="text-[10px] leading-snug text-muted-foreground">
            Set start and end dates on the sheet after apply.
          </p>
        ) : null}

        {hasExpandableDetail ? (
          <div className="border-t border-border/60 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-start gap-1 px-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
              {expanded ? 'Hide parts & approvers' : 'Show parts & approvers'}
            </Button>

            {showPartsDetail && (template.uses_inventory || items.length > 0) ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Parts</p>
                {itemsLoading ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading parts…
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Uses inventory — no default lines saved.</p>
                ) : (
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.id} className="text-xs text-foreground">
                        <span className="font-medium">{item.item_name ?? `Item #${item.item_id}`}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {item.quantity} · {workOrderItemActionLabel(item.action_type)}
                          {item.action_type === 'REPLACE' && item.replaced_item_name ? (
                            <span> · replaces {item.replaced_item_name}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {showApproversDetail ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Approvers</p>
                {approversLoading ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading approvers…
                  </div>
                ) : approvers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No approvers saved on template.</p>
                ) : (
                  <ul className="space-y-0.5">
                    {approvers.map((a) => (
                      <li key={a.id} className="text-xs text-foreground">
                        {a.user_name ?? `User #${a.user_id}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="shrink-0 border-t border-border/60 px-3 py-2 text-[10px] leading-snug text-muted-foreground">
        {context === 'pick'
          ? 'Date, remarks, and workers stay editable after apply.'
          : 'Edit template to change these defaults.'}
      </p>
    </div>
  );
};

export default WorkOrderTemplatePreviewPanel;
