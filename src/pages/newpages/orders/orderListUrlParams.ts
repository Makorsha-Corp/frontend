import { format, isValid, parseISO } from 'date-fns';
import type { Status } from '@/types/status';
import { PO_SCOPE_OPEN_STATUS_NAMES } from '@/components/newcomponents/customui/orders/purchaseOrderMilestones';
import type { DestinationTypeFilter, InvoiceFilter } from './purchaseOrdersOverviewData';
import type { TransferLocationTypeFilter } from './transferOrdersOverviewData';

export type OrderListPageKind = 'purchase' | 'transfer' | 'expense';

export interface ParsedDateRange {
  from?: Date;
  to?: Date;
}

export interface PurchaseOrderUrlFilters {
  dateRange: ParsedDateRange;
  statusFilters: string[];
  accountFilter: string;
  factoryFilter: string;
  destinationFilter: DestinationTypeFilter;
  invoiceFilter: InvoiceFilter;
  searchQuery: string;
  showCompleteOrders: boolean;
}

export interface TransferOrderUrlFilters {
  dateRange: ParsedDateRange;
  statusFilters: string[];
  factoryFilter: string;
  sourceTypeFilter: TransferLocationTypeFilter;
  destinationTypeFilter: TransferLocationTypeFilter;
  searchQuery: string;
  showCompleteOrders: boolean;
}

export interface ExpenseOrderUrlFilters {
  dateRange: ParsedDateRange;
  statusFilters: string[];
  accountFilter: string;
  categoryFilter: string;
  invoiceFilter: InvoiceFilter;
  searchQuery: string;
  showCompleteOrders: boolean;
}

const FILTER_PARAM_KEYS = [
  'scope',
  'from',
  'to',
  'status',
  'search',
  'showComplete',
  'supplier',
  'factory',
  'destination',
  'invoice',
  'source',
  'dest',
  'category',
] as const;

export function parseIsoDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

export function formatIsoDateParam(date: Date | undefined): string | undefined {
  if (!date || !isValid(date)) return undefined;
  return format(date, 'yyyy-MM-dd');
}

export function readShowComplete(params: URLSearchParams): boolean {
  return params.get('showComplete') === '1';
}

export function readSearch(params: URLSearchParams): string {
  return params.get('search') ?? '';
}

export function readDateRange(params: URLSearchParams): ParsedDateRange {
  return {
    from: parseIsoDateParam(params.get('from')),
    to: parseIsoDateParam(params.get('to')),
  };
}

export function resolveStatusIdsFromNames(
  names: readonly string[],
  allowedStatuses: Status[]
): string[] {
  const byName = new Map(allowedStatuses.map((s) => [s.name, s]));
  const ids: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const match = byName.get(trimmed);
    if (match) ids.push(String(match.id));
  }
  return ids;
}

export function readStatusFiltersFromParams(
  params: URLSearchParams,
  allowedStatuses: Status[]
): string[] {
  const raw = params.get('status');
  if (!raw) return [];
  const names = raw.split(',').map((part) => part.trim()).filter(Boolean);
  return resolveStatusIdsFromNames(names, allowedStatuses);
}

export function statusNamesFromIds(
  statusIds: string[],
  allowedStatuses: Status[]
): string[] {
  const ids = new Set(statusIds);
  return allowedStatuses.filter((s) => ids.has(String(s.id))).map((s) => s.name);
}

function readNumericFilterParam(value: string | null): string {
  if (!value) return 'all';
  const id = Number(value);
  return Number.isFinite(id) ? String(id) : 'all';
}

function setOrDelete(next: URLSearchParams, key: string, value: string | undefined) {
  if (!value) next.delete(key);
  else next.set(key, value);
}

function writeStatusFilters(
  next: URLSearchParams,
  statusFilters: string[],
  allowedStatuses: Status[]
) {
  if (statusFilters.length === 0) {
    next.delete('status');
    return;
  }
  const names = statusNamesFromIds(statusFilters, allowedStatuses);
  if (names.length === 0) next.delete('status');
  else next.set('status', names.join(','));
}

