import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import {
  useGetItemsPageQuery,
  useGetItemByIdQuery,
  useGetItemUnitsQuery,
  useDeleteItemMutation,
} from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import { Package2, Plus, Search, Tag, X } from 'lucide-react';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import EditItemDialog from '@/components/newcomponents/customui/EditItemDialog';
import ItemTagsFilterPanel from '@/components/newcomponents/customui/items/ItemTagsFilterPanel';
import ItemDetailsDialog from '@/components/newcomponents/customui/item-details/ItemDetailsDialog';
import ItemsOverviewPanel from '@/components/newcomponents/customui/items/ItemsOverviewPanel';
import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  buildItemsCatalogQueryParams,
  itemsPageCount,
  parseItemsCatalogFilters,
  parseItemsCatalogPage,
} from '@/features/items/itemsCatalogParams';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const ItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  const detailsParam = searchParams.get('details');
  const deepLinkItemId = itemIdParam ? parseInt(itemIdParam, 10) : null;

  const catalogFilters = useMemo(() => parseItemsCatalogFilters(searchParams), [searchParams]);
  const catalogPage = parseItemsCatalogPage(searchParams.get('itemPage'));

  const [searchInput, setSearchInput] = useState(catalogFilters.searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(catalogFilters.searchQuery);
  const [filterUnit, setFilterUnit] = useState(catalogFilters.unitFilter);
  const [filterTagIds, setFilterTagIds] = useState<number[]>(catalogFilters.tagFilterIds);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [deleteItem] = useDeleteItemMutation();

  useEffect(() => {
    setSearchInput(catalogFilters.searchQuery);
    setDebouncedSearch(catalogFilters.searchQuery);
    setFilterUnit(catalogFilters.unitFilter);
    setFilterTagIds(catalogFilters.tagFilterIds);
  }, [catalogFilters.searchQuery, catalogFilters.unitFilter, catalogFilters.tagFilterIds]);

  const activeFilters = useMemo(
    () => ({
      searchQuery: catalogFilters.searchQuery,
      unitFilter: catalogFilters.unitFilter,
      tagFilterIds: catalogFilters.tagFilterIds,
    }),
    [catalogFilters.searchQuery, catalogFilters.unitFilter, catalogFilters.tagFilterIds],
  );

  const patchCatalogParams = useCallback(
    (
      patch: Partial<{ searchQuery: string; unitFilter: string; tagFilterIds: number[]; page: number }>,
      options?: { resetPage?: boolean },
    ) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = parseItemsCatalogFilters(prev);
        const merged = {
          searchQuery: patch.searchQuery ?? current.searchQuery,
          unitFilter: patch.unitFilter ?? current.unitFilter,
          tagFilterIds: patch.tagFilterIds ?? current.tagFilterIds,
          page: patch.page ?? parseItemsCatalogPage(prev.get('itemPage')),
        };

        if (options?.resetPage !== false && patch.page == null) {
          merged.page = 1;
        }

        const search = merged.searchQuery.trim();
        if (search) next.set('itemSearch', search);
        else next.delete('itemSearch');

        if (merged.unitFilter) next.set('itemUnit', merged.unitFilter);
        else next.delete('itemUnit');

        if (merged.tagFilterIds.length > 0) next.set('itemTags', merged.tagFilterIds.join(','));
        else next.delete('itemTags');

        if (merged.page > 1) next.set('itemPage', String(merged.page));
        else next.delete('itemPage');

        return next;
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch === catalogFilters.searchQuery) return;
    patchCatalogParams({ searchQuery: debouncedSearch });
  }, [debouncedSearch, catalogFilters.searchQuery, patchCatalogParams]);

  const queryParams = useMemo(
    () => buildItemsCatalogQueryParams(activeFilters, { page: catalogPage }),
    [activeFilters, catalogPage],
  );

  const { data: itemsPage, isLoading, isFetching, error } = useGetItemsPageQuery(queryParams);
  const { data: unitOptions = [] } = useGetItemUnitsQuery();

  const items = useMemo(() => itemsPage?.items ?? [], [itemsPage]);
  const itemsTotal = itemsPage?.total ?? 0;

  const { data: deepLinkItem } = useGetItemByIdQuery(deepLinkItemId ?? 0, {
    skip: deepLinkItemId == null || !Number.isFinite(deepLinkItemId),
  });

  useEffect(() => {
    if (detailsParam !== '1' || deepLinkItemId == null || !Number.isFinite(deepLinkItemId)) return;

    const fromList = items.find((item) => item.id === deepLinkItemId);
    const item = fromList ?? deepLinkItem;
    if (!item) return;

    setSelectedItem(item);
    setIsDetailsDialogOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('details');
        return next;
      },
      { replace: true },
    );
  }, [detailsParam, deepLinkItemId, items, deepLinkItem, setSearchParams]);

  useEffect(() => {
    if (itemsPage === undefined) return;
    const maxPage = itemsPageCount(itemsPage.total);
    if (catalogPage <= maxPage) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (maxPage <= 1) next.delete('itemPage');
      else next.set('itemPage', String(maxPage));
      return next;
    });
  }, [itemsPage, catalogPage, setSearchParams]);

  const hasActiveFilters = Boolean(
    activeFilters.searchQuery || activeFilters.unitFilter || activeFilters.tagFilterIds.length > 0,
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilterUnit('');
    setFilterTagIds([]);
    patchCatalogParams({ searchQuery: '', unitFilter: '', tagFilterIds: [] });
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
        `Are you sure you want to delete "${item.name}"? This will set it as inactive.`,
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
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-6">
            <ItemsOverviewPanel
              items={items}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              paginationFooter={
                <ListPagePagination
                  page={catalogPage}
                  total={itemsTotal}
                  pageSize={API_LIMITS.ITEMS_CATALOG_PAGE_SIZE}
                  isFetching={isFetching}
                  onPageChange={(page) => patchCatalogParams({ page }, { resetPage: false })}
                />
              }
              headerActions={
                <>
                  <Select
                    value={filterUnit || 'all'}
                    onValueChange={(value) => {
                      const unit = value === 'all' ? '' : value;
                      setFilterUnit(unit);
                      patchCatalogParams({ unitFilter: unit });
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All units</SelectItem>
                      {unitOptions.map((unit) => (
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
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
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
                        'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 hover:text-brand-primary',
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
              onSelectedTagIdsChange={(action) => {
                const next =
                  typeof action === 'function' ? action(filterTagIds) : action;
                setFilterTagIds(next);
                patchCatalogParams({ tagFilterIds: next });
              }}
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
    </>
  );
};

export default ItemsPage;
