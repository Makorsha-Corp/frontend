import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product } from '@/types/product';
import { Package, Plus, Loader2, Pencil, Trash2, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildItemHref } from '@/lib/entityLinks';
import { formatCurrency, formatNumber, type ProductsOverviewStats } from './storageConstants';
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
} from './inventoryCatalogLayout';

interface ProductsSectionProps {
  factoryId: number | null;
  factoryLabels?: Record<number, string>;
  overview: ProductsOverviewStats;
  products: Product[];
  isLoading: boolean;
  hasError: boolean;
  searchQuery: string;
  forSaleOnly: boolean;
  onForSaleOnlyChange: (value: boolean) => void;
  onAdd: () => void;
  onEdit: (prod: Product) => void;
  onDelete: (prod: Product) => void;
  paginationFooter?: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  onExpandRequest?: () => void;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({
  factoryId,
  factoryLabels = {},
  overview,
  products,
  isLoading,
  hasError,
  searchQuery,
  forSaleOnly,
  onForSaleOnlyChange,
  onAdd,
  onEdit,
  onDelete,
  paginationFooter,
  className,
  collapsed = false,
  onExpandRequest,
}) => {
  const { t } = useTranslation('inventory');
  const marginHint =
    overview.totalSalesValue > 0 && overview.totalCostValue >= 0
      ? overview.totalSalesValue - overview.totalCostValue
      : null;
  const showFactoryColumn = factoryId == null;

  return (
    <Card className={cn(catalogSectionCardClass, collapsed ? 'shrink-0' : 'flex-1', className)}>
      <div className={cn('sticky top-0 z-10 shrink-0 bg-card', !collapsed && 'border-b border-border')}>
        <div className={catalogSectionToolbarClass}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className={catalogSectionIconTileClass}>
                <Package className="h-4 w-4 text-brand-primary" />
              </div>
              <h2 className={catalogSectionTitleClass}>{t('productsTitle')}</h2>
              <Badge variant="secondary" className="tabular-nums">
                {formatNumber(overview.records)}
              </Badge>
              {!collapsed && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={onAdd}
                  aria-label={t('addProduct')}
                  title={t('addProduct')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <p className={catalogSectionSummaryClass}>
                {t('summaryProducts', {
                  qty: formatNumber(overview.totalQty),
                  cost: formatCurrency(overview.totalCostValue),
                  sales: formatCurrency(overview.totalSalesValue),
                })}
              </p>
            </div>
            {!collapsed && (
              <div className={catalogSectionMetaClass}>
                <span>
                  {t('uniqueItemsLabel')}{' '}
                  <span className="font-medium tabular-nums text-card-foreground">{formatNumber(overview.uniqueCount)}</span>
                </span>
                <span>
                  {t('forSaleLabel')}{' '}
                  <span className="font-medium tabular-nums text-card-foreground">
                    {formatNumber(overview.availableForSale)}
                  </span>
                </span>
                {marginHint != null && (
                  <span>
                    {t('marginHintLabel')}{' '}
                    <span className="font-medium tabular-nums text-card-foreground">{formatCurrency(marginHint)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          {!collapsed ? (
            <div className="flex items-center gap-1.5" title={t('forSaleOnlyTitle')}>
              <Switch
                id="products-for-sale-only"
                checked={forSaleOnly}
                onCheckedChange={onForSaleOnlyChange}
                className="scale-90"
                aria-label={t('forSaleOnly')}
              />
              <Label
                htmlFor="products-for-sale-only"
                className="cursor-pointer whitespace-nowrap text-xs font-normal text-muted-foreground"
              >
                {t('forSaleOnly')}
              </Label>
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
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
            <p className="text-muted-foreground">{t('loadingProducts')}</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <p className="text-destructive">{t('failedProducts')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Package className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 max-w-sm text-center text-muted-foreground">
              {searchQuery
                ? t('noProductsSearch')
                : forSaleOnly
                  ? t('noProductsForSale')
                  : factoryId == null
                    ? t('noProductsPickFactory')
                    : t('noProductsYet')}
            </p>
            {!searchQuery && !forSaleOnly && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <Button onClick={onAdd} className="bg-brand-primary hover:bg-brand-primary-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addProductBtn')}
                </Button>
                <Link to="/storage" className="text-xs text-brand-primary underline-offset-2 hover:underline">
                  {t('openStorage')}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <Table className={catalogTableClass}>
                <colgroup>
                  <col className="w-[280px]" />
                  {showFactoryColumn ? <col className="w-[140px]" /> : null}
                  <col className="w-[88px]" />
                  <col className="w-[108px]" />
                  <col className="w-[108px]" />
                  <col className="w-[108px]" />
                  <col className="w-[88px]" />
                  <col className="w-[120px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className={catalogTableHeadRowClass}>
                    <TableHead className={catalogItemHeadClass}>{t('colItem')}</TableHead>
                    {showFactoryColumn && (
                      <TableHead className={catalogFactoryHeadClass}>{t('colFactory')}</TableHead>
                    )}
                    <TableHead className={catalogNumericHeadClass}>{t('colQty')}</TableHead>
                    <TableHead className={catalogNumericHeadClass}>{t('colMinOrderQty')}</TableHead>
                    <TableHead className={catalogMoneyHeadClass}>{t('colAvgCost')}</TableHead>
                    <TableHead className={catalogMoneyHeadClass}>{t('colSellingPrice')}</TableHead>
                    <TableHead className={catalogNumericHeadClass}>{t('colForSale')}</TableHead>
                    <TableHead className={catalogActionsHeadClass}>{t('colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod) => {
                    const itemLabel = prod.item_name ?? t('itemNumber', { id: prod.item_id });
                    const itemTitle = prod.item_unit ? `${itemLabel} (${prod.item_unit})` : itemLabel;
                    return (
                    <TableRow key={prod.id} className={catalogTableRowClass}>
                      <TableCell className={catalogItemCellClass}>
                        <span className={catalogItemTextClass} title={itemTitle}>
                          {itemLabel}
                          {prod.item_unit && (
                            <span className="ml-1 text-xs text-muted-foreground">({prod.item_unit})</span>
                          )}
                        </span>
                      </TableCell>
                      {showFactoryColumn && (
                        <TableCell className={catalogFactoryCellClass}>
                          {factoryLabels[prod.factory_id] ?? t('factoryNumber', { id: prod.factory_id })}
                        </TableCell>
                      )}
                      <TableCell className={catalogNumericCellClass}>{prod.qty}</TableCell>
                      <TableCell className={catalogNumericCellClass}>
                        {prod.min_order_qty ?? '—'}
                      </TableCell>
                      <TableCell className={catalogMoneyCellClass}>{formatCurrency(prod.avg_cost)}</TableCell>
                      <TableCell className={catalogMoneyCellClass}>{formatCurrency(prod.selling_price)}</TableCell>
                      <TableCell className={catalogNumericCellClass}>
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                            prod.is_available_for_sale
                              ? 'bg-brand-primary/15 text-brand-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {prod.is_available_for_sale ? t('yes') : t('no')}
                        </span>
                      </TableCell>
                      <TableCell className={catalogActionsCellClass}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          title={t('viewInItems')}
                          asChild
                        >
                          <Link to={buildItemHref(prod.item_id)} aria-label={t('viewInItems')}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                          onClick={() => onEdit(prod)}
                          title={t('editProduct')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(prod)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
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

export default ProductsSection;
