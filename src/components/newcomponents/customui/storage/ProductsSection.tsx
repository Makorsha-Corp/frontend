import React from 'react';
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
  className,
  collapsed = false,
  onExpandRequest,
}) => {
  const marginHint =
    overview.totalSalesValue > 0 && overview.totalCostValue >= 0
      ? overview.totalSalesValue - overview.totalCostValue
      : null;
  const showFactoryColumn = factoryId == null;

  return (
    <Card className={cn('flex min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm', collapsed ? 'shrink-0' : 'flex-1', className)}>
      <div className={cn('sticky top-0 z-10 shrink-0 bg-card', !collapsed && 'border-b border-border')}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/25">
              <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-card-foreground">Products</h2>
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
                title="Add product"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatNumber(overview.totalQty)} units · {formatCurrency(overview.totalCostValue)} cost ·{' '}
              {formatCurrency(overview.totalSalesValue)} sales
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
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Unique items:{' '}
              <span className="font-medium tabular-nums text-card-foreground">{formatNumber(overview.uniqueCount)}</span>
            </span>
            <span>
              For sale:{' '}
              <span className="font-medium tabular-nums text-card-foreground">
                {formatNumber(overview.availableForSale)}
              </span>
            </span>
            {marginHint != null && (
              <span>
                Margin hint:{' '}
                <span className="font-medium tabular-nums text-card-foreground">{formatCurrency(marginHint)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5" title="Show only products available for sale">
            <Switch
              id="products-for-sale-only"
              checked={forSaleOnly}
              onCheckedChange={onForSaleOnlyChange}
              className="scale-90"
              aria-label="For sale only"
            />
            <Label
              htmlFor="products-for-sale-only"
              className="cursor-pointer whitespace-nowrap text-xs font-normal text-muted-foreground"
            >
              For sale only
            </Label>
          </div>
        </div>
        )}
      </div>

      {!collapsed && (
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <p className="text-destructive">Failed to load products.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Package className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              {searchQuery
                ? 'No products match your search.'
                : forSaleOnly
                  ? 'No products marked for sale.'
                  : 'No products yet.'}
            </p>
            {!searchQuery && !forSaleOnly && factoryId != null && (
              <Button onClick={onAdd} className="bg-brand-primary hover:bg-brand-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-brand-primary/5 dark:bg-brand-primary/10">
                  <TableHead className="py-3 text-xs font-semibold uppercase text-muted-foreground">Item</TableHead>
                  {showFactoryColumn && (
                    <TableHead className="w-[140px] py-3 text-xs font-semibold uppercase text-muted-foreground">
                      Factory
                    </TableHead>
                  )}
                  <TableHead className="w-[80px] py-3 text-xs font-semibold uppercase text-muted-foreground">Qty</TableHead>
                  <TableHead className="w-[100px] py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Avg. Cost
                  </TableHead>
                  <TableHead className="w-[100px] py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Selling Price
                  </TableHead>
                  <TableHead className="w-[80px] py-3 text-xs font-semibold uppercase text-muted-foreground">
                    For Sale
                  </TableHead>
                  <TableHead className="w-[120px] py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((prod) => (
                  <TableRow key={prod.id} className="border-b border-border last:border-0 hover:bg-brand-primary/5">
                    <TableCell className="py-3 font-medium text-card-foreground">
                      {prod.item_name ?? `Item #${prod.item_id}`}
                      {prod.item_unit && <span className="ml-1 text-xs text-muted-foreground">({prod.item_unit})</span>}
                    </TableCell>
                    {showFactoryColumn && (
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {factoryLabels[prod.factory_id] ?? `Factory #${prod.factory_id}`}
                      </TableCell>
                    )}
                    <TableCell className="py-3 tabular-nums">{prod.qty}</TableCell>
                    <TableCell className="py-3 tabular-nums">{formatCurrency(prod.avg_cost)}</TableCell>
                    <TableCell className="py-3 tabular-nums">{formatCurrency(prod.selling_price)}</TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          prod.is_available_for_sale
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {prod.is_available_for_sale ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          title="View in Items catalog"
                          asChild
                        >
                          <Link to={buildItemHref(prod.item_id)} aria-label="View in Items catalog">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                          onClick={() => onEdit(prod)}
                          title="Edit product"
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

export default ProductsSection;
