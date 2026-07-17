import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import {
  EmphasisTabsProvider,
  EmphasisTabsList,
  EmphasisTabsTrigger,
  EmphasisTabPanel,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetMachineItemsQuery } from '@/features/machineItems/machineItemsApi';
import { API_LIMITS } from '@/constants/apiLimits';
import type { Item } from '@/types/item';
import type { Inventory, InventoryType } from '@/types/inventory';
import type { MachineItem } from '@/types/machineItem';
import type { Machine } from '@/types/machine';
import MachineSelectorTile, {
  activeMachines,
  filterAndSortMachines,
  MachineSelectorFooterStatus,
} from '@/components/newcomponents/customui/MachineSelectorTile';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Search } from 'lucide-react';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';

const INVENTORY_TYPE_OPTIONS: { value: InventoryType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'SCRAP', label: 'Scrap' },
];

const INVENTORY_TYPE_LABEL: Record<InventoryType, string> = {
  STORAGE: 'Storage',
  DAMAGED: 'Damaged',
  WASTE: 'Waste',
  SCRAP: 'Scrap',
};

export interface ItemSelection {
  itemId: number;
  itemName: string;
  itemUnit?: string | null;
  selectionSource: 'catalog' | 'storage' | 'machine';
  availableQty?: number;
  inventoryType?: InventoryType;
  factoryId?: number;
  machineId?: number;
}

export interface ItemSelectorMachineOption {
  id: number;
  name: string;
  factory_section_id?: number;
}

export interface ItemSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: ItemSelection) => void;
  selectedItemId?: number;
  /** Locks factory filter when not in inventoryOnly mode. */
  factoryId?: number;
  /** Initial factory when inventoryOnly shows scoped pickers. */
  defaultFactoryId?: number;
  /** Initial section when inventoryOnly shows scoped pickers. */
  defaultSectionId?: number;
  initialTab?: 'catalog' | 'storage' | 'machine';
  catalogOnly?: boolean;
  inventoryOnly?: boolean;
  includeMachineStock?: boolean;
  machines?: ItemSelectorMachineOption[];
  defaultMachineId?: number;
  inStockOnly?: boolean;
  title?: string;
  description?: string;
}

type TabValue = 'catalog' | 'storage' | 'machine';

interface CatalogHighlight {
  kind: 'catalog';
  item: Item;
}

interface StorageHighlight {
  kind: 'storage';
  row: Inventory;
}

interface MachineHighlight {
  kind: 'machine';
  row: MachineItem;
}

type Highlight = CatalogHighlight | StorageHighlight | MachineHighlight | null;

const CATALOG_PAGE_SIZE = API_LIMITS.STRICT_100;
const EMPTY_MACHINE_OPTIONS: ItemSelectorMachineOption[] = [];

function isRadixSelectPortalTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[data-radix-select-content]') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('[role="listbox"]'),
  );
}

function mergeCatalogPages(prev: Item[], page: Item[], replace: boolean): Item[] {
  if (replace) return page;
  if (page.length === 0) return prev;
  const ids = new Set(prev.map((i) => i.id));
  const next = [...prev];
  for (const item of page) {
    if (!ids.has(item.id)) next.push(item);
  }
  return next;
}

function formatItemLabel(name: string, unit?: string | null, suffix?: string): string {
  const base = unit ? `${name} (${unit})` : name;
  return suffix ? `${base} ${suffix}` : base;
}

function resolveInitialTab(
  catalogOnly: boolean,
  inventoryOnly: boolean,
  includeMachineStock: boolean,
  initialTab: 'catalog' | 'storage' | 'machine',
): TabValue {
  if (catalogOnly) return 'catalog';
  if (inventoryOnly) {
    if (initialTab === 'machine' && includeMachineStock) return 'machine';
    return 'storage';
  }
  if (initialTab === 'machine' && includeMachineStock) return 'machine';
  if (initialTab === 'storage') return 'storage';
  return 'catalog';
}

