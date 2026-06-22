import React from 'react';
import type { ItemSummary } from '@/types/itemSummary';
import { formatMoney, formatQty, num } from '../itemDetailsFormatters';

function qtyOrDash(qty: number | string, unit: string): string {
  return num(qty) > 0 ? formatQty(qty, unit) : '—';
}

export function OverviewKpiStrip({
  summary,
  unit,
}: {
  summary: ItemSummary;
  unit: string;
}) {
  const { kpis, order_stats } = summary;
  const allTime = order_stats.all_time;
  const totalSpend = num(allTime.total_spend);

  const items = [
    {
      label: 'Storage',
      value: qtyOrDash(kpis.storage_qty_total, unit),
    },
    {
      label: 'Total spend',
      value: totalSpend > 0 ? `$${formatMoney(allTime.total_spend)}` : '—',
    },
    {
      label: 'Purchased',
      value: qtyOrDash(allTime.purchase_qty, unit),
    },
    {
      label: 'Sold',
      value: qtyOrDash(allTime.sales_qty, unit),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}
