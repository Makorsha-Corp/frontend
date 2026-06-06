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
import { useGetTagsQuery } from '@/features/items/itemTagsApi';
import type { Item } from '@/types/item';
import { Package2, Plus, Search, Tags, X } from 'lucide-react';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import EditItemDialog from '@/components/newcomponents/customui/EditItemDialog';
import ItemTagsManagerDialog from '@/components/newcomponents/customui/ItemTagsManagerDialog';
import ItemDetailsDialog from '@/components/newcomponents/customui/ItemDetailsDialog';
import ItemsOverviewPanel from '@/components/newcomponents/customui/items/ItemsOverviewPanel';
import { API_LIMITS } from '@/constants/apiLimits';
import { filterItems, uniqueUnitsFromItems } from '@/features/items/itemsOverviewData';
import toast, { Toaster } from 'react-hot-toast';

const ITEMS_LIST_LIMIT = API_LIMITS.STRICT_100;

const ItemsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterTagId, setFilterTagId] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data: tags = [] } = useGetTagsQuery();
  const [deleteItem] = useDeleteItemMutation();

  const { data: allItems = [], isLoading, error } = useGetItemsQuery({
    skip: 0,
    limit: ITEMS_LIST_LIMIT,
  });

  const filterOpts = useMemo(
    () => ({
      searchQuery,
      unitFilter: filterUnit,
      tagFilter: filterTagId,
    }),
    [searchQuery, filterUnit, filterTagId]
  );

  const filteredItems = useMemo(
    () => filterItems(allItems, filterOpts),
    [allItems, filterOpts]
  );

  const uniqueUnits = useMemo(() => uniqueUnitsFromItems(allItems), [allItems]);

  const mayTruncate = allItems.length >= ITEMS_LIST_LIMIT;

  const hasActiveFilters = Boolean(searchQuery.trim() || filterUnit || filterTagId);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterUnit('');
    setFilterTagId('');
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

        <div className="flex-1 min-h-0 overflow-hidden">
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
                {tags.length > 0 && (
                  <Select
                    value={filterTagId || 'all'}
                    onValueChange={(value) => setFilterTagId(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="w-[160px] h-9 border-border bg-background text-sm">
                      {filterTagId ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                tags.find((t) => t.id.toString() === filterTagId)?.color ||
                                '#9067c6',
                            }}
                          />
                          <span className="truncate">
                            {tags.find((t) => t.id.toString() === filterTagId)?.name}
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Tag" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color || '#9067c6' }}
                            />
                            <span>{tag.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                <Button variant="outline" onClick={() => setIsTagsDialogOpen(true)} className="h-9">
                  <Tags className="mr-2 h-4 w-4" />
                  Manage Tags
                </Button>
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
      </div>

      <AddItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <EditItemDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} item={selectedItem} />
      <ItemTagsManagerDialog open={isTagsDialogOpen} onOpenChange={setIsTagsDialogOpen} />
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
