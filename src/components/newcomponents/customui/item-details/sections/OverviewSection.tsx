import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, ChevronRight, Loader2, MapPin, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGetItemOrdersQuery } from '@/features/items/itemsApi';
import type { ItemOrderRow } from '@/types/itemOrders';
import type { ItemSummary, ItemSummaryRecentActivity } from '@/types/itemSummary';
import { cn } from '@/lib/utils';
import { formatDateTime, formatMoney, formatOrderDate, formatQty } from '../itemDetailsFormatters';
import type { ItemDetailsSectionId } from '../itemDetailsTypes';
import { OverviewKpiStrip } from './OverviewKpiStrip';

interface OverviewSectionProps {
  summary: ItemSummary;
  unit: string;
  itemId: number;
  dialogOpen: boolean;
  onGoToTab: (section: ItemDetailsSectionId) => void;
  showPlacement: boolean;
  showActivity: boolean;
}

type OverviewCardRow = { label: string; value: string; multiline?: boolean };

type OverviewRecentEntry = { key: string; primary: string; secondary?: string };

type OverviewFeaturedBlock = {
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
};

function uniqueFactoryNames(rows: { factory_name: string }[]): string[] {
  return [...new Set(rows.map((row) => row.factory_name).filter(Boolean))];
}

function formatNameList(names: string[], max = 2): string {
  if (names.length === 0) return '';
  if (names.length <= max) return names.join(', ');
  return `${names.slice(0, max).join(', ')} +${names.length - max}`;
}

