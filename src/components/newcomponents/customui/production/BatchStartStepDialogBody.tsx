import React from 'react';

import BatchStartStoragePreview from '@/components/newcomponents/customui/production/BatchStartStoragePreview';
import type { BatchInputStorageRow } from '@/lib/batchInputStorageCheck';
import type { ProductionBatchStageLog } from '@/types/production';

export interface BatchStartStepDialogBodyProps {
  stageLog: ProductionBatchStageLog;
  lineName: string | null;
  machineLabel: string | null;
  storagePreview: {
    rows: BatchInputStorageRow[];
    stockCheckLoading: boolean;
    loadingItems: boolean;
    noItems: boolean;
    noInputs: boolean;
    shortages: BatchInputStorageRow[];
  };
  getItemName: (id: number) => string;
  onReplenish?: (row: BatchInputStorageRow, action: 'stock' | 'purchase') => void;
  needsMachinePick: boolean;
  machinePick: React.ReactNode;
}

const BatchStartStepDialogBody: React.FC<BatchStartStepDialogBodyProps> = ({
  stageLog,
  lineName,
  machineLabel,
  storagePreview,
  getItemName,
  onReplenish,
  needsMachinePick,
  machinePick,
}) => {
  const expectedMinutes = stageLog.expected_duration_minutes;
  const showStepSummary = lineName || machineLabel || expectedMinutes != null;
  const showContextCard = showStepSummary || needsMachinePick;

  return (
    <div className="grid gap-3 py-1">
      <div className="grid gap-2 text-sm">
        <p className="text-muted-foreground">
          Material from earlier completed steps counts first; anything still needed is deducted from
          storage when you start.
        </p>
        {showContextCard ? (
          <section
            className="w-fit max-w-full overflow-hidden rounded-lg border border-border bg-muted/20"
            aria-label="Step context"
          >
            <div
              className={
                needsMachinePick && showStepSummary
                  ? 'grid gap-3 p-3 sm:grid-cols-[auto_minmax(13rem,18rem)] sm:items-center sm:gap-0 sm:divide-x sm:divide-border'
                  : 'p-3'
              }
            >
              {showStepSummary ? (
                <dl
                  className={
                    needsMachinePick
                      ? 'flex flex-wrap items-center gap-x-6 gap-y-2 sm:pr-4'
                      : 'flex flex-wrap items-center gap-x-6 gap-y-2'
                  }
                >
                  {lineName ? (
                    <div className="flex flex-col justify-center gap-0.5">
                      <dt className="text-xs font-medium leading-none text-muted-foreground">Line</dt>
                      <dd className="text-sm leading-tight text-card-foreground">{lineName}</dd>
                    </div>
                  ) : null}
                  {machineLabel ? (
                    <div className="flex flex-col justify-center gap-0.5">
                      <dt className="text-xs font-medium leading-none text-muted-foreground">Machine</dt>
                      <dd className="text-sm leading-tight text-card-foreground">{machineLabel}</dd>
                    </div>
                  ) : null}
                  {expectedMinutes != null ? (
                    <div className="flex flex-col justify-center gap-0.5">
                      <dt className="text-xs font-medium leading-none text-muted-foreground">
                        Planned duration
                      </dt>
                      <dd className="text-sm leading-tight tabular-nums text-card-foreground">
                        {expectedMinutes} min
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              {needsMachinePick ? (
                <div
                  className={
                    showStepSummary
                      ? 'flex min-w-0 flex-col justify-center sm:pl-4'
                      : 'min-w-0 max-w-sm'
                  }
                >
                  {machinePick}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <BatchStartStoragePreview
        rows={storagePreview.rows}
        loading={storagePreview.stockCheckLoading}
        loadingItems={storagePreview.loadingItems}
        noItems={storagePreview.noItems}
        noInputs={storagePreview.noInputs}
        shortages={storagePreview.shortages}
        getItemName={getItemName}
        onReplenish={onReplenish}
        showHighlightLegend={false}
        noInputsMessage="No inputs on this step — nothing will be deducted from storage."
      />
    </div>
  );
};

export default BatchStartStepDialogBody;
