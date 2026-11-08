import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Inventory, InventoryType } from '@/types/inventory';
import type { ItemIncomingSummary } from '@/types/inventoryIncoming';
import { incomingSummaryKey } from '@/types/inventoryIncoming';
import IncomingQtyCell from './IncomingQtyCell';
import { Archive, Plus, Loader2, Pencil, Trash2, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildItemHref } from '@/lib/entityLinks';
import { INVENTORY_TYPES, formatCurrency, formatNumber, type StorageOverviewStats } from './storageConstants';
import {
  catalogActionsCellClass,
  catalogActionsHeadClass,
  catalogFactoryCellClass,
  catalogFactoryHeadClass,
  catalogItemCellClass,
  catalogItemHeadClass,
  catalogMoneyCellClass,
  catalogMoneyHeadClass,
  catalogNumericCellClass,
  catalogNumericHeadClass,
  catalogSectionCardClass,
  catalogSectionIconTileClass,
  catalogSectionMetaClass,
  catalogSectionSummaryClass,
  catalogSectionTitleClass,
  catalogSectionToolbarClass,
  catalogTableClass,
  catalogTableHeadRowClass,
  catalogTableRowClass,
  catalogItemTextClass,
  catalogIncomingHeadClass,
  catalogTypeHeadClass,
} from './inventoryCatalogLayout';
import { translateInventoryType } from './inventoryTypeLabel';

interface StorageSectionProps {
  factoryId: number | null;
  factoryLabels?: Record<number, string>;
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
  onRequireFactory?: () => void;
  onEdit: (inv: Inventory) => void;
  onClearStock: (inv: Inventory) => void;
  incomingByKey?: Map<string, ItemIncomingSummary>;
  incomingSummaryError?: boolean;
  incomingSummaryErrorMessage?: string | null;
  paginationFooter?: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  onExpandRequest?: () => void;
}