const ItemSelectorDialog: React.FC<ItemSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedItemId,
  factoryId: factoryIdProp,
  defaultFactoryId,
  defaultSectionId,
  initialTab = 'catalog',
  catalogOnly = false,
  inventoryOnly = false,
  includeMachineStock = false,
  machines = EMPTY_MACHINE_OPTIONS,
  defaultMachineId,
  inStockOnly = true,
  title = 'Select item',
  description = 'Choose from the item catalog or from factory inventory on hand.',
}) => {
  const [tab, setTab] = useState<TabValue>(() =>
    resolveInitialTab(catalogOnly, inventoryOnly, includeMachineStock, initialTab),
  );
  const [search, setSearch] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [highlighted, setHighlighted] = useState<Highlight>(null);
  const [factoryPickerId, setFactoryPickerId] = useState('');
  const [sectionPickerId, setSectionPickerId] = useState('');
  const [machinePickerId, setMachinePickerId] = useState('');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<InventoryType | 'all'>('all');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [catalogSkip, setCatalogSkip] = useState(0);
  const [accumulatedCatalogItems, setAccumulatedCatalogItems] = useState<Item[]>([]);
  const [catalogHasMore, setCatalogHasMore] = useState(false);

  /** Undefined = all factories (same as Storage page with no factory filter). */
  const storageFactoryFilter = useMemo(() => {
    if (inventoryOnly) {
      if (factoryPickerId) return Number(factoryPickerId);
      return undefined;
    }
    if (factoryIdProp != null) return factoryIdProp;
    if (factoryPickerId) return Number(factoryPickerId);
    return undefined;
  }, [factoryIdProp, factoryPickerId, inventoryOnly]);

  const showAllFactoriesStorage = storageFactoryFilter == null && !inventoryOnly;
  const showFactoryPicker = inventoryOnly || factoryIdProp == null;
  const showSectionPicker = inventoryOnly;

  const showCatalogTab = !catalogOnly && !inventoryOnly;
  const showStorageTab = !catalogOnly;
  const showMachineTab = includeMachineStock && !catalogOnly;
  const useTabSwitcher =
    (showCatalogTab && showStorageTab) ||
    (showStorageTab && showMachineTab && !showCatalogTab) ||
    (showCatalogTab && showMachineTab);

  const resolvedMachineId = machinePickerId ? Number(machinePickerId) : undefined;
  const resolvedSectionId = sectionPickerId ? Number(sectionPickerId) : undefined;

  const { data: factories = [] } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.STRICT_100 },
    { skip: !open || !(showStorageTab || inventoryOnly) }
  );

  const { data: sections = [], isLoading: sectionsLoading } = useGetFactorySectionsQuery(
    {
      skip: 0,
      limit: API_LIMITS.STRICT_100,
      factory_id: storageFactoryFilter,
    },
    { skip: !open || !showSectionPicker || storageFactoryFilter == null }
  );

  const { data: apiMachines = [], isLoading: machinesLoading } = useGetMachinesQuery(
    {
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
      factory_section_id: resolvedSectionId,
    },
    { skip: !open || !showMachineTab || !inventoryOnly || resolvedSectionId == null }
  );

  const machineOptions = useMemo((): ItemSelectorMachineOption[] => {
    if (inventoryOnly) {
      return apiMachines
        .filter((m) => m.is_active && !m.is_deleted)
        .map((m) => ({
          id: m.id,
          name: m.name,
          factory_section_id: m.factory_section_id,
        }));
    }
    return machines.filter(
      (m) => !resolvedSectionId || m.factory_section_id === resolvedSectionId,
    );
  }, [inventoryOnly, apiMachines, machines, resolvedSectionId]);

  const machineLabels = useMemo(
    () => Object.fromEntries(machineOptions.map((m) => [m.id, m.name])),
    [machineOptions],
  );

  const factoryLabels = useMemo(
    () => Object.fromEntries(factories.map((f) => [f.id, f.name])),
    [factories]
  );

  const {
    data: catalogPage = [],
    isLoading: loadingCatalog,
    isFetching: fetchingCatalog,
    error: catalogError,
  } = useGetItemsQuery(
    { skip: catalogSkip, limit: CATALOG_PAGE_SIZE, search: debouncedSearch || undefined },
    { skip: !open || !showCatalogTab }
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setCatalogSkip(0);
    setAccumulatedCatalogItems([]);
    setCatalogHasMore(false);
  }, [open, debouncedSearch]);

  useEffect(() => {
    if (!open) return;
    setAccumulatedCatalogItems((prev) => mergeCatalogPages(prev, catalogPage, catalogSkip === 0));
    setCatalogHasMore(catalogPage.length === CATALOG_PAGE_SIZE);
  }, [catalogPage, catalogSkip, open]);

  const loadingCatalogInitial =
    catalogSkip === 0 && accumulatedCatalogItems.length === 0 && (loadingCatalog || fetchingCatalog);
  const loadingCatalogMore = catalogSkip > 0 && fetchingCatalog;

  const { data: inventoryRows = [], isLoading: loadingInventory } = useGetInventoryListQuery(
    {
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
      factory_id: storageFactoryFilter,
      inventory_type: inventoryTypeFilter === 'all' ? undefined : inventoryTypeFilter,
    },
    { skip: !open || !showStorageTab || (inventoryOnly && storageFactoryFilter == null) }
  );

  const { data: machineItemRows = [], isLoading: loadingMachineItems } = useGetMachineItemsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000, machine_id: resolvedMachineId },
    { skip: !open || !showMachineTab || !resolvedMachineId }
  );

  const filteredMachineItemRows = useMemo(() => {
    const q = (inventoryOnly ? itemSearch : search).trim().toLowerCase();
    return machineItemRows
      .filter((row) => !inStockOnly || (row.qty ?? 0) > 0)
      .filter((row) => {
        if (!q) return true;
        return (
          (row.item_name ?? '').toLowerCase().includes(q) ||
          (row.item_unit ?? '').toLowerCase().includes(q)
        );
      });
  }, [machineItemRows, itemSearch, search, inventoryOnly, inStockOnly]);

  const filteredMachinesForGrid = useMemo(() => {
    if (!inventoryOnly) return [];
    return filterAndSortMachines(activeMachines(apiMachines), machineSearch);
  }, [inventoryOnly, apiMachines, machineSearch]);

  const selectedMachine = useMemo((): Machine | null => {
    if (!resolvedMachineId) return null;
    if (inventoryOnly) {
      return apiMachines.find((m) => m.id === resolvedMachineId) ?? null;
    }
    const option = machineOptions.find((m) => m.id === resolvedMachineId);
    return option ? ({ id: option.id, name: option.name } as Machine) : null;
  }, [resolvedMachineId, inventoryOnly, apiMachines, machineOptions]);

  const filteredCatalogItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = accumulatedCatalogItems.filter((i) => i.is_active !== false);
    if (!q) return active;
    return active.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.sku ?? '').toLowerCase().includes(q) ||
        (i.unit ?? '').toLowerCase().includes(q)
    );
  }, [accumulatedCatalogItems, search]);

  const filteredInventoryRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryRows
      .filter((row) => row.is_active && !row.is_deleted)
      .filter((row) => !inStockOnly || (row.qty ?? 0) > 0)
      .filter((row) => {
        if (!q) return true;
        return (
          (row.item_name ?? '').toLowerCase().includes(q) ||
          (row.item_unit ?? '').toLowerCase().includes(q)
        );
      });
  }, [inventoryRows, search, inStockOnly]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setMachineSearch('');
      setItemSearch('');
      setDebouncedSearch('');
      setCatalogSkip(0);
      setAccumulatedCatalogItems([]);
      setCatalogHasMore(false);
      setHighlighted(null);
      setFactoryPickerId('');
      setSectionPickerId('');
      setMachinePickerId('');
      setInventoryTypeFilter('all');
      setTab(resolveInitialTab(catalogOnly, inventoryOnly, includeMachineStock, initialTab));
      return;
    }
    setTab(resolveInitialTab(catalogOnly, inventoryOnly, includeMachineStock, initialTab));
    setSearch('');
    setMachineSearch('');
    setItemSearch('');
    setHighlighted(null);
    const seedFactoryId = inventoryOnly
      ? (defaultFactoryId ?? factoryIdProp)
      : factoryIdProp;
    if (seedFactoryId != null) {
      setFactoryPickerId(String(seedFactoryId));
    } else {
      setFactoryPickerId('');
    }
    if (defaultSectionId != null) {
      setSectionPickerId(String(defaultSectionId));
    } else {
      setSectionPickerId('');
    }
    if (defaultMachineId != null) {
      setMachinePickerId(String(defaultMachineId));
    } else if (!inventoryOnly && machines.length === 1) {
      setMachinePickerId(String(machines[0].id));
    } else {
      setMachinePickerId('');
    }
    // Seed defaults only when dialog opens — not when parent re-renders while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || selectedItemId == null || !showCatalogTab) return;
    const catalogMatch = accumulatedCatalogItems.find((i) => i.id === selectedItemId);
    if (catalogMatch) {
      setHighlighted({ kind: 'catalog', item: catalogMatch });
    }
  }, [open, selectedItemId, accumulatedCatalogItems, showCatalogTab]);

  useEffect(() => {
    if (!highlighted) return;
    if (highlighted.kind === 'catalog') {
      const stillVisible = filteredCatalogItems.some((i) => i.id === highlighted.item.id);
      if (!stillVisible) setHighlighted(null);
    } else if (highlighted.kind === 'storage') {
      const stillVisible = filteredInventoryRows.some((r) => r.id === highlighted.row.id);
      if (!stillVisible) setHighlighted(null);
    } else {
      const stillVisible = filteredMachineItemRows.some((r) => r.id === highlighted.row.id);
      if (!stillVisible) setHighlighted(null);
    }
  }, [highlighted, filteredCatalogItems, filteredInventoryRows, filteredMachineItemRows]);

  useEffect(() => {
    if (highlighted?.kind !== 'machine') return;
    if (highlighted.row.machine_id !== resolvedMachineId) {
      setHighlighted(null);
    }
  }, [resolvedMachineId, highlighted]);

  const confirmSelection = () => {
    if (!highlighted) return;
    if (highlighted.kind === 'catalog') {
      const item = highlighted.item;
      onSelect({
        itemId: item.id,
        itemName: item.name,
        itemUnit: item.unit,
        selectionSource: 'catalog',
      });
    } else if (highlighted.kind === 'storage') {
      const row = highlighted.row;
      onSelect({
        itemId: row.item_id,
        itemName: row.item_name ?? `Item #${row.item_id}`,
        itemUnit: row.item_unit,
        selectionSource: 'storage',
        availableQty: row.qty,
        inventoryType: row.inventory_type,
        factoryId: row.factory_id,
      });
    } else {
      const row = highlighted.row;
      onSelect({
        itemId: row.item_id,
        itemName: row.item_name ?? `Item #${row.item_id}`,
        itemUnit: row.item_unit,
        selectionSource: 'machine',
        availableQty: row.qty,
        machineId: row.machine_id,
      });
    }
    onOpenChange(false);
  };

  const handleCreateItemSuccess = (item: Item) => {
    setAccumulatedCatalogItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [item, ...prev];
    });
    setHighlighted({ kind: 'catalog', item });
    setTab('catalog');
    setIsAddItemOpen(false);
  };

  const handleLoadMoreCatalog = () => {
    if (!catalogHasMore || fetchingCatalog) return;
    setCatalogSkip(accumulatedCatalogItems.length);
  };

  const footerSummary = useMemo(() => {
    if (!highlighted) return null;
    if (highlighted.kind === 'catalog') {
      return formatItemLabel(highlighted.item.name, highlighted.item.unit);
    }
    if (highlighted.kind === 'machine') {
      const row = highlighted.row;
      const machineSuffix = selectedMachine ? ` · ${selectedMachine.name}` : '';
      return formatItemLabel(
        row.item_name ?? `Item #${row.item_id}`,
        row.item_unit,
        `· ${row.qty} on hand · Machine stock${machineSuffix}`,
      );
    }
    const row = highlighted.row;
    const factorySuffix = showAllFactoriesStorage
      ? ` · ${factoryLabels[row.factory_id] ?? `Factory #${row.factory_id}`}`
      : '';
    return formatItemLabel(
      row.item_name ?? `Item #${row.item_id}`,
      row.item_unit,
      `· ${row.qty} on hand · ${INVENTORY_TYPE_LABEL[row.inventory_type]}${factorySuffix}`
    );
  }, [highlighted, showAllFactoriesStorage, factoryLabels, selectedMachine]);

  const handleTabChange = (value: string) => {
    setTab(value as TabValue);
    setSearch('');
    setMachineSearch('');
    setItemSearch('');
    setHighlighted(null);
  };

  const handleFactoryPickerChange = (value: string) => {
    setFactoryPickerId(value);
    setSectionPickerId('');
    setMachinePickerId('');
    setItemSearch('');
    setHighlighted(null);
  };

  const handleSectionPickerChange = (value: string) => {
    setSectionPickerId(value);
    setMachinePickerId('');
    setItemSearch('');
    setHighlighted(null);
  };

  const handleMachinePick = (machineId: number) => {
    setMachinePickerId(String(machineId));
    setItemSearch('');
    setHighlighted(null);
  };

  const renderScopedLocationPickers = (options?: {
    showSection?: boolean;
    sectionOptional?: boolean;
  }) => {
    const showSection = options?.showSection !== false;
    return (
    <div className={cn('grid gap-2', showSection && 'sm:grid-cols-2')}>
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Factory</Label>
        <Select
          value={factoryPickerId || undefined}
          onValueChange={handleFactoryPickerChange}
        >
          <SelectTrigger className="h-9 bg-background">
            <SelectValue placeholder="Select factory..." />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            {factories.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showSection ? (
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">
          Section{options?.sectionOptional ? ' (optional)' : ''}
        </Label>
        <Select
          value={sectionPickerId || undefined}
          onValueChange={handleSectionPickerChange}
          disabled={storageFactoryFilter == null || sectionsLoading}
        >
          <SelectTrigger className="h-9 bg-background">
            <SelectValue
              placeholder={
                storageFactoryFilter == null
                  ? 'Select factory first'
                  : sectionsLoading
                    ? 'Loading sections...'
                    : 'Select section...'
              }
            />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            {sections.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      ) : null}
    </div>
    );
  };

  const renderCatalogList = () => (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 flex gap-2 p-0.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="h-9 pl-9"
            autoComplete="off"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0"
          onClick={() => setIsAddItemOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create
        </Button>
      </div>
      <div className="flex shrink-0 items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {filteredCatalogItems.length} shown
          {catalogHasMore ? ' · more in catalog' : ''}
        </span>
        {fetchingCatalog && !loadingCatalogInitial ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating…
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
        {loadingCatalogInitial ? (
          <div className="flex min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading catalog...
          </div>
        ) : catalogError ? (
          <p className="py-8 text-center text-sm text-destructive">
            Failed to load catalog. Try again or use Storage tab.
          </p>
        ) : filteredCatalogItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items found{search.trim() ? ' for your search' : ''}.
          </p>
        ) : (
          <div className="space-y-1.5">
            {filteredCatalogItems.map((item) => {
              const isHighlighted =
                highlighted?.kind === 'catalog' && highlighted.item.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHighlighted({ kind: 'catalog', item })}
                  className={cn(
                    'w-full rounded-md border p-2 text-left transition-colors',
                    isHighlighted
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-transparent bg-card hover:border-border hover:bg-muted/30'
                  )}
                >
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.unit}
                    {item.sku ? ` · SKU ${item.sku}` : ''}
                  </p>
                </button>
              );
            })}
            {catalogHasMore ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full bg-background"
                disabled={loadingCatalogMore}
                onClick={handleLoadMoreCatalog}
              >
                {loadingCatalogMore ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Loading more…
                  </>
                ) : (
                  'Load more items'
                )}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  const renderStorageList = () => (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 space-y-2 p-0.5">
        {inventoryOnly ? renderScopedLocationPickers({ showSection: false }) : null}
        {showFactoryPicker && !showSectionPicker ? (
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Factory</Label>
            <Select
              value={factoryPickerId || 'all'}
              onValueChange={(v) => setFactoryPickerId(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All factories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All factories{factories.length > 0 ? ` (${factories.length})` : ''}
                </SelectItem>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/10">
        <div className="shrink-0 space-y-2 border-b border-border/60 p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {INVENTORY_TYPE_OPTIONS.map((opt) => {
              const selected = inventoryTypeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInventoryTypeFilter(opt.value)}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium border transition-colors',
                    selected
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-border bg-muted/40 text-foreground hover:bg-muted',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory..."
              className="h-9 bg-background pl-9"
              autoComplete="off"
              disabled={inventoryOnly && storageFactoryFilter == null}
            />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {inventoryOnly && storageFactoryFilter == null
              ? 'Select factory to see storage stock'
              : `${filteredInventoryRows.length} shown${showAllFactoriesStorage ? ' · all factories' : ''}`}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {inventoryOnly && storageFactoryFilter == null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Select a factory first.</p>
          ) : loadingInventory ? (
            <div className="flex min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading inventory...
            </div>
          ) : filteredInventoryRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inventory on hand{search.trim() ? ' matching your search' : ''}.
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredInventoryRows.map((row) => {
                const isHighlighted =
                  highlighted?.kind === 'storage' && highlighted.row.id === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setHighlighted({ kind: 'storage', row })}
                    className={cn(
                      'w-full rounded-md border p-2 text-left transition-colors',
                      isHighlighted
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-transparent bg-card hover:border-border hover:bg-muted/30',
                    )}
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.item_name ?? `Item #${row.item_id}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.item_unit ?? '—'} · {row.qty} on hand · {INVENTORY_TYPE_LABEL[row.inventory_type]}
                      {showAllFactoriesStorage
                        ? ` · ${factoryLabels[row.factory_id] ?? `Factory #${row.factory_id}`}`
                        : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMachineList = () => {
    if (inventoryOnly) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0 space-y-2 p-0.5">
            {showSectionPicker ? renderScopedLocationPickers() : null}
            {resolvedSectionId == null ? (
              <div className="flex min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-2 text-center text-sm text-muted-foreground">
                Select a factory and section to load machines.
              </div>
            ) : machinesLoading ? (
              <div className="flex min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading machines...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={machineSearch}
                      onChange={(e) => setMachineSearch(e.target.value)}
                      placeholder="Search machines..."
                      className="h-9 pl-9"
                      autoComplete="off"
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {filteredMachinesForGrid.length} machines
                  </span>
                </div>
                <div className="max-h-[min(200px,24dvh)] overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
                  {filteredMachinesForGrid.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No machines in this section{machineSearch.trim() ? ' matching your search' : ''}.
                    </p>
                  ) : (
                    <div
                      className="grid grid-cols-2 gap-1.5"
                      role="listbox"
                      aria-label="Machines in section"
                    >
                      {filteredMachinesForGrid.map((m) => (
                        <MachineSelectorTile
                          key={m.id}
                          machine={m}
                          isHighlighted={resolvedMachineId === m.id}
                          onPick={() => handleMachinePick(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {!resolvedMachineId ? (
              <div className="flex min-h-[7rem] flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-2 text-center text-sm text-muted-foreground">
                Pick a machine above to see stock.
              </div>
            ) : (
              <>
                <div className="shrink-0 space-y-2 p-0.5">
                  {selectedMachine ? (
                    <p className="text-xs text-muted-foreground">
                      Stock on{' '}
                      <MachineSelectorFooterStatus machine={selectedMachine} />
                    </p>
                  ) : null}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search items on this machine..."
                      className="h-9 pl-9"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {loadingMachineItems
                      ? 'Loading stock...'
                      : `${filteredMachineItemRows.length} shown`}
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
                  {loadingMachineItems ? (
                    <div className="flex min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading machine stock...
                    </div>
                  ) : filteredMachineItemRows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No stock on this machine{itemSearch.trim() ? ' matching your search' : ''}.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredMachineItemRows.map((row) => {
                        const isHighlighted =
                          highlighted?.kind === 'machine' && highlighted.row.id === row.id;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setHighlighted({ kind: 'machine', row })}
                            className={cn(
                              'w-full rounded-md border p-2 text-left transition-colors',
                              isHighlighted
                                ? 'border-brand-primary bg-brand-primary/10'
                                : 'border-transparent bg-card hover:border-border hover:bg-muted/30',
                            )}
                          >
                            <p className="truncate text-sm font-medium text-foreground">
                              {row.item_name ?? `Item #${row.item_id}`}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.item_unit ?? '—'} · {row.qty} on hand
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="shrink-0 space-y-2 p-0.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search machine stock..."
              className="h-9 pl-9"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Machine</Label>
            <Select value={machinePickerId || undefined} onValueChange={setMachinePickerId}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Select machine..." />
              </SelectTrigger>
              <SelectContent className="z-[2000]">
                {machineOptions.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {resolvedMachineId
              ? `${filteredMachineItemRows.length} shown`
              : 'Pick a machine to see stock'}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
          {!resolvedMachineId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Select a machine first.</p>
          ) : loadingMachineItems ? (
            <div className="flex min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading machine stock...
            </div>
          ) : filteredMachineItemRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No stock on this machine{search.trim() ? ' matching your search' : ''}.
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredMachineItemRows.map((row) => {
                const isHighlighted =
                  highlighted?.kind === 'machine' && highlighted.row.id === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setHighlighted({ kind: 'machine', row })}
                    className={cn(
                      'w-full rounded-md border p-2 text-left transition-colors',
                      isHighlighted
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-transparent bg-card hover:border-border hover:bg-muted/30',
                    )}
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.item_name ?? `Item #${row.item_id}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.item_unit ?? '—'} · {row.qty} on hand
                      {machineLabels[row.machine_id]
                        ? ` · ${machineLabels[row.machine_id]}`
                        : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivePanel = () => {
    if (tab === 'catalog') return renderCatalogList();
    if (tab === 'machine') return renderMachineList();
    return renderStorageList();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[78vh] max-h-[78vh] w-[min(40rem,94vw)] max-w-none flex-col p-5 sm:max-w-none sm:p-6"
          onPointerDownOutside={(event) => {
            if (isRadixSelectPortalTarget(event.target)) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (isRadixSelectPortalTarget(event.target)) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="shrink-0 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            {useTabSwitcher ? (
              <EmphasisTabsProvider value={tab}>
                <Tabs value={tab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
                  <EmphasisTabsList className="mb-3 shrink-0">
                    {showCatalogTab ? (
                      <EmphasisTabsTrigger value="catalog">Catalog</EmphasisTabsTrigger>
                    ) : null}
                    {showStorageTab ? (
                      <EmphasisTabsTrigger value="storage">Storage</EmphasisTabsTrigger>
                    ) : null}
                    {showMachineTab ? (
                      <EmphasisTabsTrigger value="machine">Machine stock</EmphasisTabsTrigger>
                    ) : null}
                  </EmphasisTabsList>
                  <EmphasisTabPanel panelKey={tab} className="flex min-h-0 flex-1 flex-col">
                    {renderActivePanel()}
                  </EmphasisTabPanel>
                </Tabs>
              </EmphasisTabsProvider>
            ) : showStorageTab ? (
              renderStorageList()
            ) : (
              renderCatalogList()
            )}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {footerSummary ? (
                <>
                  Selected: <span className="font-medium text-foreground">{footerSummary}</span>
                </>
              ) : (
                <>Click a row to highlight it, then confirm below.</>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={!highlighted}
                onClick={confirmSelection}
              >
                Select item
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        onSuccess={handleCreateItemSuccess}
      />
    </>
  );
};

export default ItemSelectorDialog;
