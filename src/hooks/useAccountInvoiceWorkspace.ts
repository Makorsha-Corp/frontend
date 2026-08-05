import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useGetAccountInvoicesPageQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoiceSummaryQuery } from '@/features/accounts/accountsApi';
import { useInvoiceOrderNumberMap } from '@/components/newcomponents/customui/accounts/useInvoiceOrderNumberMap';
import type { AccountInvoicesPageParams } from '@/types/accountInvoice';
import type { AccountInvoiceSummaryParams } from '@/types/account';

export type AccountInvoiceTypeFilter = 'all' | 'payable' | 'receivable';
export type AccountInvoiceStatusFilter =
  | 'all'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'voided';

export type AccountHubSection = 'overview' | 'payable' | 'receivable';

const INVOICE_NAV_PAGE_SIZE = 50;

function defaultTypeFromContext(context: string | null): AccountInvoiceTypeFilter {
  if (context === 'payable') return 'payable';
  if (context === 'receivable') return 'receivable';
  return 'all';
}

function buildFilterParams(
  accountId: number,
  filters: {
    invoiceTypeFilter: AccountInvoiceTypeFilter;
    invoiceStatusFilter: AccountInvoiceStatusFilter;
    debouncedSearch: string;
    invoiceDateFrom: string;
    invoiceDateTo: string;
    dueDateFrom: string;
    dueDateTo: string;
  }
): Omit<AccountInvoicesPageParams, 'skip' | 'limit'> {
  const params: Omit<AccountInvoicesPageParams, 'skip' | 'limit'> = {
    account_id: accountId,
  };
  if (filters.invoiceTypeFilter !== 'all') params.invoice_type = filters.invoiceTypeFilter;
  if (filters.invoiceStatusFilter === 'voided') {
    params.invoice_status = 'voided';
  } else if (filters.invoiceStatusFilter !== 'all') {
    params.payment_status = filters.invoiceStatusFilter;
  }
  const q = filters.debouncedSearch.trim();
  if (q) params.invoice_number_search = q;
  if (filters.invoiceDateFrom) params.invoice_date_from = filters.invoiceDateFrom;
  if (filters.invoiceDateTo) params.invoice_date_to = filters.invoiceDateTo;
  if (filters.dueDateFrom) params.due_date_from = filters.dueDateFrom;
  if (filters.dueDateTo) params.due_date_to = filters.dueDateTo;
  return params;
}

