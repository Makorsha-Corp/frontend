import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetInventoryListQuery, useDeleteInventoryMutation } from '@/features/inventory/inventoryApi';
import { useGetProductsQuery, useDeleteProductMutation } from '@/features/products/productsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useAppSelector } from '@/app/hooks';
import type { Inventory, InventoryType } from '@/types/inventory';
import type { Product } from '@/types/product';
import { Archive, Search } from 'lucide-react';
import AddInventoryDialog from '@/components/newcomponents/customui/AddInventoryDialog';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditInventoryDialog from '@/components/newcomponents/customui/EditInventoryDialog';
import AddProductDialog from '@/components/newcomponents/customui/AddProductDialog';
import EditProductDialog from '@/components/newcomponents/customui/EditProductDialog';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Tabs } from '@/components/ui/tabs';
import StoragePageLayout from '@/components/newcomponents/customui/storage/StoragePageLayout';
import StorageLayoutSwitcher from '@/components/newcomponents/customui/storage/StorageLayoutSwitcher';
import StorageHeaderTabs, { type StorageContentTab } from '@/components/newcomponents/customui/storage/StorageHeaderTabs';
import {
  loadStorageTabSwitcherStyle,
  saveStorageTabSwitcherStyle,
  loadStorageTabSwitcherPlacement,
  saveStorageTabSwitcherPlacement,
  type StorageTabSwitcherStyle,
  type StorageTabSwitcherPlacement,
} from '@/components/newcomponents/customui/storage/storageTabSwitcherStyles';
import { INVENTORY_TYPES } from '@/components/newcomponents/customui/storage/storageConstants';
import { DEFAULT_STORAGE_LAYOUT, type StorageLayoutMode } from '@/components/newcomponents/customui/storage/storageLayoutModes';
import toast from 'react-hot-toast';

const VALID_INVENTORY_TYPES = new Set<InventoryType>(['STORAGE', 'DAMAGED', 'WASTE', 'SCRAP']);

function parseStorageDeepLink(params: URLSearchParams): {
  factoryId: number | null;
  itemId: number | null;
  tab: StorageContentTab | null;
  inventoryType: InventoryType | null;
} {
  const factoryRaw = params.get('factoryId');
  const itemRaw = params.get('itemId');
  const tabRaw = params.get('tab');
  const typeRaw = params.get('inventoryType');

  const factoryId = factoryRaw ? parseInt(factoryRaw, 10) : null;
  const itemId = itemRaw ? parseInt(itemRaw, 10) : null;
  const tab = tabRaw === 'products' ? 'products' : tabRaw === 'storage' ? 'storage' : null;
  const inventoryType =
    typeRaw && VALID_INVENTORY_TYPES.has(typeRaw as InventoryType)
      ? (typeRaw as InventoryType)
      : null;

  return {
    factoryId: factoryId != null && Number.isFinite(factoryId) ? factoryId : null,
    itemId: itemId != null && Number.isFinite(itemId) ? itemId : null,
    tab,
    inventoryType,
  };
}

const StoragePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const deepLink = useMemo(() => parseStorageDeepLink(searchParams), [searchParams]);
  const { factory: globalFactory } = useAppSelector((state) => state.auth);
  const [factoryId, setFactoryId] = useState<number | null>(
    () => deepLink.factoryId ?? globalFactory?.id ?? null
  );
  const [filterItemId, setFilterItemId] = useState<number | null>(() => deepLink.itemId);
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<InventoryType | 'all'>(
    () => deepLink.inventoryType ?? 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showZeroQty, setShowZeroQty] = useState(false);
  const [forSaleOnly, setForSaleOnly] = useState(false);
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<StorageLayoutMode>(DEFAULT_STORAGE_LAYOUT);
  const [contentTab, setContentTab] = useState<StorageContentTab>(
    () => deepLink.tab ?? 'storage'
  );
  const [tabSwitcherStyle, setTabSwitcherStyle] = useState<StorageTabSwitcherStyle>(loadStorageTabSwitcherStyle);
  const [tabSwitcherPlacement, setTabSwitcherPlacement] = useState<StorageTabSwitcherPlacement>(
    loadStorageTabSwitcherPlacement
  );

  useEffect(() => {
    saveStorageTabSwitcherStyle(tabSwitcherStyle);
  }, [tabSwitcherStyle]);

  useEffect(() => {
    saveStorageTabSwitcherPlacement(tabSwitcherPlacement);
  }, [tabSwitcherPlacement]);

  useEffect(() => {
    if (layoutMode === 'tabs' || layoutMode === 'focusStorage') {
      setContentTab('storage');
    } else if (layoutMode === 'focusProducts') {
      setContentTab('products');
    }
  }, [layoutMode]);

  useEffect(() => {
    if (deepLink.factoryId != null) {
      setFactoryId(deepLink.factoryId);
    }
    if (deepLink.itemId != null) {
      setFilterItemId(deepLink.itemId);
    }
    if (deepLink.inventoryType != null) {
      setInventoryTypeFilter(deepLink.inventoryType);
    }
    if (deepLink.tab != null) {
      setContentTab(deepLink.tab);
    }
  }, [deepLink.factoryId, deepLink.itemId, deepLink.inventoryType, deepLink.tab]);

  useEffect(() => {
    if (deepLink.factoryId != null) return;
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id, deepLink.factoryId]);

  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 100 });

  const { data: inventoryList = [], isLoading: loadingInventory, error: inventoryError } = useGetInventoryListQuery(
    {
      skip: 0,
      limit: 500,
      factory_id: factoryId ?? undefined,
      inventory_type: inventoryTypeFilter === 'all' ? undefined : inventoryTypeFilter,
    }
  );

  const { data: productsList = [], isLoading: loadingProducts, error: productsError } = useGetProductsQuery(
    {
      skip: 0,
      limit: 500,
      factory_id: factoryId ?? undefined,
      is_available_for_sale: forSaleOnly ? true : undefined,
    }
  );

  const [deleteInventory] = useDeleteInventoryMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inventoryList.filter((inv) => {
      if (filterItemId != null && inv.item_id !== filterItemId) return false;
      if (!showZeroQty && (inv.qty ?? 0) <= 0) return false;
      if (!q) return true;
      return (
        (inv.item_name ?? '').toLowerCase().includes(q) ||
        (inv.item_unit ?? '').toLowerCase().includes(q)
      );
    });
  }, [inventoryList, searchQuery, showZeroQty, filterItemId]);

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

  const storageOverview = useMemo(() => {
    const records = filteredInventory.length;
    const totalQty = filteredInventory.reduce((sum, inv) => sum + (inv.qty ?? 0), 0);
    const estimatedValue = filteredInventory.reduce(
      (sum, inv) => sum + (inv.qty ?? 0) * (inv.avg_price ?? 0),
      0
    );
    const byType = INVENTORY_TYPES.map((t) => ({
      type: t.label,
      uniqueCount: new Set(
        filteredInventory
          .filter((inv) => inv.inventory_type === t.value)
          .map((inv) => inv.item_id)
      ).size,
      totalQty: filteredInventory
        .filter((inv) => inv.inventory_type === t.value)
        .reduce((sum, inv) => sum + (inv.qty ?? 0), 0),
    }));
    return { records, totalQty, estimatedValue, byType };
  }, [filteredInventory]);

  const productsOverview = useMemo(() => {
    const records = filteredProducts.length;
    const totalQty = filteredProducts.reduce((sum, p) => sum + (p.qty ?? 0), 0);
    const totalCostValue = filteredProducts.reduce((sum, p) => sum + (p.qty ?? 0) * (p.avg_cost ?? 0), 0);
    const totalSalesValue = filteredProducts.reduce((sum, p) => sum + (p.qty ?? 0) * (p.selling_price ?? 0), 0);
    const availableForSale = filteredProducts.filter((p) => p.is_available_for_sale).length;
    const uniqueCount = new Set(filteredProducts.map((p) => p.item_id)).size;
    return { records, totalQty, totalCostValue, totalSalesValue, availableForSale, uniqueCount };
  }, [filteredProducts]);

  const selectedFactory = useMemo(
    () => (factoryId ? factories.find((f) => f.id === factoryId) ?? null : null),
    [factoryId, factories]
  );
  const factoryLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const f of factories) {
      labels[f.id] = f.abbreviation ? `${f.name} (${f.abbreviation})` : f.name;
    }
    return labels;
  }, [factories]);
  const factorySelectorLabel = useMemo(() => {
    if (selectedFactory) return `${selectedFactory.name} (${selectedFactory.abbreviation})`;
    if (factories.length === 1) {
      const only = factories[0];
      return `${only.name} (${only.abbreviation})`;
    }
    return `All factories (${factories.length})`;
  }, [selectedFactory, factories]);

  const handleClearInventoryStock = async (inv: Inventory) => {
    if (
      !window.confirm(
        `Clear stock for "${inv.item_name ?? `Item #${inv.item_id}`}"? Quantity will be set to 0. Movement history is kept in the ledger.`
      )
    )
      return;
    try {
      await deleteInventory(inv.id).unwrap();
      toast.success('Stock cleared');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to clear stock');
    }
  };

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
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No Factories Set Up</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            You need to create a factory before you can access storage. Set up a factory to start tracking your inventory and products.
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

  const layoutProps = {
    layout: layoutMode,
    onLayoutChange: setLayoutMode,
    factoryId,
    factoryLabels,
    storageOverview,
    productsOverview,
    filteredInventory,
    filteredProducts,
    loadingInventory,
    loadingProducts,
    inventoryError: !!inventoryError,
    productsError: !!productsError,
    searchQuery,
    showZeroQty,
    onShowZeroQtyChange: setShowZeroQty,
    inventoryTypeFilter,
    onInventoryTypeFilterChange: setInventoryTypeFilter,
    forSaleOnly,
    onForSaleOnlyChange: setForSaleOnly,
    onAddInventory: () => setIsAddInventoryOpen(true),
    onAddProduct: () => setIsAddProductOpen(true),
    onEditInventory: setEditingInventory,
    onClearInventoryStock: handleClearInventoryStock,
    onEditProduct: setEditingProduct,
    onDeleteProduct: handleDeleteProduct,
    contentTab: layoutMode === 'tabs' ? contentTab : undefined,
    tabSwitcherStyle,
    tabSwitcherPlacement,
  };

  const tabsInHeader = layoutMode === 'tabs' && tabSwitcherPlacement === 'header';

  const storageHeader = (
    <AppShellHeader>
      <div
        className={
          tabsInHeader
            ? 'grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
            : 'flex flex-wrap items-center justify-between gap-4'
        }
      >
        <div
          className={
            tabsInHeader
              ? 'flex min-w-0 flex-wrap items-end gap-3 lg:justify-self-start'
              : 'flex min-w-0 flex-1 flex-wrap items-end gap-3'
          }
        >
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35"
              aria-hidden
            >
              <Archive className="h-5 w-5 text-brand-primary" />
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
              Storage
            </h1>
          </div>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Breadcrumb className="min-w-0 self-end">
            <BreadcrumbList className="text-card-foreground dark:text-foreground">
              <BreadcrumbItem className="max-w-[min(242px,44vw)] min-w-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 max-w-[min(242px,44vw)] justify-start gap-1 border-none bg-transparent px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground shadow-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="truncate text-card-foreground dark:text-foreground">{factorySelectorLabel}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                    align="start"
                  >
                    <DropdownMenuLabel>Factories</DropdownMenuLabel>
                    <DropdownMenuItem
                      className={factoryId == null ? 'bg-accent/70' : ''}
                      onSelect={(e) => {
                        e.preventDefault();
                        setFactoryId(null);
                      }}
                    >
                      All factories
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {factories.map((f) => (
                      <DropdownMenuItem
                        key={f.id}
                        className={factoryId === f.id ? 'bg-accent/70' : ''}
                        onSelect={(e) => {
                          e.preventDefault();
                          setFactoryId(f.id);
                        }}
                      >
                        {f.name} <span className="ml-1 text-muted-foreground">({f.abbreviation})</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {tabsInHeader && (
          <div className="flex justify-center lg:justify-self-center">
            <StorageHeaderTabs
              storageCount={storageOverview.records}
              productsCount={productsOverview.records}
              variant={tabSwitcherStyle}
            />
          </div>
        )}

        <div
          className={
            tabsInHeader
              ? 'flex flex-wrap items-center justify-end gap-3 lg:justify-self-end'
              : 'flex flex-wrap items-center gap-3'
          }
        >
          <StorageLayoutSwitcher
            value={layoutMode}
            onChange={setLayoutMode}
            tabSwitcherStyle={tabSwitcherStyle}
            onTabSwitcherStyleChange={setTabSwitcherStyle}
            tabSwitcherPlacement={tabSwitcherPlacement}
            onTabSwitcherPlacementChange={setTabSwitcherPlacement}
          />
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search inventory and products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 ${appShellHeaderControlClass} bg-background`}
            />
          </div>
        </div>
      </div>
    </AppShellHeader>
  );

  const storageBody = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-8">
      <StoragePageLayout {...layoutProps} />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {layoutMode === 'tabs' ? (
          <Tabs
            value={contentTab}
            onValueChange={(v) => setContentTab(v as StorageContentTab)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {storageHeader}
            {storageBody}
          </Tabs>
        ) : (
          <>
            {storageHeader}
            {storageBody}
          </>
        )}
      </div>

      <AddInventoryDialog
        open={isAddInventoryOpen}
        onOpenChange={setIsAddInventoryOpen}
        factoryId={factoryId ?? 0}
        onSuccess={() => {}}
      />
      <EditInventoryDialog
        open={!!editingInventory}
        onOpenChange={(open) => !open && setEditingInventory(null)}
        inventory={editingInventory}
        onSuccess={() => setEditingInventory(null)}
      />
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

export default StoragePage;