function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function OverviewNavCard({
  icon: Icon,
  title,
  headline,
  rows = [],
  recentEntries,
  recentEntriesLoading = false,
  recentEntriesEmptyLabel = 'None yet',
  featuredBlock,
  badge,
  badgeVariant = 'secondary',
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  headline?: string;
  rows?: OverviewCardRow[];
  recentEntries?: OverviewRecentEntry[];
  recentEntriesLoading?: boolean;
  recentEntriesEmptyLabel?: string;
  featuredBlock?: OverviewFeaturedBlock;
  badge?: string;
  badgeVariant?: 'secondary' | 'destructive' | 'outline';
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-full min-h-[12.5rem] flex-col rounded-xl border border-border/80 bg-card p-4 text-left',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled
          ? 'cursor-default opacity-60'
          : 'hover:border-brand-primary/30 hover:bg-accent/50'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <Icon className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
        {!disabled ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
        ) : null}
      </div>

      <span className="mt-2 text-sm font-medium text-card-foreground">{title}</span>

      {headline ? (
        <p className="mt-1.5 text-base font-semibold tabular-nums text-card-foreground">{headline}</p>
      ) : null}

      {featuredBlock ? (
        <div className="mt-3 min-h-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {featuredBlock.label}
          </span>
          <div className="mt-1.5 rounded-lg border border-border/70 bg-muted/35 p-3">
            <p className="text-sm font-semibold leading-snug text-card-foreground">
              {featuredBlock.title}
            </p>
            {featuredBlock.subtitle ? (
              <p className="mt-1.5 text-sm font-semibold tabular-nums text-brand-primary">
                {featuredBlock.subtitle}
              </p>
            ) : null}
            {featuredBlock.meta ? (
              <p className="mt-2 text-xs text-muted-foreground">{featuredBlock.meta}</p>
            ) : null}
          </div>
        </div>
      ) : recentEntries !== undefined ? (
        <div className="mt-3 min-h-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recent purchases
          </span>
          {recentEntriesLoading ? (
            <div className="mt-2 flex items-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : recentEntries.length > 0 ? (
            <ul className="mt-1.5 space-y-1.5">
              {recentEntries.map((entry) => (
                <li
                  key={entry.key}
                  className="rounded-md border border-border/60 bg-muted/25 px-2 py-1.5"
                >
                  <p className="truncate text-xs font-medium text-card-foreground">{entry.primary}</p>
                  {entry.secondary ? (
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{entry.secondary}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{recentEntriesEmptyLabel}</p>
          )}
        </div>
      ) : rows.length > 0 ? (
        <div className="mt-3 min-h-0 flex-1 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[4.25rem_1fr] items-start gap-x-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {row.label}
              </span>
              <span
                className={cn(
                  'text-xs text-card-foreground',
                  row.multiline ? 'whitespace-normal' : 'line-clamp-2'
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {badge ? (
        <Badge variant={badgeVariant} className="mt-auto w-fit pt-2 text-[10px] font-normal">
          {badge}
        </Badge>
      ) : null}
    </button>
  );
}

function getPlacementContent(summary: ItemSummary): {
  rows: OverviewCardRow[];
  badge?: string;
  badgeVariant: 'secondary' | 'destructive';
} {
  const storage = uniqueFactoryNames(summary.inventory_rows);
  const products = uniqueFactoryNames(summary.product_rows);
  const machines = uniqueFactoryNames(summary.machine_placements);
  const { usage_counts, usage_details } = summary;

  const rows: OverviewCardRow[] = [];
  const listed = new Set<string>();

  if (storage.length > 0) {
    rows.push({ label: 'Storage', value: formatNameList(storage) });
    storage.forEach((name) => listed.add(name));
  }

  const productsOnly = products.filter((name) => !listed.has(name));
  if (productsOnly.length > 0) {
    rows.push({ label: 'Products', value: formatNameList(productsOnly) });
    productsOnly.forEach((name) => listed.add(name));
  }

  if (machines.length > 0) {
    rows.push({
      label: 'Machines',
      value: formatNameList(machines),
    });
  }

  if (usage_counts.formula_count > 0) {
    rows.push({
      label: 'Formulas',
      value: formatNameList(usage_details.formulas.map((f) => f.formula_code || f.name)),
    });
  }

  if (usage_counts.batch_line_count > 0) {
    rows.push({
      label: 'Batches',
      value: formatNameList(usage_details.batches.map((b) => b.batch_number)),
    });
  }

  if (usage_counts.project_component_count > 0) {
    rows.push({
      label: 'Projects',
      value: formatNameList(usage_details.projects.map((p) => p.project_name)),
    });
  }

  if (usage_counts.work_order_line_count > 0) {
    rows.push({
      label: 'Work orders',
      value: formatNameList(usage_details.work_orders.map((w) => w.work_order_number)),
    });
  }

  if (rows.length === 0) {
    return {
      rows: [{ label: '—', value: 'Not in inventory' }],
      badgeVariant: 'secondary',
    };
  }

  return {
    rows,
    badgeVariant: 'secondary',
  };
}

function getPurchasingHeadline(summary: ItemSummary): string {
  const { pricing } = summary;

  if (pricing.open_po_line_count > 0) {
    return pricing.open_po_line_count === 1
      ? '1 open PO'
      : `${pricing.open_po_line_count} open POs`;
  }

  if (pricing.last_unit_price != null) {
    return `Last $${formatMoney(pricing.last_unit_price)}`;
  }

  return 'No history';
}

function formatPurchaseEntry(row: ItemOrderRow, unit: string): OverviewRecentEntry {
  const qty = formatQty(row.quantity, unit);
  const price = row.unit_price != null ? `$${formatMoney(row.unit_price)}` : null;
  const date = formatOrderDate(row.order_date);
  const secondaryParts = [row.account_name, qty, price, date].filter(Boolean);

  return {
    key: `${row.order_type}-${row.order_id}`,
    primary: row.order_number,
    secondary: secondaryParts.length > 0 ? secondaryParts.join(' · ') : undefined,
  };
}

function getActivityLatestBlock(
  act: ItemSummaryRecentActivity,
  unit: string
): OverviewFeaturedBlock {
  const action = capitalizeWords(act.transaction_type.replace(/_/g, ' '));
  const where = act.machine_name ?? act.factory_name;
  const title = where ? `${action} at ${where}` : action;

  const subtitleParts: string[] = [];
  if (act.quantity !== 0) {
    subtitleParts.push(formatQty(act.quantity, unit));
  }
  if (act.order_number) {
    subtitleParts.push(act.order_number);
  }
  if (act.inventory_type) {
    subtitleParts.push(capitalizeWords(act.inventory_type.replace(/_/g, ' ')));
  }

  return {
    label: 'Latest',
    title,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
    meta: formatDateTime(act.performed_at),
  };
}

function getActivityContent(summary: ItemSummary, unit: string): {
  headline: string;
  featuredBlock?: OverviewFeaturedBlock;
} {
  const { recent_activity } = summary;
  if (recent_activity.length === 0) {
    return {
      headline: 'No movements',
    };
  }

  const count = recent_activity.length;
  return {
    headline: count === 1 ? '1 movement' : `${count} movements`,
    featuredBlock: getActivityLatestBlock(recent_activity[0], unit),
  };
}

export function OverviewSection({
  summary,
  onGoToTab,
  showPlacement,
  showActivity,
  unit,
  itemId,
  dialogOpen,
}: OverviewSectionProps) {
  const placement = getPlacementContent(summary);
  const purchasingHeadline = getPurchasingHeadline(summary);
  const activity = getActivityContent(summary, unit);

  const {
    data: purchaseOrders,
    isLoading: purchasesLoading,
    isFetching: purchasesFetching,
  } = useGetItemOrdersQuery(
    { itemId, limit: 5, order_type: 'purchase_order' },
    { skip: !dialogOpen || !itemId }
  );

  const recentPurchases = (purchaseOrders?.items ?? []).map((row) =>
    formatPurchaseEntry(row, unit)
  );
  const purchasesLoadingState = purchasesLoading || (purchasesFetching && !purchaseOrders);

  return (
    <div className="flex min-h-full flex-col gap-4">
      <OverviewKpiStrip summary={summary} unit={unit} />

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        <OverviewNavCard
          icon={MapPin}
          title="Placement"
          rows={placement.rows}
          badge={placement.badge}
          badgeVariant={placement.badgeVariant}
          disabled={!showPlacement}
          onClick={showPlacement ? () => onGoToTab('placement') : undefined}
        />

        <OverviewNavCard
          icon={ShoppingCart}
          title="Purchasing"
          headline={purchasingHeadline}
          recentEntries={recentPurchases}
          recentEntriesLoading={purchasesLoadingState}
          recentEntriesEmptyLabel="No purchases yet"
          onClick={() => onGoToTab('purchasing')}
        />

        <OverviewNavCard
          icon={ArrowLeftRight}
          title="Activity"
          headline={activity.headline}
          featuredBlock={activity.featuredBlock}
          disabled={!showActivity}
          onClick={showActivity ? () => onGoToTab('activity') : undefined}
        />
      </div>
    </div>
  );
}

export default OverviewSection;
