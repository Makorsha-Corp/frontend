import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShellHeaderCompactList } from '@/components/newcomponents/customui/AppShellHeaderCompactList';
import { AppShellHeaderIconAction } from '@/components/newcomponents/customui/AppShellHeader';
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
import { appToast } from '@/lib/appToast';
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
      appToast.success(`Item "${item.name}" has been marked as inactive`);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setIsDetailsDialogOpen(false);
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to delete item');
    }
  };

  const unitSelectContent = (
    <>
      <SelectItem value="all">All Units</SelectItem>
      {unitOptions.map((unit) => (
        <SelectItem key={unit} value={unit}>
          {unit}
        </SelectItem>
      ))}
    </>
  );

  const unitSelectMobile = (
    <Select
      value={filterUnit || 'all'}
      onValueChange={(value) => {
        const unit = value === 'all' ? '' : value;
        setFilterUnit(unit);
        patchCatalogParams({ unitFilter: unit });
      }}
    >
      <SelectTrigger
        aria-label={filterUnit ? `Filter by ${filterUnit}` : 'Filter by units'}
        className="h-9 w-[5rem] shrink-0 border-border bg-background px-2 text-sm [&>svg]:ml-1 [&>svg]:h-3.5 [&>svg]:w-3.5"
      >
        <span className="truncate">{filterUnit || 'Units'}</span>
      </SelectTrigger>
      <SelectContent>{unitSelectContent}</SelectContent>
    </Select>
  );

  const unitSelectDesktop = (
    <Select
      value={filterUnit || 'all'}
      onValueChange={(value) => {
        const unit = value === 'all' ? '' : value;
        setFilterUnit(unit);
        patchCatalogParams({ unitFilter: unit });
      }}
    >
      <SelectTrigger className="h-9 w-[140px] border-border bg-background text-sm">
        <SelectValue placeholder="Units" />
      </SelectTrigger>
      <SelectContent>{unitSelectContent}</SelectContent>
    </Select>
  );

  const tagsActive =
    isTagsPanelOpen || filterTagIds.length > 0;

  const viewTagsMobileAction = (
    <div className="relative">
      <AppShellHeaderIconAction
        icon={Tag}
        onClick={() => setIsTagsPanelOpen((open) => !open)}
        ariaLabel="View tags"
        variant="outline"
        className={cn(
          tagsActive &&
            'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 hover:text-brand-primary',
        )}
      />
      {filterTagIds.length > 0 ? (
        <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-medium tabular-nums text-white">
          {filterTagIds.length}
        </span>
      ) : null}
    </div>
  );

  const viewTagsButton = (
    <Button
      variant="outline"
      onClick={() => setIsTagsPanelOpen((open) => !open)}
      className={cn(
        'hidden h-9 lg:inline-flex',
        tagsActive &&
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
  );

  const clearFiltersButton = hasActiveFilters ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearFilters}
      className="hidden h-9 text-muted-foreground hover:text-destructive lg:inline-flex"
    >
      <X className="mr-1 h-4 w-4" />
      Clear filters
    </Button>
  ) : null;

  const clearFiltersMobileAction = hasActiveFilters ? (
    <AppShellHeaderIconAction
      icon={X}
      onClick={clearFilters}
      ariaLabel="Clear filters"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive"
    />
  ) : null;

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeaderCompactList
          icon={Package2}
          title="Items Catalog"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          searchPlaceholder="Search items..."
          searchAriaLabel="Search items"
          mobileActions={
            <>
              {unitSelectMobile}
              {viewTagsMobileAction}
              {clearFiltersMobileAction}
            </>
          }
          desktopActions={
            <>
              {unitSelectDesktop}
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 bg-background pl-9"
                />
              </div>
              {clearFiltersButton}
              {viewTagsButton}
            </>
          }
          onAdd={() => setIsAddDialogOpen(true)}
          addButtonLabel="Add Item"
          addAriaLabel="Add item"
        />

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-4 lg:p-6">
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
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                aria-label="Close tags panel"
                onClick={() => setIsTagsPanelOpen(false)}
              />
              <ItemTagsFilterPanel
                selectedTagIds={filterTagIds}
                onSelectedTagIdsChange={(action) => {
                  const next =
                    typeof action === 'function' ? action(filterTagIds) : action;
                  setFilterTagIds(next);
                  patchCatalogParams({ tagFilterIds: next });
                }}
                onClose={() => setIsTagsPanelOpen(false)}
                className="fixed inset-y-0 right-0 z-50 h-full w-[min(18rem,92vw)] shrink-0 shadow-lg lg:static lg:z-auto lg:w-72 lg:shadow-none"
              />
            </>
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
