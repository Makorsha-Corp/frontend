import React, { useState, useMemo, useEffect } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Archive,
  Package,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  DollarSign,
} from 'lucide-react';
import AddInventoryDialog from '@/components/newcomponents/customui/AddInventoryDialog';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditInventoryDialog from '@/components/newcomponents/customui/EditInventoryDialog';
import AddProductDialog from '@/components/newcomponents/customui/AddProductDialog';
import EditProductDialog from '@/components/newcomponents/customui/EditProductDialog';
import ActiveOrdersPanel from '@/components/newcomponents/customui/RunningOrdersPlaceholder';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import toast from 'react-hot-toast';

const INVENTORY_TYPES: { value: InventoryType; label: string }[] = [
  { value: 'STORAGE', label: 'Storage' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'SCRAP', label: 'Scrap' },
];

const StoragePage: React.FC = () => {
  const { factory: globalFactory } = useAppSelector((state) => state.auth);
  const [factoryId, setFactoryId] = useState<number | null>(() => globalFactory?.id ?? null);
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<InventoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);

  useEffect(() => {
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id]);

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
    }
  );

  const [deleteInventory] = useDeleteInventoryMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventoryList;
    const q = searchQuery.toLowerCase();
    return inventoryList.filter(
      (inv) =>
        (inv.item_name ?? '').toLowerCase().includes(q) ||
        (inv.item_unit ?? '').toLowerCase().includes(q)
    );
  }, [inventoryList, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList;
    const q = searchQuery.toLowerCase();
    return productsList.filter(
      (p) =>
        (p.item_name ?? '').toLowerCase().includes(q) ||
        (p.item_unit ?? '').toLowerCase().includes(q)
    );
  }, [productsList, searchQuery]);

  const formatCurrency = (value: number | null | undefined) =>
    value != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
      : '—';

  const formatNumber = (value: number | null | undefined) =>
    value != null ? new Intl.NumberFormat('en-US').format(value) : '—';

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
  const factorySelectorLabel = useMemo(() => {
    if (selectedFactory) return `${selectedFactory.name} (${selectedFactory.abbreviation})`;
    if (factories.length === 1) {
      const only = factories[0];
      return `${only.name} (${only.abbreviation})`;
    }
    return `All factories (${factories.length})`;
  }, [selectedFactory, factories]);

  const handleDeleteInventory = async (inv: Inventory) => {
    if (!window.confirm(`Deactivate "${inv.item_name ?? `Item #${inv.item_id}`}" from inventory?`)) return;
    try {
      await deleteInventory(inv.id).unwrap();
      toast.success('Inventory record deactivated');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate');
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

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className="flex min-w-0 items-center gap-3 shrink-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35" aria-hidden>
                  <Archive className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">Storage</h1>
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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

        <div className="p-8 bg-background space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">By type</p>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total qty</p>
                    <p className="text-lg font-semibold text-card-foreground tabular-nums">
                      {formatNumber((storageOverview.totalQty ?? 0) + (productsOverview.totalQty ?? 0))}
                    </p>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5 text-sm">
                  {storageOverview.byType.map((row) => (
                    <div key={row.type} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{row.type}</span>
                      <span className="font-medium text-card-foreground tabular-nums">
                        {formatNumber(row.uniqueCount)} ({formatNumber(row.totalQty)})
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium text-card-foreground tabular-nums">
                      {formatNumber(productsOverview.uniqueCount)} ({formatNumber(productsOverview.totalQty)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Value overview</p>
                  <div className="rounded-lg bg-brand-primary/10 p-2.5">
                    <DollarSign className="h-5 w-5 text-brand-primary" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Storage estimated value</span>
                    <span className="font-semibold text-card-foreground tabular-nums">
                      {formatCurrency(storageOverview.estimatedValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Products cost value</span>
                    <span className="font-semibold text-card-foreground tabular-nums">
                      {formatCurrency(productsOverview.totalCostValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Potential sales value</span>
                    <span className="font-semibold text-card-foreground tabular-nums">
                      {formatCurrency(productsOverview.totalSalesValue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                {factoryId ? (
                  <ActiveOrdersPanel scope={{ factoryId }} minimal compact />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-card-foreground">Active orders</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">select factory</span>
                    </div>
                    <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                      <div className="h-3.5 w-2/3 rounded bg-muted" />
                      <div className="h-3.5 w-1/2 rounded bg-muted" />
                      <div className="h-3.5 w-3/4 rounded bg-muted" />
                    </div>
                    <p className="text-xs text-muted-foreground">Select a factory to see running orders.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="shadow-sm bg-card border-border">
              <CardContent className="p-4 min-h-[560px] flex flex-col">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-card-foreground">Storage</h2>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setIsAddInventoryOpen(true)}
                      disabled={!factoryId}
                      title="Add to inventory"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Tabs
                    value={inventoryTypeFilter}
                    onValueChange={(v) => setInventoryTypeFilter(v as InventoryType | 'all')}
                    className="w-auto"
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="px-2.5 text-xs">All</TabsTrigger>
                      {INVENTORY_TYPES.map((t) => (
                        <TabsTrigger key={t.value} value={t.value} className="px-2.5 text-xs">
                          {t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                {loadingInventory ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
                    <p className="text-muted-foreground">Loading inventory...</p>
                  </div>
                ) : inventoryError ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <p className="text-destructive">Failed to load inventory.</p>
                  </div>
                ) : !factoryId ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <Archive className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Select a factory to view inventory.</p>
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <Archive className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'No inventory rows match your search.' : 'No inventory records yet.'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setIsAddInventoryOpen(true)} className="bg-brand-primary hover:bg-brand-primary-hover">
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Inventory
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[460px] max-h-[70vh] flex-1 overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b border-border">
                          <TableHead className="w-[60px] py-3 text-xs font-semibold text-muted-foreground uppercase">ID</TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-muted-foreground uppercase">Item</TableHead>
                          <TableHead className="w-[100px] py-3 text-xs font-semibold text-muted-foreground uppercase">Type</TableHead>
                          <TableHead className="w-[80px] py-3 text-xs font-semibold text-muted-foreground uppercase">Qty</TableHead>
                          <TableHead className="w-[100px] py-3 text-xs font-semibold text-muted-foreground uppercase">Avg. Price</TableHead>
                          <TableHead className="text-right w-[120px] py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-brand-primary/5 border-b border-border last:border-0">
                            <TableCell className="font-mono text-sm text-muted-foreground py-3">{inv.id}</TableCell>
                            <TableCell className="font-medium text-card-foreground py-3">
                              {inv.item_name ?? `Item #${inv.item_id}`}
                              {inv.item_unit && <span className="ml-1 text-xs text-muted-foreground">({inv.item_unit})</span>}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                {inv.inventory_type}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">{inv.qty}</TableCell>
                            <TableCell className="py-3">{formatCurrency(inv.avg_price)}</TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                                  onClick={() => setEditingInventory(inv)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteInventory(inv)}
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
            </Card>

            <Card className="shadow-sm bg-card border-border">
              <CardContent className="p-4 min-h-[560px] flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-card-foreground">Products</h2>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setIsAddProductOpen(true)}
                      disabled={!factoryId}
                      title="Add product"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {loadingProducts ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                ) : productsError ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <p className="text-destructive">Failed to load products.</p>
                  </div>
                ) : !factoryId ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <Package className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Select a factory to view products.</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16">
                    <Package className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'No products match your search.' : 'No products yet.'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setIsAddProductOpen(true)} className="bg-brand-primary hover:bg-brand-primary-hover">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[460px] max-h-[70vh] flex-1 overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b border-border">
                          <TableHead className="w-[60px] py-3 text-xs font-semibold text-muted-foreground uppercase">ID</TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-muted-foreground uppercase">Item</TableHead>
                          <TableHead className="w-[80px] py-3 text-xs font-semibold text-muted-foreground uppercase">Qty</TableHead>
                          <TableHead className="w-[100px] py-3 text-xs font-semibold text-muted-foreground uppercase">Avg. Cost</TableHead>
                          <TableHead className="w-[100px] py-3 text-xs font-semibold text-muted-foreground uppercase">Selling Price</TableHead>
                          <TableHead className="w-[80px] py-3 text-xs font-semibold text-muted-foreground uppercase">For Sale</TableHead>
                          <TableHead className="text-right w-[120px] py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((prod) => (
                          <TableRow key={prod.id} className="hover:bg-brand-primary/5 border-b border-border last:border-0">
                            <TableCell className="font-mono text-sm text-muted-foreground py-3">{prod.id}</TableCell>
                            <TableCell className="font-medium text-card-foreground py-3">
                              {prod.item_name ?? `Item #${prod.item_id}`}
                              {prod.item_unit && <span className="ml-1 text-xs text-muted-foreground">({prod.item_unit})</span>}
                            </TableCell>
                            <TableCell className="py-3">{prod.qty}</TableCell>
                            <TableCell className="py-3">{formatCurrency(prod.avg_cost)}</TableCell>
                            <TableCell className="py-3">{formatCurrency(prod.selling_price)}</TableCell>
                            <TableCell className="py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
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
                                  className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                                  onClick={() => setEditingProduct(prod)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteProduct(prod)}
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
            </Card>
          </div>
        </div>
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