function writeSharedFilters(
  next: URLSearchParams,
  filters: {
    dateRange: ParsedDateRange;
    statusFilters: string[];
    searchQuery: string;
    showCompleteOrders: boolean;
  },
  allowedStatuses: Status[]
) {
  next.delete('scope');
  setOrDelete(next, 'from', formatIsoDateParam(filters.dateRange.from));
  setOrDelete(next, 'to', formatIsoDateParam(filters.dateRange.to));
  writeStatusFilters(next, filters.statusFilters, allowedStatuses);
  setOrDelete(next, 'search', filters.searchQuery.trim() || undefined);
  if (filters.showCompleteOrders) next.set('showComplete', '1');
  else next.delete('showComplete');
}

function isScopeOpenOnly(params: URLSearchParams): boolean {
  if (params.get('scope') !== 'open') return false;
  return !FILTER_PARAM_KEYS.some((key) => {
    if (key === 'scope') return false;
    const v = params.get(key);
    if (key === 'showComplete') return v === '1';
    return v != null && v !== '';
  });
}

function poScopeOpenStatusIds(allowedStatuses: Status[]): string[] {
  return resolveStatusIdsFromNames(PO_SCOPE_OPEN_STATUS_NAMES, allowedStatuses);
}

export function hasActiveListFilters(
  params: URLSearchParams,
  pageKind: OrderListPageKind
): boolean {
  if (params.get('from') || params.get('to')) return true;
  if (params.get('status')) return true;
  if (params.get('search')?.trim()) return true;
  if (params.get('showComplete') === '1') return true;
  if (pageKind === 'purchase' && params.get('scope') === 'open') return true;

  if (pageKind === 'purchase') {
    if (params.get('supplier') || params.get('factory') || params.get('destination')) return true;
    if (params.get('invoice') && params.get('invoice') !== 'all') return true;
  }
  if (pageKind === 'transfer') {
    if (params.get('factory')) return true;
    if (params.get('source') && params.get('source') !== 'all') return true;
    if (params.get('dest') && params.get('dest') !== 'all') return true;
    if (params.get('scope') === 'open') return true;
  }
  if (pageKind === 'expense') {
    if (params.get('supplier')) return true;
    if (params.get('category')) return true;
    if (params.get('invoice') && params.get('invoice') !== 'all') return true;
    if (params.get('scope') === 'open') return true;
  }
  return false;
}

const defaultPurchaseFilters = (): PurchaseOrderUrlFilters => ({
  dateRange: {},
  statusFilters: [],
  accountFilter: 'all',
  factoryFilter: 'all',
  destinationFilter: 'all',
  invoiceFilter: 'all',
  searchQuery: '',
  showCompleteOrders: false,
});

const defaultTransferFilters = (): TransferOrderUrlFilters => ({
  dateRange: {},
  statusFilters: [],
  factoryFilter: 'all',
  sourceTypeFilter: 'all',
  destinationTypeFilter: 'all',
  searchQuery: '',
  showCompleteOrders: false,
});

const defaultExpenseFilters = (): ExpenseOrderUrlFilters => ({
  dateRange: {},
  statusFilters: [],
  accountFilter: 'all',
  categoryFilter: 'all',
  invoiceFilter: 'all',
  searchQuery: '',
  showCompleteOrders: false,
});

function readDestinationFilter(value: string | null): DestinationTypeFilter {
  if (value === 'storage' || value === 'machine' || value === 'project') return value;
  return 'all';
}

function readInvoiceFilter(value: string | null): InvoiceFilter {
  if (value === 'invoiced' || value === 'not_invoiced') return value;
  return 'all';
}

function readTransferLocationFilter(value: string | null): TransferLocationTypeFilter {
  if (
    value === 'storage' ||
    value === 'machine' ||
    value === 'project' ||
    value === 'damaged'
  ) {
    return value;
  }
  return 'all';
}

export function parsePurchaseOrderParams(
  params: URLSearchParams,
  allowedStatuses: Status[]
): PurchaseOrderUrlFilters {
  if (isScopeOpenOnly(params)) {
    return {
      ...defaultPurchaseFilters(),
      statusFilters: poScopeOpenStatusIds(allowedStatuses),
    };
  }

  return {
    dateRange: readDateRange(params),
    statusFilters: readStatusFiltersFromParams(params, allowedStatuses),
    accountFilter: readNumericFilterParam(params.get('supplier')),
    factoryFilter: readNumericFilterParam(params.get('factory')),
    destinationFilter: readDestinationFilter(params.get('destination')),
    invoiceFilter: readInvoiceFilter(params.get('invoice')),
    searchQuery: readSearch(params),
    showCompleteOrders: readShowComplete(params),
  };
}

