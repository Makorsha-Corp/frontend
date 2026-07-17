import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ItemSummary } from '@/types/itemSummary';
import {
  buildFactoryHref,
  buildFactorySectionHref,
  buildMachineHref,
  buildProductionHref,
  buildProjectHref,
  buildStorageHref,
  buildWorkOrderHref,
} from '@/lib/entityLinks';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { formatMoney, formatQty } from '../itemDetailsFormatters';
import {
  placementListItem,
  placementListShell,
  placementTableBodyRow,
  placementTableHeadCell,
  placementTableHeadRow,
  placementTableShell,
} from '../itemDetailsStyles';
import { formatItemRole } from '../itemDetailsFormatters';
import {
  EntityLink,
  hasBomUsage,
  hasOnHandData,
  PlacementBlockTitle,
  UsageMoreHint,
} from '../itemDetailsShared';

interface PlacementSectionProps {
  summary: ItemSummary;
  unit: string;
  itemId: number;
  onNavigate: () => void;
}

export function PlacementSection({
  summary,
  unit,
  itemId,
  onNavigate,
}: PlacementSectionProps) {
  const onHand = hasOnHandData(summary);
  const referenced = hasBomUsage(summary);

  if (!onHand && !referenced) {
    return (
      <p className="text-sm text-muted-foreground">
        Not in inventory, on machines, or referenced in recipes/jobs.
      </p>
    );
  }

  const nestedSurface = placementTableShell;
  const nestedList = placementListShell;

  let blockIndex = 0;
  const blockDivider = () => {
    const cls = blockIndex > 0 ? 'border-t border-border/60 pt-3' : '';
    blockIndex += 1;
    return cls;
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      {summary.inventory_rows.length > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Storage</PlacementBlockTitle>
          <div className={nestedSurface}>
            <table className="w-full text-sm">
              <thead>
                <tr className={placementTableHeadRow}>
                  <th className={placementTableHeadCell}>Factory</th>
                  <th className={placementTableHeadCell}>Type</th>
                  <th className={cn(placementTableHeadCell, 'text-right')}>Qty</th>
                  <th className={cn(placementTableHeadCell, 'text-right')}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {summary.inventory_rows.map((row) => (
                  <tr
                    key={`${row.factory_id}-${row.inventory_type}`}
                    className={placementTableBodyRow}
                  >
                    <td className="px-3 py-2">
                      <EntityLink
                        to={buildStorageHref({
                          factoryId: row.factory_id,
                          itemId,
                          inventoryType: row.inventory_type,
                        })}
                        onNavigate={onNavigate}
                      >
                        {row.factory_name}
                      </EntityLink>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.inventory_type}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatQty(row.qty, unit)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {row.avg_price != null ? `$${formatMoney(row.avg_price)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {summary.product_rows.length > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Products</PlacementBlockTitle>
          <div className={nestedSurface}>
            <table className="w-full text-sm">
              <thead>
                <tr className={placementTableHeadRow}>
                  <th className={placementTableHeadCell}>Factory</th>
                  <th className={cn(placementTableHeadCell, 'text-right')}>Qty</th>
                  <th className={cn(placementTableHeadCell, 'text-right')}>Cost</th>
                  <th className={cn(placementTableHeadCell, 'text-right')}>Price</th>
                  <th className={placementTableHeadCell}>For sale</th>
                </tr>
              </thead>
              <tbody>
                {summary.product_rows.map((row) => (
                  <tr key={row.factory_id} className={placementTableBodyRow}>
                    <td className="px-3 py-2">
                      <EntityLink
                        to={buildStorageHref({
                          factoryId: row.factory_id,
                          itemId,
                          tab: 'products',
                        })}
                        onNavigate={onNavigate}
                      >
                        {row.factory_name}
                      </EntityLink>
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{row.qty}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {row.avg_cost != null ? `$${formatMoney(row.avg_cost)}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {row.selling_price != null ? `$${formatMoney(row.selling_price)}` : '—'}
                    </td>
                    <td className="px-3 py-2">{row.is_available_for_sale ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {summary.machine_placements.length > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Machines</PlacementBlockTitle>
          <div className={nestedSurface}>
            <table className="w-full text-sm">
              <thead>
                <tr className={placementTableHeadRow}>
                  <th className={placementTableHeadCell}>Factory</th>
                  <th className={placementTableHeadCell}>Section</th>
                  <th className={placementTableHeadCell}>Machine</th>
                  <th className={cn(placementTableHeadCell, 'text-right')}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {summary.machine_placements.map((row) => (
                  <tr
                    key={row.machine_id}
                    className={cn(
                      placementTableBodyRow,
                      row.is_low_stock && 'bg-destructive/[0.06] hover:bg-destructive/[0.08]'
                    )}
                  >
                    <td className="px-3 py-2">
                      {row.factory_id > 0 ? (
                        <EntityLink to={buildFactoryHref(row.factory_id)} onNavigate={onNavigate}>
                          {row.factory_name}
                        </EntityLink>
                      ) : (
                        row.factory_name
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.factory_id > 0 && row.factory_section_id != null && row.factory_section_id > 0 ? (
                        <EntityLink
                          to={buildFactorySectionHref(row.factory_id, row.factory_section_id)}
                          onNavigate={onNavigate}
                        >
                          {row.factory_section_name}
                        </EntityLink>
                      ) : (
                        row.factory_section_name ?? 'Unassigned'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {row.is_low_stock ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        ) : null}
                        <EntityLink
                          to={buildMachineHref(row.machine_id)}
                          onNavigate={onNavigate}
                          className="truncate"
                        >
                          {row.machine_name}
                        </EntityLink>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {row.req_qty != null ? (
                        <>
                          <span
                            className={cn(row.is_low_stock && 'font-semibold text-destructive')}
                          >
                            {row.qty}
                          </span>
                          /{row.req_qty} {unit}
                        </>
                      ) : (
                        <>
                          {row.qty} {unit}
                        </>
                      )}
                      {row.defective_qty != null && row.defective_qty > 0
                        ? ` · ${row.defective_qty} def.`
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {summary.usage_counts.formula_count > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Formulas</PlacementBlockTitle>
          <ul className={nestedList}>
            {summary.usage_details.formulas.map((row) => (
              <li
                key={`${row.formula_id}-${row.item_role}`}
                className={cn('flex items-center justify-between gap-3', placementListItem)}
              >
                <div className="min-w-0">
                  <EntityLink
                    to={buildProductionHref()}
                    onNavigate={onNavigate}
                    className="block truncate"
                  >
                    {row.formula_code}
                  </EntityLink>
                  <p className="truncate text-xs text-muted-foreground">{row.name}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                  {formatItemRole(row.item_role)}
                </Badge>
              </li>
            ))}
          </ul>
          <UsageMoreHint
            total={summary.usage_counts.formula_count}
            shown={summary.usage_details.formulas.length}
          />
        </div>
      ) : null}

      {summary.usage_counts.batch_line_count > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Batches</PlacementBlockTitle>
          <ul className={nestedList}>
            {summary.usage_details.batches.map((row) => (
              <li
                key={`${row.batch_id}-${row.item_role}`}
                className={cn('flex items-center justify-between gap-3', placementListItem)}
              >
                <EntityLink
                  to={buildProductionHref()}
                  onNavigate={onNavigate}
                  className="truncate"
                >
                  {row.batch_number}
                </EntityLink>
                <div className="flex shrink-0 items-center gap-2">
                  {row.status ? (
                    <span className="text-xs capitalize text-muted-foreground">
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {formatItemRole(row.item_role)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
          <UsageMoreHint
            total={summary.usage_counts.batch_line_count}
            shown={summary.usage_details.batches.length}
          />
        </div>
      ) : null}

      {summary.usage_counts.project_component_count > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Projects</PlacementBlockTitle>
          <ul className={nestedList}>
            {summary.usage_details.projects.map((row) => (
              <li key={row.component_id} className={placementListItem}>
                <EntityLink
                  to={buildProjectHref()}
                  onNavigate={onNavigate}
                  className="block truncate"
                >
                  {row.project_name}
                </EntityLink>
                <p className="truncate text-xs text-muted-foreground">{row.component_name}</p>
              </li>
            ))}
          </ul>
          <UsageMoreHint
            total={summary.usage_counts.project_component_count}
            shown={summary.usage_details.projects.length}
          />
        </div>
      ) : null}

      {summary.usage_counts.work_order_line_count > 0 ? (
        <div className={cn('space-y-2', blockDivider())}>
          <PlacementBlockTitle>Work orders</PlacementBlockTitle>
          <ul className={nestedList}>
            {summary.usage_details.work_orders.map((row) => (
              <li key={row.work_order_id} className={placementListItem}>
                <EntityLink
                  to={buildWorkOrderHref(row.work_order_id)}
                  onNavigate={onNavigate}
                  className="block truncate"
                >
                  {row.work_order_number}
                </EntityLink>
                <p className="truncate text-xs text-muted-foreground">{row.title}</p>
              </li>
            ))}
          </ul>
          <UsageMoreHint
            total={summary.usage_counts.work_order_line_count}
            shown={summary.usage_details.work_orders.length}
          />
        </div>
      ) : null}
    </div>
  );
}
