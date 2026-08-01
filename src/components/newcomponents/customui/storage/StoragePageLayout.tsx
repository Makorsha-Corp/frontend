import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import StorageSection from './StorageSection';
import ProductsSection from './ProductsSection';
import StorageOverviewPanel from './StorageOverviewPanel';
import StorageTabKpiStrip from './StorageTabKpiStrip';
import StorageHeaderTabs from './StorageHeaderTabs';
import type { StorageContentTab } from './StorageHeaderTabs';
import type { StorageTabSwitcherPlacement, StorageTabSwitcherStyle } from './storageTabSwitcherStyles';
import type { StorageLayoutMode } from './storageLayoutModes';
import type { Inventory, InventoryType } from '@/types/inventory';
import type { Product } from '@/types/product';
import type { ProductsOverviewStats, StorageOverviewStats } from './storageConstants';

export interface StoragePageLayoutProps {
  layout: StorageLayoutMode;
  onLayoutChange: (mode: StorageLayoutMode) => void;
  factoryId: number | null;
  factoryLabels?: Record<number, string>;
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
  /** Required when `layout === 'tabs'` — tabs live in the page header. */
  contentTab?: StorageContentTab;
  tabSwitcherStyle?: StorageTabSwitcherStyle;
  tabSwitcherPlacement?: StorageTabSwitcherPlacement;
}

const StoragePageLayout: React.FC<StoragePageLayoutProps> = ({
  layout,
  onLayoutChange,
  factoryId,
  factoryLabels,
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
  contentTab: contentTabProp,
  tabSwitcherStyle = 'underline',
  tabSwitcherPlacement = 'header',
}) => {
  const [internalTab, setInternalTab] = useState<StorageContentTab>('storage');

  useEffect(() => {
    if (layout === 'tabs' || layout === 'focusStorage') {
      setInternalTab('storage');
    } else if (layout === 'focusProducts') {
      setInternalTab('products');
    }
  }, [layout]);

  const contentTab = layout === 'tabs' ? (contentTabProp ?? 'storage') : internalTab;

  const storageSectionProps = {
    factoryId,
    factoryLabels,
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
    factoryLabels,
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
    const tabLoading = contentTab === 'storage' ? loadingInventory : loadingProducts;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
        {tabSwitcherPlacement === 'content' && (
          <div className="flex shrink-0 justify-center">
            <StorageHeaderTabs
              storageCount={storageOverview.records}
              productsCount={productsOverview.records}
              variant={tabSwitcherStyle}
            />
          </div>
        )}

        <StorageTabKpiStrip
          activeTab={contentTab}
          factoryId={factoryId}
          factoryLabels={factoryLabels}
          storageOverview={storageOverview}
          productsOverview={productsOverview}
          isLoading={tabLoading}
        />

        <TabsContent
          value="storage"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <StorageSection {...storageSectionProps} />
        </TabsContent>
        <TabsContent
          value="products"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <ProductsSection {...productsSectionProps} />
        </TabsContent>
      </div>
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
