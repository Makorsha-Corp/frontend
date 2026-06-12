import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import StorageSection from './StorageSection';
import ProductsSection from './ProductsSection';
import StorageOverviewPanel from './StorageOverviewPanel';
import type { StorageLayoutMode } from './storageLayoutModes';
import type { Inventory, InventoryType } from '@/types/inventory';
import type { Product } from '@/types/product';
import type { ProductsOverviewStats, StorageOverviewStats } from './storageConstants';

export interface StoragePageLayoutProps {
  layout: StorageLayoutMode;
  onLayoutChange: (mode: StorageLayoutMode) => void;
  factoryId: number | null;
  storageOverview: StorageOverviewStats;
  productsOverview: ProductsOverviewStats;
  filteredInventory: Inventory[];
  filteredProducts: Product[];
  loadingInventory: boolean;
  loadingProducts: boolean;
  inventoryError: boolean;
  productsError: boolean;
  searchQuery: string;
  showZeroQty: boolean;
  onShowZeroQtyChange: (value: boolean) => void;
  inventoryTypeFilter: InventoryType | 'all';
  onInventoryTypeFilterChange: (value: InventoryType | 'all') => void;
  forSaleOnly: boolean;
  onForSaleOnlyChange: (value: boolean) => void;
  onAddInventory: () => void;
  onAddProduct: () => void;
  onEditInventory: (inv: Inventory) => void;
  onClearInventoryStock: (inv: Inventory) => void;
  onEditProduct: (prod: Product) => void;
  onDeleteProduct: (prod: Product) => void;
}

const StoragePageLayout: React.FC<StoragePageLayoutProps> = ({
  layout,
  onLayoutChange,
  factoryId,
  storageOverview,
  productsOverview,
  filteredInventory,
  filteredProducts,
  loadingInventory,
  loadingProducts,
  inventoryError,
  productsError,
  searchQuery,
  showZeroQty,
  onShowZeroQtyChange,
  inventoryTypeFilter,
  onInventoryTypeFilterChange,
  forSaleOnly,
  onForSaleOnlyChange,
  onAddInventory,
  onAddProduct,
  onEditInventory,
  onClearInventoryStock,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [contentTab, setContentTab] = useState<'storage' | 'products'>('storage');

  useEffect(() => {
    if (layout === 'tabs' || layout === 'focusStorage') {
      setContentTab('storage');
    } else if (layout === 'focusProducts') {
      setContentTab('products');
    }
  }, [layout]);

  const storageSectionProps = {
    factoryId,
    overview: storageOverview,
    inventory: filteredInventory,
    isLoading: loadingInventory,
    hasError: inventoryError,
    searchQuery,
    showZeroQty,
    onShowZeroQtyChange,
    inventoryTypeFilter,
    onInventoryTypeFilterChange,
    onAdd: onAddInventory,
    onEdit: onEditInventory,
    onClearStock: onClearInventoryStock,
  };

  const productsSectionProps = {
    factoryId,
    overview: productsOverview,
    products: filteredProducts,
    isLoading: loadingProducts,
    hasError: productsError,
    searchQuery,
    forSaleOnly,
    onForSaleOnlyChange,
    onAdd: onAddProduct,
    onEdit: onEditProduct,
    onDelete: onDeleteProduct,
  };

  if (layout === 'tabs') {
    return (
      <Tabs
        value={contentTab}
        onValueChange={(v) => setContentTab(v as 'storage' | 'products')}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <TabsList className="h-9 w-fit shrink-0">
          <TabsTrigger value="storage" className="gap-2 px-4 text-xs">
            <Archive className="h-3.5 w-3.5" />
            Storage ({storageOverview.records})
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 px-4 text-xs">
            <Package className="h-3.5 w-3.5" />
            Products ({productsOverview.records})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="storage" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
          <StorageSection {...storageSectionProps} />
        </TabsContent>
        <TabsContent value="products" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
          <ProductsSection {...productsSectionProps} />
        </TabsContent>
      </Tabs>
    );
  }

  if (layout === 'sideBySide') {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-2">
        <StorageSection {...storageSectionProps} className="min-h-[280px]" />
        <ProductsSection {...productsSectionProps} className="min-h-[280px]" />
      </div>
    );
  }

  if (layout === 'focusStorage') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <StorageSection {...storageSectionProps} />
        <ProductsSection
          {...productsSectionProps}
          collapsed
          onExpandRequest={() => onLayoutChange('focusProducts')}
        />
      </div>
    );
  }

  if (layout === 'focusProducts') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <StorageSection
          {...storageSectionProps}
          collapsed
          onExpandRequest={() => onLayoutChange('focusStorage')}
        />
        <ProductsSection {...productsSectionProps} />
      </div>
    );
  }

  if (layout === 'overview') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <StorageOverviewPanel
          factoryId={factoryId}
          storageOverview={storageOverview}
          productsOverview={productsOverview}
        />
        <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 overflow-hidden">
          <StorageSection {...storageSectionProps} className="min-h-0" />
          <ProductsSection {...productsSectionProps} className="min-h-0" />
        </div>
      </div>
    );
  }

  // stacked (default)
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4 overflow-hidden')}>
      <StorageSection {...storageSectionProps} />
      <ProductsSection {...productsSectionProps} />
    </div>
  );
};

export default StoragePageLayout;
