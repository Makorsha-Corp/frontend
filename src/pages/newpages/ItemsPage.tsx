import React, { useMemo, useState } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetItemsQuery, useDeleteItemMutation } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import { Package2, Plus, Search, Tag, X } from 'lucide-react';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import EditItemDialog from '@/components/newcomponents/customui/EditItemDialog';
import ItemTagsFilterPanel from '@/components/newcomponents/customui/items/ItemTagsFilterPanel';
import ItemDetailsDialog from '@/components/newcomponents/customui/ItemDetailsDialog';
import ItemsOverviewPanel from '@/components/newcomponents/customui/items/ItemsOverviewPanel';
import { API_LIMITS } from '@/constants/apiLimits';
import { filterItems, uniqueUnitsFromItems } from '@/features/items/itemsOverviewData';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const ITEMS_LIST_LIMIT = API_LIMITS.STRICT_100;

const ItemsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [deleteItem] = useDeleteItemMutation();

  const { data: allItems = [], isLoading, error } = useGetItemsQuery({
    skip: 0,
    limit: ITEMS_LIST_LIMIT,
  });

  const filterOpts = useMemo(
    () => ({
      searchQuery,
      unitFilter: filterUnit,
      tagFilterIds: filterTagIds,
    }),
    [searchQuery, filterUnit, filterTagIds]
  );

  const filteredItems = useMemo(
    () => filterItems(allItems, filterOpts),
    [allItems, filterOpts]
  );

  const uniqueUnits = useMemo(() => uniqueUnitsFromItems(allItems), [allItems]);

  const mayTruncate = allItems.length >= ITEMS_LIST_LIMIT;

  const hasActiveFilters = Boolean(searchQuery.trim() || filterUnit || filterTagIds.length > 0);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterUnit('');
    setFilterTagIds([]);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleView = (item: Item) => {
    setSelectedItem(item);
    setIsDetailsDialogOpen(true);
  };

  const handleDelete = async (item: Item) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${item.name}"? This will set it as inactive.`
      )
    ) {
      return;
    }

    try {
      await deleteItem(item.id).unwrap();
      toast.success(`Item "${item.name}" has been marked as inactive`);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setIsDetailsDialogOpen(false);
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete item');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <Package2 className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                Items Catalog
              </h1>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <ItemsOverviewPanel
              items={filteredItems}
              isLoading={isLoading}
              error={error}
              mayTruncate={mayTruncate}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              headerActions={
                <>
                  <Select
                    value={filterUnit || 'all'}
                    onValueChange={(value) => setFilterUnit(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All units</SelectItem>
                      {uniqueUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-background"
                    />
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear filters
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsTagsPanelOpen((open) => !open)}
                    className={cn(
                      'h-9',
                      (isTagsPanelOpen || filterTagIds.length > 0) &&
                        'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 hover:text-brand-primary'
                    )}
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    View Tags
                    {filterTagIds.length > 0 ? (
                      <span className="ml-2 rounded-full bg-brand-primary/20 px-1.5 py-0.5 text-xs tabular-nums">
                        {filterTagIds.length}
                      </span>
                    ) : null}
                  </Button>
                </>
              }
              emptyAction={
                !hasActiveFilters ? (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first item
                  </Button>
                ) : undefined
              }
            />
          </div>

          {isTagsPanelOpen ? (
            <ItemTagsFilterPanel
              selectedTagIds={filterTagIds}
              onSelectedTagIdsChange={setFilterTagIds}
              onClose={() => setIsTagsPanelOpen(false)}
            />
          ) : null}
        </div>
      </div>

      <AddItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <EditItemDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} item={selectedItem} />
      <ItemDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        item={selectedItem}
        onEdit={(item) => {
          setSelectedItem(item);
          setIsDetailsDialogOpen(false);
          setIsEditDialogOpen(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ItemsPage;