export function useAccountInvoiceWorkspace(accountId: number | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const hubContext = useMemo(() => {
    const fromState = (location.state as { fromSection?: AccountHubSection } | null)?.fromSection;
    if (fromState) return fromState;
    const fromQuery = searchParams.get('context');
    if (fromQuery) return fromQuery as AccountHubSection;
    return null;
  }, [location.state, searchParams]);

  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<AccountInvoiceTypeFilter>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<AccountInvoiceStatusFilter>('all');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoicePage, setInvoicePage] = useState(1);

  useEffect(() => {
    if (filtersInitialized || !accountId) return;
    const typeDefault = defaultTypeFromContext(hubContext);
    if (typeDefault !== 'all') setInvoiceTypeFilter(typeDefault);
    setFiltersInitialized(true);
  }, [accountId, hubContext, filtersInitialized]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(invoiceSearch), 300);
    return () => window.clearTimeout(timer);
  }, [invoiceSearch]);

  useEffect(() => {
    setInvoicePage(1);
  }, [
    accountId,
    invoiceTypeFilter,
    invoiceStatusFilter,
    debouncedSearch,
    invoiceDateFrom,
    invoiceDateTo,
    dueDateFrom,
    dueDateTo,
  ]);

  const filterFields = useMemo(
    () => ({
      invoiceTypeFilter,
      invoiceStatusFilter,
      debouncedSearch,
      invoiceDateFrom,
      invoiceDateTo,
      dueDateFrom,
      dueDateTo,
    }),
    [
      invoiceTypeFilter,
      invoiceStatusFilter,
      debouncedSearch,
      invoiceDateFrom,
      invoiceDateTo,
      dueDateFrom,
      dueDateTo,
    ]
  );

  const baseFilterParams = useMemo(
    () => (accountId ? buildFilterParams(accountId, filterFields) : null),
    [accountId, filterFields]
  );

  const invoicePageSkip = (invoicePage - 1) * INVOICE_NAV_PAGE_SIZE;

  const invoiceListParams = useMemo(
    (): AccountInvoicesPageParams | null =>
      baseFilterParams
        ? {
            ...baseFilterParams,
            skip: invoicePageSkip,
            limit: INVOICE_NAV_PAGE_SIZE,
          }
        : null,
    [baseFilterParams, invoicePageSkip]
  );

  const summaryParams = useMemo(
    (): AccountInvoiceSummaryParams | null =>
      accountId && baseFilterParams
        ? { ...baseFilterParams, account_id: accountId }
        : null,
    [accountId, baseFilterParams]
  );

  const {
    data: invoicesPage,
    isLoading: invoiceListLoading,
    isFetching: invoiceListFetching,
  } = useGetAccountInvoicesPageQuery(invoiceListParams!, { skip: !invoiceListParams });

  const invoices = useMemo(() => invoicesPage?.items ?? [], [invoicesPage]);
  const invoicesTotal = invoicesPage?.total ?? 0;

  const { data: summary, isLoading: summaryLoading } = useGetAccountInvoiceSummaryQuery(
    summaryParams!,
    { skip: !summaryParams }
  );

  const invoiceOrderNumberMap = useInvoiceOrderNumberMap(invoices);

  const urlInvoiceId = useMemo(() => {
    const param = searchParams.get('invoiceId');
    if (!param) return null;
    const parsed = parseInt(param, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const selectInvoice = useCallback(
    (invoiceId: number | null) => {
      setSelectedInvoiceId(invoiceId);
      const next = new URLSearchParams(searchParams);
      if (invoiceId != null) next.set('invoiceId', String(invoiceId));
      else next.delete('invoiceId');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (urlInvoiceId != null) {
      setSelectedInvoiceId(urlInvoiceId);
    }
  }, [urlInvoiceId]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(invoicesTotal / INVOICE_NAV_PAGE_SIZE));
    if (invoicePage > maxPage) {
      setInvoicePage(maxPage);
    }
  }, [invoicesTotal, invoicePage]);

  useEffect(() => {
    if (urlInvoiceId != null) return;
    if (!invoices.length) {
      if (selectedInvoiceId != null) setSelectedInvoiceId(null);
      return;
    }
    if (selectedInvoiceId == null || !invoices.some((inv) => inv.id === selectedInvoiceId)) {
      selectInvoice(invoices[0].id);
    }
  }, [invoices, selectedInvoiceId, urlInvoiceId, selectInvoice]);

  const selectedInvoiceFromList = useMemo(
    () =>
      selectedInvoiceId != null
        ? invoices.find((inv) => inv.id === selectedInvoiceId) ?? null
        : null,
    [invoices, selectedInvoiceId]
  );

  const invoiceCount = summary?.invoiceCount ?? invoicesTotal;

  const invoiceCountLabel = String(invoiceCount);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (invoiceTypeFilter !== 'all') count += 1;
    if (invoiceStatusFilter !== 'all') count += 1;
    if (debouncedSearch.trim()) count += 1;
    if (invoiceDateFrom || invoiceDateTo) count += 1;
    if (dueDateFrom || dueDateTo) count += 1;
    return count;
  }, [
    invoiceTypeFilter,
    invoiceStatusFilter,
    debouncedSearch,
    invoiceDateFrom,
    invoiceDateTo,
    dueDateFrom,
    dueDateTo,
  ]);

  const clearFilters = useCallback(() => {
    setInvoiceSearch('');
    setDebouncedSearch('');
    setInvoiceTypeFilter('all');
    setInvoiceStatusFilter('all');
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
    setDueDateFrom('');
    setDueDateTo('');
  }, []);

  const accountsHubPath = useMemo(() => {
    if (hubContext) return `/accounts/${hubContext}`;
    return '/accounts/payable';
  }, [hubContext]);

  const closeAccount = useCallback(() => {
    navigate(accountsHubPath);
  }, [navigate, accountsHubPath]);

  return {
    hubContext,
    accountsHubPath,
    closeAccount,
    invoiceSearch,
    setInvoiceSearch,
    invoiceTypeFilter,
    setInvoiceTypeFilter,
    invoiceStatusFilter,
    setInvoiceStatusFilter,
    invoiceDateFrom,
    setInvoiceDateFrom,
    invoiceDateTo,
    setInvoiceDateTo,
    dueDateFrom,
    setDueDateFrom,
    dueDateTo,
    setDueDateTo,
    filtersExpanded,
    setFiltersExpanded,
    activeFilterCount,
    clearFilters,
    invoices,
    invoiceListLoading,
    invoiceListFetching,
    invoicePage,
    setInvoicePage,
    invoicesTotal,
    invoicePageSize: INVOICE_NAV_PAGE_SIZE,
    summary,
    summaryLoading,
    invoiceOrderNumberMap,
    selectedInvoiceId,
    selectInvoice,
    selectedInvoiceFromList,
    invoiceCountLabel,
    workspaceReady: !invoiceListLoading && !summaryLoading,
  };
}
