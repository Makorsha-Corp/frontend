import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import type { ItemSummary, ItemSummarySupplierRow } from '@/types/itemSummary';
import { buildAccountHref } from '@/lib/entityLinks';
import { cn } from '@/lib/utils';
import { entityLinkClass } from './itemDetailsStyles';

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function PlacementBlockTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-foreground">{children}</p>;
}

export function UsageMoreHint({ total, shown }: { total: number; shown: number }) {
  if (total <= shown) return null;
  return <p className="text-xs text-muted-foreground">+ {total - shown} more</p>;
}

export function hasBomUsage(summary: ItemSummary): boolean {
  const { usage_counts } = summary;
  return (
    usage_counts.formula_count > 0 ||
    usage_counts.batch_line_count > 0 ||
    usage_counts.project_component_count > 0 ||
    usage_counts.work_order_line_count > 0
  );
}

export function hasOnHandData(summary: ItemSummary): boolean {
  return (
    summary.inventory_rows.length > 0 ||
    summary.product_rows.length > 0 ||
    summary.machine_placements.length > 0
  );
}

export function EntityLink({
  to,
  onNavigate,
  children,
  className,
}: {
  to: string;
  onNavigate: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} onClick={onNavigate} className={cn(entityLinkClass, className)}>
      {children}
    </Link>
  );
}

export function SupplierHighlightCard({
  label,
  row,
  primary,
  secondary,
  onNavigate,
}: {
  label: string;
  row: ItemSummarySupplierRow;
  primary: string;
  secondary: string;
  onNavigate: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <EntityLink
        to={buildAccountHref(row.account_id)}
        onNavigate={onNavigate}
        className="block truncate text-sm normal-case"
      >
        {row.account_name}
      </EntityLink>
      <p className="mt-1 text-base font-semibold tabular-nums text-card-foreground">{primary}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{secondary}</p>
    </div>
  );
}
