import React from 'react';
import { cn } from '@/lib/utils';
import type {
  ItemPriceInsightRef,
  ItemPriceInsightRow,
  PoItemLowestPriceMode,
} from '@/types/purchaseOrderItemInsights';

export interface AccountInsightSelectContext {
  itemId: number;
  itemName?: string | null;
}

export interface ItemPriceHistorySelectContext {
  itemId: number;
  itemName?: string | null;
}

export interface PoItemInsightCellBaseProps {
  row: ItemPriceInsightRow | undefined;
  itemId: number;
  itemName?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  formatCurrency: (value: number) => string;
  onSelectPriceHistory: (context: ItemPriceHistorySelectContext) => void;
  onSelectAccount?: (
    accountId: number,
    accountName: string | null,
    context: AccountInsightSelectContext,
  ) => void;
  className?: string;
  testId?: string;
}

export interface PoItemLowestCellProps extends PoItemInsightCellBaseProps {
  lowestMode: PoItemLowestPriceMode;
}

function accountLabel(ref: ItemPriceInsightRef | null | undefined): string | null {
  if (!ref) return null;
  return ref.account_name?.trim() || 'No supplier';
}

function priceLabel(
  ref: ItemPriceInsightRef | null | undefined,
  formatCurrency: (value: number) => string,
): string {
  if (!ref || ref.unit_price == null || ref.unit_price === '') {
    return '—';
  }
  const price = Number(ref.unit_price);
  if (!Number.isFinite(price)) {
    return '—';
  }
  return formatCurrency(price);
}

function hasPrice(ref: ItemPriceInsightRef | null | undefined): boolean {
  if (!ref || ref.unit_price == null || ref.unit_price === '') {
    return false;
  }
  return Number.isFinite(Number(ref.unit_price));
}

function LoadingCell({ className, testId }: { className?: string; testId?: string }) {
  return (
    <div className={cn('text-sm text-muted-foreground/70', className)} data-testid={testId}>
      <span className="block truncate">Loading…</span>
      <span className="block tabular-nums">—</span>
    </div>
  );
}

function ErrorCell({ className, testId }: { className?: string; testId?: string }) {
  return (
    <div className={cn('text-sm text-destructive/80', className)} data-testid={testId}>
      <span className="block truncate">Unable to load price history</span>
      <span className="block tabular-nums">—</span>
    </div>
  );
}

function InsightCellContent({
  insightRef,
  itemId,
  itemName,
  formatCurrency,
  onSelectPriceHistory,
  onSelectAccount,
  emptyAccountLabel,
  className,
  testId,
}: {
  insightRef: ItemPriceInsightRef | null | undefined;
  itemId: number;
  itemName?: string | null;
  formatCurrency: (value: number) => string;
  onSelectPriceHistory: (context: ItemPriceHistorySelectContext) => void;
  onSelectAccount?: (
    accountId: number,
    accountName: string | null,
    context: AccountInsightSelectContext,
  ) => void;
  emptyAccountLabel?: string;
  className?: string;
  testId?: string;
}) {
  const clickableClass =
    'block w-full truncate text-left text-sm text-muted-foreground hover:text-foreground hover:underline cursor-pointer';
  const staticClass = 'block w-full truncate text-left text-sm text-muted-foreground/70';

  if (!insightRef) {
    return (
      <div className={cn('text-sm text-muted-foreground/70', className)} data-testid={testId}>
        <span className="block truncate">{emptyAccountLabel ?? '—'}</span>
        <span className="block tabular-nums">—</span>
      </div>
    );
  }

  const account = accountLabel(insightRef);
  const price = priceLabel(insightRef, formatCurrency);
  const priceClickable = hasPrice(insightRef);
  const accountClickable = insightRef.account_id != null && onSelectAccount != null;

  return (
    <div className={cn('w-full text-left', className)} data-testid={testId}>
      {accountClickable ? (
        <button
          type="button"
          className={cn('w-full text-left', clickableClass)}
          data-testid="po-insights-supplier-link"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAccount!(insightRef.account_id!, insightRef.account_name, {
              itemId,
              itemName,
            });
          }}
        >
          {account}
        </button>
      ) : (
        <span className={staticClass}>{account}</span>
      )}
      {priceClickable ? (
        <button
          type="button"
          className={cn('w-full text-left', clickableClass, 'tabular-nums')}
          data-testid="po-insights-price-link"
          onClick={(e) => {
            e.stopPropagation();
            onSelectPriceHistory({ itemId, itemName });
          }}
        >
          {price}
        </button>
      ) : (
        <span className={cn(staticClass, 'tabular-nums')}>{price}</span>
      )}
    </div>
  );
}

export const PoItemLastOrderCell: React.FC<PoItemInsightCellBaseProps> = ({
  row,
  itemId,
  itemName,
  isLoading = false,
  isError = false,
  formatCurrency,
  onSelectPriceHistory,
  onSelectAccount,
  className,
  testId = 'po-insights-last-order-cell',
}) => {
  if (isLoading) {
    return <LoadingCell className={className} testId={testId} />;
  }

  if (isError) {
    return <ErrorCell className={className} testId={testId} />;
  }

  if (!row) {
    return null;
  }

  return (
    <InsightCellContent
      insightRef={row.last_ordered}
      itemId={itemId}
      itemName={itemName}
      formatCurrency={formatCurrency}
      onSelectPriceHistory={onSelectPriceHistory}
      onSelectAccount={onSelectAccount}
      emptyAccountLabel="No prior orders"
      className={className}
      testId={testId}
    />
  );
};

export const PoItemLowestCell: React.FC<PoItemLowestCellProps> = ({
  row,
  itemId,
  itemName,
  isLoading = false,
  isError = false,
  lowestMode,
  formatCurrency,
  onSelectPriceHistory,
  onSelectAccount,
  className,
  testId = 'po-insights-lowest-cell',
}) => {
  if (isLoading) {
    return <LoadingCell className={className} testId={testId} />;
  }

  if (isError) {
    return <ErrorCell className={className} testId={testId} />;
  }

  if (!row) {
    return null;
  }

  const lowestRef = row.lowest[lowestMode];

  return (
    <InsightCellContent
      insightRef={lowestRef}
      itemId={itemId}
      itemName={itemName}
      formatCurrency={formatCurrency}
      onSelectPriceHistory={onSelectPriceHistory}
      onSelectAccount={onSelectAccount}
      className={className}
      testId={testId}
    />
  );
};
