import React, { useState, useMemo, useEffect } from 'react';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import AddInventoryDialog from '@/components/newcomponents/customui/AddInventoryDialog';
import EditInventoryDialog from '@/components/newcomponents/customui/EditInventoryDialog';
import AddProductDialog from '@/components/newcomponents/customui/AddProductDialog';
import EditProductDialog from '@/components/newcomponents/customui/EditProductDialog';
import toast, { Toaster } from 'react-hot-toast';

const INVENTORY_TYPES: { value: InventoryType; label: string }[] = [
  { value: 'STORAGE', label: 'Storage' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'SCRAP', label: 'Scrap' },
];

type SectionType = 'storage' | 'products';

const SECTION_CONFIG = [
  { id: 'storage' as const, label: 'Storage', description: 'Items, damaged, waste, scrap', icon: Archive },
  { id: 'products' as const, label: 'Products', description: 'Factory-produced finished goods', icon: Package },
];

const StoragePage: React.FC = () => {
  const { factory: globalFactory } = useAppSelector((state) => state.auth);
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [factoryId, setFactoryId] = useState<number | null>(() => globalFactory?.id ?? null);
  const [selectedSection, setSelectedSection] = useState<SectionType>('storage');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<InventoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id]);

  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 });

  const { data: inventoryList = [], isLoading: loadingInventory, error: inventoryError } = useGetInventoryListQuery(
    {
      skip: 0,
      limit: 500,
      factory_id: factoryId ?? undefined,
      inventory_type: inventoryTypeFilter === 'all' ? undefined : inventoryTypeFilter,
    },
    { skip: selectedSection !== 'storage' }
  );

  const { data: productsList = [], isLoading: loadingProducts, error: productsError } = useGetProductsQuery(
    {
      skip: 0,
      limit: 500,
      factory_id: factoryId ?? undefined,
    },
    { skip: selectedSection !== 'products' }
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

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Archive className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Storage</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={factoryId?.toString() ?? '__none__'}
                onValueChange={(v) => setFactoryId(v === '__none__' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-[200px] bg-background border-border">
                  <SelectValue placeholder="Select factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All factories</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name} ({f.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder={selectedSection === 'storage' ? 'Search inventory...' : 'Search products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                />
              </div>
              {selectedSection === 'storage' && (
                <>
                  <Select
                    value={inventoryTypeFilter}
                    onValueChange={(v) => setInventoryTypeFilter(v as InventoryType | 'all')}
                  >
                    <SelectTrigger className="w-[140px] bg-background border-border">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {INVENTORY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setIsAddInventoryOpen(true)}
                    className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm h-9"
                    disabled={!factoryId}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Inventory
                  </Button>
                </>
              )}
              {selectedSection === 'products' && (
                <Button
                  onClick={() => setIsAddProductOpen(true)}
                  className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm h-9"
                  disabled={!factoryId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-background space-y-6">
          {/* Section pills */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto">
            {SECTION_CONFIG.map((config) => {
              const Icon = config.icon;
              const isActive = selectedSection === config.id;
              return (
                <button
                  key={config.id}
                  type="button"
                  onClick={() => setSelectedSection(config.id)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all text-left shrink-0 ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-border bg-card hover:border-brand-primary/30 hover:bg-brand-primary/5'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-brand-primary/20' : 'bg-muted'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-brand-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content card */}
          <Card className="shadow-sm bg-card border-border">
            <CardContent className="p-0">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  {selectedSection === 'storage'
                    ? `${filteredInventory.length} record${filteredInventory.length === 1 ? '' : 's'}`
                    : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <div className="p-4">
                {selectedSection === 'storage' && (
                  <>
                    {loadingInventory ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
                        <p className="text-muted-foreground">Loading inventory...</p>
                      </div>
                    ) : inventoryError ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-destructive">Failed to load inventory.</p>
                      </div>
                    ) : !factoryId ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select a factory to view inventory.</p>
                      </div>
                    ) : filteredInventory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {searchQuery ? 'No records match your search.' : 'No inventory records. Add one to get started.'}
                        </p>
                        {!searchQuery && (
                          <Button
                            onClick={() => setIsAddInventoryOpen(true)}
                            className="bg-brand-primary hover:bg-brand-primary-hover"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Inventory
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden">
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
                              <TableRow
                                key={inv.id}
                                className="hover:bg-brand-primary/5 border-b border-border last:border-0"
                              >
                                <TableCell className="font-mono text-sm text-muted-foreground py-3">{inv.id}</TableCell>
                                <TableCell className="font-medium text-card-foreground py-3">
                                  {inv.item_name ?? `Item #${inv.item_id}`}
                                  {inv.item_unit && (
                                    <span className="ml-1 text-xs text-muted-foreground">({inv.item_unit})</span>
                                  )}
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
                  </>
                )}

                {selectedSection === 'products' && (
                  <>
                    {loadingProducts ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
                        <p className="text-muted-foreground">Loading products...</p>
                      </div>
                    ) : productsError ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-destructive">Failed to load products.</p>
                      </div>
                    ) : !factoryId ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select a factory to view products.</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {searchQuery ? 'No products match your search.' : 'No products. Add one to get started.'}
                        </p>
                        {!searchQuery && (
                          <Button
                            onClick={() => setIsAddProductOpen(true)}
                            className="bg-brand-primary hover:bg-brand-primary-hover"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden">
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
                              <TableRow
                                key={prod.id}
                                className="hover:bg-brand-primary/5 border-b border-border last:border-0"
                              >
                                <TableCell className="font-mono text-sm text-muted-foreground py-3">{prod.id}</TableCell>
                                <TableCell className="font-medium text-card-foreground py-3">
                                  {prod.item_name ?? `Item #${prod.item_id}`}
                                  {prod.item_unit && (
                                    <span className="ml-1 text-xs text-muted-foreground">({prod.item_unit})</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3">{prod.qty}</TableCell>
                                <TableCell className="py-3">{formatCurrency(prod.avg_cost)}</TableCell>
                                <TableCell className="py-3">{formatCurrency(prod.selling_price)}</TableCell>
                                <TableCell className="py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                      prod.is_available_for_sale ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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
