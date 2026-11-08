import type { TFunction } from 'i18next';
import type { OverviewOrderKind } from '@/pages/newpages/orders/ordersOverviewData';

/** English `CountsByTypeRow.type` values from `aggregateCountsByType`. */
export const OVERVIEW_AGGREGATE_TYPE_BY_KIND: Record<OverviewOrderKind, string> = {
  purchase: 'Purchase',
  transfer: 'Transfer',
  expense: 'Expense',
};

export function overviewKindFromAggregateType(type: string): OverviewOrderKind | undefined {
  const found = (Object.entries(OVERVIEW_AGGREGATE_TYPE_BY_KIND) as [OverviewOrderKind, string][]).find(
    ([, label]) => label === type,
  );
  return found?.[0];
}

export function overviewHubLabel(kind: OverviewOrderKind, t: TFunction): string {
  return t(`overviewHub_${kind}`);
}

export function overviewAggregateTypeLabel(englishType: string, t: TFunction): string {
  const kind = overviewKindFromAggregateType(englishType);
  return kind ? overviewHubLabel(kind, t) : englishType;
}
