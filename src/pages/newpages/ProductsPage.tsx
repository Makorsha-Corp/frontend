import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { usePageFactoryScopeId } from '@/hooks/usePageFactoryScope';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetProductsQuery, useDeleteProductMutation } from '@/features/products/productsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Product } from '@/types/product';
import { Package, Search } from 'lucide-react';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import AddProductDialog from '@/components/newcomponents/customui/AddProductDialog';
import EditProductDialog from '@/components/newcomponents/customui/EditProductDialog';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import ProductsKpiStrip from '@/components/newcomponents/customui/storage/ProductsKpiStrip';
import ProductsSection from '@/components/newcomponents/customui/storage/ProductsSection';
import {
  singleFactoryToSlice,
  sliceToSingleFactoryId,
} from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import { useScrollTargetHighlight } from '@/lib/scrollTargetHighlight';
import toast from 'react-hot-toast';

function parseProductsDeepLink(params: URLSearchParams): {
  factoryId: number | null;
  itemId: number | null;
} {
  const factoryRaw = params.get('factoryId');
  const itemRaw = params.get('itemId');

  const factoryId = factoryRaw ? parseInt(factoryRaw, 10) : null;
  const itemId = itemRaw ? parseInt(itemRaw, 10) : null;

  return {
    factoryId: factoryId != null && Number.isFinite(factoryId) ? factoryId : null,
    itemId: itemId != null && Number.isFinite(itemId) ? itemId : null,
  };
}

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLink = useMemo(() => parseProductsDeepLink(searchParams), [searchParams]);
  const { factoryId, setFactoryId } = usePageFactoryScopeId({
    initialOverride:
      deepLink.factoryId != null ? String(deepLink.factoryId) : undefined,
  });
  const [filterItemId, setFilterItemId] = useState<number | null>(() => deepLink.itemId);
  const [searchQuery, setSearchQuery] = useState('');
  const [forSaleOnly, setForSaleOnly] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [factoryPickerOpen, setFactoryPickerOpen] = useState(false);
  const {
    highlighted: factoryPickerHighlight,
    pulseHighlight: pulseFactoryPickerHighlight,
    dismissHighlight: dismissFactoryPickerHighlight,
  } = useScrollTargetHighlight();

  const promptFactorySelect = useCallback(() => {
    pulseFactoryPickerHighlight();
    setFactoryPickerOpen(true);
  }, [pulseFactoryPickerHighlight]);

  useEffect(() => {
    if (factoryId != null) {
      dismissFactoryPickerHighlight();
    }
  }, [factoryId, dismissFactoryPickerHighlight]);

  const handleAddProduct = useCallback(() => {
    setIsAddProductOpen(true);
  }, []);

  useEffect(() => {
    if (deepLink.factoryId != null) {
      setFactoryId(deepLink.factoryId);
    }
    if (deepLink.itemId != null) {
      setFilterItemId(deepLink.itemId);
    }
  }, [deepLink.factoryId, deepLink.itemId, setFactoryId]);

  useEffect(() => {
    if (!searchParams.has('factoryId')) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('factoryId');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 100 });

  const { data: productsList = [], isLoading: loadingProducts, error: productsError } = useGetProductsQuery(
    {
      skip: 0,
      limit: 500,
      factory_id: factoryId ?? undefined,
      is_available_for_sale: forSaleOnly ? true : undefined,
    }
  );

  const [deleteProduct] = useDeleteProductMutation();

  const filteredProducts = useMemo(() => {
    let list = productsList;
    if (filterItemId != null) {
      list = list.filter((p) => p.item_id === filterItemId);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        (p.item_name ?? '').toLowerCase().includes(q) ||
        (p.item_unit ?? '').toLowerCase().includes(q)
    );
  }, [productsList, searchQuery, filterItemId]);

  const productsOverview = useMemo(() => {
    const records = filteredProducts.length;
    const totalQty = filteredProducts.reduce((sum, p) => sum + (p.qty ?? 0), 0);
    const totalCostValue = filteredProducts.reduce((sum, p) => sum + (p.qty ?? 0) * (p.avg_cost ?? 0), 0);
    const totalSalesValue = filteredProducts.reduce((sum, p) => sum + (p.qty ?? 0) * (p.selling_price ?? 0), 0);
    const availableForSale = filteredProducts.filter((p) => p.is_available_for_sale).length;
    const uniqueCount = new Set(filteredProducts.map((p) => p.item_id)).size;
    return { records, totalQty, totalCostValue, totalSalesValue, availableForSale, uniqueCount };
  }, [filteredProducts]);

  const factoryLocationValue = useMemo(() => singleFactoryToSlice(factoryId), [factoryId]);

  const handleFactoryLocationChange = (slice: Partial<MachinesLocationFilterSlice>) => {
    if (slice.factory_ids === undefined) return;
    setFactoryId(sliceToSingleFactoryId({ factory_ids: slice.factory_ids }));
  };

  const factoryLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const f of factories) {
      labels[f.id] = f.abbreviation ? `${f.name} (${f.abbreviation})` : f.name;
    }
    return labels;
  }, [factories]);

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Deactivate "${prod.item_name ?? `Item #${prod.item_id}`}" product?`)) return;
    try {
      await deleteProduct(prod.id).unwrap();
      toast.success('Product deactivated');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate');
    }
  };

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No Factories Set Up</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            You need to create a factory before you can access products. Set up a factory to start tracking finished goods.
          </p>
          <Button
            size="lg"
            className="bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all"
            onClick={() => setIsAddFactoryOpen(true)}
          >
            Create Your First Factory
          </Button>

          <AddFactoryDialog
            open={isAddFactoryOpen}
            onOpenChange={setIsAddFactoryOpen}
            factories={factories}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={`${appShellHeaderLeftGroupClass} min-w-0 flex-1`}>
              <div className={appShellHeaderIconTileClass} aria-hidden>
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Products</h1>
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <MachinesInlineLocationFilters
                which="factories"
                variant="toolbar"
                selectionMode="single"
                value={factoryLocationValue}
                onChange={handleFactoryLocationChange}
                factories={factories}
                sections={[]}
                open={factoryPickerOpen}
                onOpenChange={setFactoryPickerOpen}
                highlight={factoryPickerHighlight}
                onHighlightDismiss={dismissFactoryPickerHighlight}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden bg-background p-8">
          <ProductsKpiStrip productsOverview={productsOverview} isLoading={loadingProducts} />
          <ProductsSection
            factoryId={factoryId}
            factoryLabels={factoryLabels}
            overview={productsOverview}
            products={filteredProducts}
            isLoading={loadingProducts}
            hasError={!!productsError}
            searchQuery={searchQuery}
            forSaleOnly={forSaleOnly}
            onForSaleOnlyChange={setForSaleOnly}
            onAdd={handleAddProduct}
            onRequireFactory={promptFactorySelect}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
            className="min-h-0 flex-1"
          />
        </div>
      </div>

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        factoryId={factoryId ?? 0}
        onSuccess={() => {}}
      />
      <EditProductDialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        product={editingProduct}
        onSuccess={() => setEditingProduct(null)}
      />
    </div>
  );
};

export default ProductsPage;