export function writePurchaseOrderParams(
  prev: URLSearchParams,
  filters: PurchaseOrderUrlFilters,
  allowedStatuses: Status[]
): URLSearchParams {
  const next = new URLSearchParams(prev);
  writeSharedFilters(next, filters, allowedStatuses);
  setOrDelete(
    next,
    'supplier',
    filters.accountFilter === 'all' ? undefined : filters.accountFilter
  );
  setOrDelete(next, 'factory', filters.factoryFilter === 'all' ? undefined : filters.factoryFilter);
  setOrDelete(
    next,
    'destination',
    filters.destinationFilter === 'all' ? undefined : filters.destinationFilter
  );
  setOrDelete(
    next,
    'invoice',
    filters.invoiceFilter === 'all' ? undefined : filters.invoiceFilter
  );
  return next;
}

export function parseTransferOrderParams(
  params: URLSearchParams,
  allowedStatuses: Status[]
): TransferOrderUrlFilters {
  if (isScopeOpenOnly(params)) {
    return defaultTransferFilters();
  }

  return {
    dateRange: readDateRange(params),
    statusFilters: readStatusFiltersFromParams(params, allowedStatuses),
    factoryFilter: readNumericFilterParam(params.get('factory')),
    sourceTypeFilter: readTransferLocationFilter(params.get('source')),
    destinationTypeFilter: readTransferLocationFilter(params.get('dest')),
    searchQuery: readSearch(params),
    showCompleteOrders: readShowComplete(params),
  };
}

export function writeTransferOrderParams(
  prev: URLSearchParams,
  filters: TransferOrderUrlFilters,
  allowedStatuses: Status[]
): URLSearchParams {
  const next = new URLSearchParams(prev);
  writeSharedFilters(next, filters, allowedStatuses);
  setOrDelete(next, 'factory', filters.factoryFilter === 'all' ? undefined : filters.factoryFilter);
  setOrDelete(
    next,
    'source',
    filters.sourceTypeFilter === 'all' ? undefined : filters.sourceTypeFilter
  );
  setOrDelete(
    next,
    'dest',
    filters.destinationTypeFilter === 'all' ? undefined : filters.destinationTypeFilter
  );
  return next;
}

export function parseExpenseOrderParams(
  params: URLSearchParams,
  allowedStatuses: Status[]
): ExpenseOrderUrlFilters {
  if (isScopeOpenOnly(params)) {
    return defaultExpenseFilters();
  }

  return {
    dateRange: readDateRange(params),
    statusFilters: readStatusFiltersFromParams(params, allowedStatuses),
    accountFilter: readNumericFilterParam(params.get('supplier')),
    categoryFilter: params.get('category') ?? 'all',
    invoiceFilter: readInvoiceFilter(params.get('invoice')),
    searchQuery: readSearch(params),
    showCompleteOrders: readShowComplete(params),
  };
}

export function writeExpenseOrderParams(
  prev: URLSearchParams,
  filters: ExpenseOrderUrlFilters,
  allowedStatuses: Status[]
): URLSearchParams {
  const next = new URLSearchParams(prev);
  writeSharedFilters(next, filters, allowedStatuses);
  setOrDelete(
    next,
    'supplier',
    filters.accountFilter === 'all' ? undefined : filters.accountFilter
  );
  setOrDelete(
    next,
    'category',
    filters.categoryFilter === 'all' ? undefined : filters.categoryFilter
  );
  setOrDelete(
    next,
    'invoice',
    filters.invoiceFilter === 'all' ? undefined : filters.invoiceFilter
  );
  return next;
}

export function clearPurchaseOrderFilterParams(prev: URLSearchParams): URLSearchParams {
  return writePurchaseOrderParams(prev, defaultPurchaseFilters(), []);
}

export function clearTransferOrderFilterParams(prev: URLSearchParams): URLSearchParams {
  return writeTransferOrderParams(prev, defaultTransferFilters(), []);
}

export function clearExpenseOrderFilterParams(prev: URLSearchParams): URLSearchParams {
  return writeExpenseOrderParams(prev, defaultExpenseFilters(), []);
}

/** Hub deep link for purchase orders with open work in flight. */
export function purchaseOrdersOpenHubSearch(): string {
  return `status=${PO_SCOPE_OPEN_STATUS_NAMES.join(',')}`;
}
