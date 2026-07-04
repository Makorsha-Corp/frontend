import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetAccountInvoiceSummaryQuery } from '@/features/accounts/accountsApi';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
import { buildInvoiceOrderNumberMap } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';
import { API_LIMITS } from '@/constants/apiLimits';
import type { ListAccountInvoicesParams } from '@/types/accountInvoice';
import type { AccountInvoiceSummaryParams } from '@/types/account';

export type AccountInvoiceTypeFilter = 'all' | 'payable' | 'receivable';
export type AccountInvoiceStatusFilter =
  | 'all'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'voided';

export type AccountHubSection =
  | 'aggregated'
  | 'payable'
  | 'receivable'
  | 'utilities'
  | 'payroll';

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
): Omit<ListAccountInvoicesParams, 'skip' | 'limit'> {
  const params: Omit<ListAccountInvoicesParams, 'skip' | 'limit'> = {
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

  const invoiceListParams = useMemo(
    () =>
      baseFilterParams
        ? {
            ...baseFilterParams,
            skip: 0,
            limit: API_LIMITS.FLEXIBLE_1000,
          }
        : null,
    [baseFilterParams]
  );

  const summaryParams = useMemo(
    (): AccountInvoiceSummaryParams | null =>
      accountId && baseFilterParams
        ? { account_id: accountId, ...baseFilterParams }
        : null,
    [accountId, baseFilterParams]
  );

  const { data: invoices = [], isLoading: invoiceListLoading } = useGetAccountInvoicesQuery(
    invoiceListParams!,
    { skip: !invoiceListParams }
  );

  const { data: summary, isLoading: summaryLoading } = useGetAccountInvoiceSummaryQuery(
    summaryParams!,
    { skip: !summaryParams }
  );

  const linkedOrdersParams = useMemo(
    () => ({
      account_id: accountId!,
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    }),
    [accountId]
  );

  const { data: purchaseOrdersForInvoices = [] } = useGetPurchaseOrdersQuery(linkedOrdersParams, {
    skip: !accountId,
  });
  const { data: expenseOrdersForInvoices = [] } = useGetExpenseOrdersQuery(linkedOrdersParams, {
    skip: !accountId,
  });

  const invoiceOrderNumberMap = useMemo(
    () => buildInvoiceOrderNumberMap(purchaseOrdersForInvoices, expenseOrdersForInvoices, invoices),
    [purchaseOrdersForInvoices, expenseOrdersForInvoices, invoices]
  );

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

  const invoiceCountLabel = String(summary?.invoiceCount ?? 0);

  const invoiceListCapped =
    summary != null && summary.invoiceCount > invoices.length && invoices.length > 0;

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
    if (hubContext && hubContext !== 'aggregated') return `/accounts/${hubContext}`;
    return '/accounts';
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
    summary,
    summaryLoading,
    invoiceOrderNumberMap,
    selectedInvoiceId,
    selectInvoice,
    selectedInvoiceFromList,
    invoiceCountLabel,
    invoiceListCapped,
    workspaceReady: !invoiceListLoading && !summaryLoading,
  };
}
