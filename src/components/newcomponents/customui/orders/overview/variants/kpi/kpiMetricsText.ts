import type { ExtendedOverviewStats } from '@/pages/newpages/orders/ordersOverviewData';
import { formatOverviewCurrency } from '../../ordersOverviewConstants';

export function buildKpiSummaryParts(
  stats: ExtendedOverviewStats,
  totalOrdersCount: number
): Array<{ label: string; value: string }> {
  return [
    { label: 'orders', value: String(totalOrdersCount) },
    { label: 'open', value: String(stats.openOrdersCount) },
    { label: 'pending approvals', value: String(stats.pendingApprovalsCount) },
    { label: 'overdue', value: String(stats.overdueCount) },
    { label: 'pending value', value: formatOverviewCurrency(stats.pendingValue) },
    { label: 'not invoiced', value: String(stats.notInvoicedCount) },
    { label: 'avg', value: formatOverviewCurrency(stats.avgOrderValue) },
  ];
}

export function formatKpiSummaryLine(
  stats: ExtendedOverviewStats,
  totalOrdersCount: number
): string {
  return buildKpiSummaryParts(stats, totalOrdersCount)
    .map((p) => `${p.value} ${p.label}`)
    .join(' · ');
}

/** Short line for table subtitle and general context */
export function formatKpiShortSummary(
  stats: ExtendedOverviewStats,
  totalOrdersCount: number
): string {
  const parts = [
    `${totalOrdersCount} orders`,
    `${stats.openOrdersCount} open`,
    `${formatOverviewCurrency(stats.pendingValue)} pending`,
  ];
  if (stats.overdueCount > 0) {
    parts.push(`${stats.overdueCount} overdue`);
  }
  return parts.join(' · ');
}

/** Trend chart subtitle: volume-focused */
export function formatKpiTrendContext(
  stats: ExtendedOverviewStats,
  totalOrdersCount: number
): string {
  return `${totalOrdersCount} orders · ${stats.openOrdersCount} open · ${formatOverviewCurrency(stats.pendingValue)} pending value`;
}

/** Status pipeline subtitle: workflow-focused */
export function formatKpiStatusContext(stats: ExtendedOverviewStats): string {
  const parts = [`${stats.openOrdersCount} open`];
  if (stats.overdueCount > 0) {
    parts.push(`${stats.overdueCount} overdue`);
  }
  if (stats.pendingApprovalsCount > 0) {
    parts.push(`${stats.pendingApprovalsCount} pending approval`);
  }
  return parts.join(' · ');
}

/** Action strip muted line — omits total order count (visible on hub cards) */
export function formatKpiActionStripSummary(stats: ExtendedOverviewStats): string {
  const parts = [
    `${stats.openOrdersCount} open`,
    `${formatOverviewCurrency(stats.pendingValue)} pending`,
  ];
  if (stats.notInvoicedCount > 0) {
    parts.push(`${stats.notInvoicedCount} not invoiced`);
  }
  return parts.join(' · ');
}
