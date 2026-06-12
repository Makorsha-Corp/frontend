import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Inventory, InventoryType } from '@/types/inventory';
import { Archive, Plus, Loader2, Pencil, Trash2, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INVENTORY_TYPES, formatCurrency, formatNumber, type StorageOverviewStats } from './storageConstants';

interface StorageSectionProps {
  factoryId: number | null;
  overview: StorageOverviewStats;
  inventory: Inventory[];
  isLoading: boolean;
  hasError: boolean;
  searchQuery: string;
  showZeroQty: boolean;
  onShowZeroQtyChange: (value: boolean) => void;
  inventoryTypeFilter: InventoryType | 'all';
  onInventoryTypeFilterChange: (value: InventoryType | 'all') => void;
  onAdd: () => void;
  onEdit: (inv: Inventory) => void;
  onClearStock: (inv: Inventory) => void;
  className?: string;
  collapsed?: boolean;
  onExpandRequest?: () => void;
}

const StorageSection: React.FC<StorageSectionProps> = ({
  factoryId,
  overview,
  inventory,
  isLoading,
  hasError,
  searchQuery,
  showZeroQty,
  onShowZeroQtyChange,
  inventoryTypeFilter,
  onInventoryTypeFilterChange,
  onAdd,
  onEdit,
  onClearStock,
  className,
  collapsed = false,
  onExpandRequest,
}) => {
  return (
    <Card className={cn('flex min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm', collapsed ? 'shrink-0' : 'flex-1', className)}>
      <div className={cn('sticky top-0 z-10 shrink-0 bg-card', !collapsed && 'border-b border-border')}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/25">
              <Archive className="h-4 w-4 text-brand-primary" />
            </div>
            <h2 className="text-sm font-semibold text-card-foreground">Storage</h2>
            <Badge variant="secondary" className="tabular-nums">
              {formatNumber(overview.records)}
            </Badge>
            {!collapsed && (
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={onAdd}
                disabled={!factoryId}
                title="Add to inventory"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatNumber(overview.totalQty)} units · {formatCurrency(overview.estimatedValue)} est.
            </p>
            {collapsed && onExpandRequest && (
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onExpandRequest}>
                Expand
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {!collapsed && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {overview.byType.map((row) => (
              <span key={row.type} className="text-muted-foreground">
                {row.type}:{' '}
                <span className="font-medium tabular-nums text-card-foreground">
                  {formatNumber(row.uniqueCount)} ({formatNumber(row.totalQty)})
                </span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5" title="Show empty inventory rows">
              <Switch
                id="storage-show-zero-qty"
                checked={showZeroQty}
                onCheckedChange={onShowZeroQtyChange}
                className="scale-90"
                aria-label="Show empty inventory rows"
              />
              <Label
                htmlFor="storage-show-zero-qty"
                className="cursor-pointer whitespace-nowrap text-xs font-normal text-muted-foreground"
              >
                Empty
              </Label>
            </div>
            <Tabs
              value={inventoryTypeFilter}
              onValueChange={(v) => onInventoryTypeFilterChange(v as InventoryType | 'all')}
              className="w-auto"
            >
              <TabsList className="h-8">
                <TabsTrigger value="all" className="px-2.5 text-xs">
                  All
                </TabsTrigger>
                {INVENTORY_TYPES.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="px-2.5 text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        )}
      </div>

      {!collapsed && (
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <p className="text-destructive">Failed to load inventory.</p>
          </div>
        ) : !factoryId ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Archive className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Select a factory to view inventory.</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Archive className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              {searchQuery
                ? 'No inventory rows match your search.'
                : showZeroQty
                  ? 'No inventory records yet.'
                  : 'No items in stock. Turn on Empty to see cleared rows.'}
            </p>
            {!searchQuery && showZeroQty && (
              <Button onClick={onAdd} className="bg-brand-primary hover:bg-brand-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Add to Inventory
              </Button>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-brand-primary/5 dark:bg-brand-primary/10">
                  <TableHead className="py-3 text-xs font-semibold uppercase text-muted-foreground">Item</TableHead>
                  <TableHead className="w-[100px] py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="w-[80px] py-3 text-xs font-semibold uppercase text-muted-foreground">Qty</TableHead>
                  <TableHead className="w-[100px] py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Avg. Price
                  </TableHead>
                  <TableHead className="w-[120px] py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((inv) => (
                  <TableRow key={inv.id} className="border-b border-border last:border-0 hover:bg-brand-primary/5">
                    <TableCell className="py-3 font-medium text-card-foreground">
                      {inv.item_name ?? `Item #${inv.item_id}`}
                      {inv.item_unit && <span className="ml-1 text-xs text-muted-foreground">({inv.item_unit})</span>}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        {inv.inventory_type}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums">{inv.qty}</TableCell>
                    <TableCell className="py-3 tabular-nums">{formatCurrency(inv.avg_price)}</TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                          onClick={() => onEdit(inv)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {(inv.qty ?? 0) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => onClearStock(inv)}
                            title="Set quantity to 0"
                            aria-label="Set quantity to 0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      )}
    </Card>
  );
};

export default StorageSection;