const StorageSection: React.FC<StorageSectionProps> = ({
  factoryId,
  factoryLabels = {},
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
  onRequireFactory,
  onEdit,
  onClearStock,
  incomingByKey,
  incomingSummaryError = false,
  incomingSummaryErrorMessage = null,
  paginationFooter,
  className,
  collapsed = false,
  onExpandRequest,
}) => {
  const { t } = useTranslation('inventory');
  const showFactoryColumn = factoryId == null;

  return (
    <Card className={cn(catalogSectionCardClass, collapsed ? 'shrink-0' : 'flex-1', className)}>
      <div className={cn('sticky top-0 z-10 shrink-0 bg-card', !collapsed && 'border-b border-border')}>
        <div className={catalogSectionToolbarClass}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className={catalogSectionIconTileClass}>
                <Archive className="h-4 w-4 text-brand-primary" />
              </div>
              <h2 className={catalogSectionTitleClass}>{t('storageTitle')}</h2>
              <Badge variant="secondary" className="tabular-nums">
                {formatNumber(overview.records)}
              </Badge>
              {!collapsed && (
                <BlockedActionButton
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  blocked={factoryId == null}
                  blockedHint={{
                    title: t('selectFactoryFirst'),
                    reason: t('selectFactoryToAdd'),
                  }}
                  onBlockedClick={onRequireFactory}
                  onAction={onAdd}
                  popoverSide="right"
                  popoverAlign="start"
                  title={factoryId ? t('addToInventory') : undefined}
                >
                  <Plus className="h-4 w-4" />
                </BlockedActionButton>
              )}
              <p className={catalogSectionSummaryClass}>
                {t('summaryUnitsEst', {
                  qty: formatNumber(overview.totalQty),
                  value: formatCurrency(overview.estimatedValue),
                })}
                {' · '}
                {t('finishedGoodsStockLead')}{' '}
                <Link to="/products" className="text-brand-primary underline-offset-2 hover:underline">
                  {t('listOnProducts')}
                </Link>{' '}
                {t('toSell')}
              </p>
            </div>
            {!collapsed && (
              <div className={catalogSectionMetaClass}>
                {overview.byType.map((row) => (
                  <span key={row.type} className="text-muted-foreground">
                    {translateInventoryType(row.type, t)}:{' '}
                    <span className="font-medium tabular-nums text-card-foreground">
                      {formatNumber(row.uniqueCount)} ({formatNumber(row.totalQty)})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {!collapsed ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5" title={t('showEmptyRows')}>
                <Switch
                  id="storage-show-zero-qty"
                  checked={showZeroQty}
                  onCheckedChange={onShowZeroQtyChange}
                  className="scale-90"
                  aria-label={t('showEmptyRows')}
                />
                <Label
                  htmlFor="storage-show-zero-qty"
                  className="cursor-pointer whitespace-nowrap text-xs font-normal text-muted-foreground"
                >
                  {t('empty')}
                </Label>
              </div>
              <Tabs
                value={inventoryTypeFilter}
                onValueChange={(v) => onInventoryTypeFilterChange(v as InventoryType | 'all')}
                className="w-auto"
              >
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="px-2.5 text-xs">
                    {t('all')}
                  </TabsTrigger>
                  {INVENTORY_TYPES.map((typeOption) => (
                    <TabsTrigger key={typeOption.value} value={typeOption.value} className="px-2.5 text-xs">
                      {translateInventoryType(typeOption.value, t)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          ) : (
            onExpandRequest && (
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onExpandRequest}>
                {t('expand')}
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      </div>

      {!collapsed && (
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {incomingSummaryError && (
          <p className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            {incomingSummaryErrorMessage ??
              t('incomingUnavailable')}
          </p>
        )}
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
            <p className="text-muted-foreground">{t('loadingInventory')}</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <p className="text-destructive">{t('failedInventory')}</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <Table className={catalogTableClass}>
                <colgroup>
                  <col className="w-[280px]" />
                  <col className="w-[120px]" />
                  {showFactoryColumn ? <col className="w-[140px]" /> : null}
                  <col className="w-[100px]" />
                  <col className="w-[88px]" />
                  <col className="w-[108px]" />
                  <col className="w-[120px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className={catalogTableHeadRowClass}>
                    <TableHead className={catalogItemHeadClass}>{t('colItem')}</TableHead>
                    <TableHead data-testid="storage-incoming-header" className={catalogIncomingHeadClass}>
                      {t('colIncoming')}
                    </TableHead>
                    {showFactoryColumn && (
                      <TableHead className={catalogFactoryHeadClass}>{t('colFactory')}</TableHead>
                    )}
                    <TableHead className={catalogTypeHeadClass}>{t('colType')}</TableHead>
                    <TableHead className={catalogNumericHeadClass}>{t('colQty')}</TableHead>
                    <TableHead className={catalogMoneyHeadClass}>{t('colAvgPrice')}</TableHead>
                    <TableHead className={catalogActionsHeadClass}>{t('colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={showFactoryColumn ? 7 : 6} className="py-12 text-center">
                        <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        <p className="mb-4 text-muted-foreground">
                          {searchQuery
                            ? t('noMatchSearch')
                            : showZeroQty
                              ? t('noInventoryYet')
                              : t('noItemsInStock')}
                        </p>
                        {!searchQuery && showZeroQty && factoryId != null && (
                          <Button onClick={onAdd} className="bg-brand-primary hover:bg-brand-primary-hover">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addToInventoryBtn')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((inv) => {
                      const itemLabel = inv.item_name ?? t('itemNumber', { id: inv.item_id });
                      const itemTitle = inv.item_unit ? `${itemLabel} (${inv.item_unit})` : itemLabel;
                      return (
                      <TableRow key={inv.id} className={catalogTableRowClass}>
                        <TableCell className={catalogItemCellClass}>
                          <span className={catalogItemTextClass} title={itemTitle}>
                            {itemLabel}
                            {inv.item_unit && (
                              <span className="ml-1 text-xs text-muted-foreground">({inv.item_unit})</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className={catalogNumericCellClass}>
                          <IncomingQtyCell
                            summary={incomingByKey?.get(incomingSummaryKey(inv.factory_id, inv.item_id))}
                            itemUnit={inv.item_unit}
                            showIncoming={inv.inventory_type === 'STORAGE'}
                          />
                        </TableCell>
                        {showFactoryColumn && (
                          <TableCell className={catalogFactoryCellClass}>
                            {factoryLabels[inv.factory_id] ?? t('factoryNumber', { id: inv.factory_id })}
                          </TableCell>
                        )}
                        <TableCell className={catalogNumericCellClass}>
                          <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            {translateInventoryType(inv.inventory_type, t)}
                          </span>
                        </TableCell>
                        <TableCell className={catalogNumericCellClass}>{inv.qty}</TableCell>
                        <TableCell className={catalogMoneyCellClass}>{formatCurrency(inv.avg_price)}</TableCell>
                        <TableCell className={catalogActionsCellClass}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              title={t('viewInItems')}
                              asChild
                            >
                              <Link to={buildItemHref(inv.item_id)} aria-label={t('viewInItems')}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                              onClick={() => onEdit(inv)}
                              title={t('editInventory')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {(inv.qty ?? 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => onClearStock(inv)}
                                title={t('setQtyZero')}
                                aria-label={t('setQtyZero')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {paginationFooter}
          </>
        )}
      </CardContent>
      )}
    </Card>
  );
};

export default StorageSection;
