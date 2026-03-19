import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetAccountsQuery, useDeleteAccountMutation } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import type { Account } from '@/types/account';
import {
  Users,
  Truck,
  Package,
  UserCheck,
  Zap,
  Wallet,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  PieChart,
} from 'lucide-react';
import AddAccountDialog from '@/components/newcomponents/customui/AddAccountDialog';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import toast, { Toaster } from 'react-hot-toast';

const SECTION_CONFIG = [
  { path: 'aggregated', label: 'Aggregated', icon: PieChart, tagCode: null as string | null },
  { path: 'suppliers', label: 'Suppliers', description: 'Distributors whose stores we get parts from', icon: Truck, tagCode: 'supplier' },
  { path: 'vendors', label: 'Vendors', description: 'Companies whose parts we buy', icon: Package, tagCode: 'vendor' },
  { path: 'customers', label: 'Customers', description: 'Clients we sell to', icon: UserCheck, tagCode: 'client' },
  { path: 'utilities', label: 'Utilities', description: 'Electricity, internet, services', icon: Zap, tagCode: 'utility' },
  { path: 'payroll', label: 'Payroll', description: 'Employee salary accounts', icon: Wallet, tagCode: 'payroll' },
] as const;

type SectionPath = (typeof SECTION_CONFIG)[number]['path'];

const AccountsLandingPage: React.FC<{ initialSection?: SectionPath }> = ({ initialSection }) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [selectedSection, setSelectedSection] = useState<SectionPath>(initialSection ?? 'aggregated');

  useEffect(() => {
    if (initialSection) setSelectedSection(initialSection);
  }, [initialSection]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const navigate = useNavigate();

  const activeConfig = SECTION_CONFIG.find((s) => s.path === selectedSection);
  const tagCode = activeConfig?.tagCode ?? undefined;
  const isAggregated = selectedSection === 'aggregated';

  const { data: accounts = [], isLoading, error } = useGetAccountsQuery(
    {
      skip: 0,
      limit: 100,
      search: searchQuery || undefined,
      tag_code: isAggregated ? undefined : tagCode,
    },
    { skip: false }
  );

  const { data: payableInvoices = [] } = useGetAccountInvoicesQuery(
    { skip: 0, limit: 500, invoice_type: 'payable' },
    { skip: false }
  );
  const { data: receivableInvoices = [] } = useGetAccountInvoicesQuery(
    { skip: 0, limit: 500, invoice_type: 'receivable' },
    { skip: false }
  );

  const overview = useMemo(() => {
    const unpaidStatuses = ['unpaid', 'partial', 'overdue'];
    const payableOutstanding = payableInvoices
      .filter((inv) => unpaidStatuses.includes(inv.payment_status))
      .reduce((sum, inv) => sum + (inv.outstanding_amount ?? inv.invoice_amount - inv.paid_amount), 0);
    const receivableOutstanding = receivableInvoices
      .filter((inv) => unpaidStatuses.includes(inv.payment_status))
      .reduce((sum, inv) => sum + (inv.outstanding_amount ?? inv.invoice_amount - inv.paid_amount), 0);
    const overdueCount = [...payableInvoices, ...receivableInvoices].filter(
      (inv) => inv.payment_status === 'overdue'
    ).length;
    const aggregateNet = receivableOutstanding - payableOutstanding;
    return {
      payableOutstanding,
      receivableOutstanding,
      overdueCount,
      aggregateNet,
    };
  }, [payableInvoices, receivableInvoices]);

  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleSectionSelect = (path: SectionPath) => {
    setSelectedSection(path);
    navigate(`/accounts/${path}`, { replace: true });
  };

  const handleEdit = (account: Account) => setEditingAccount(account);
  const handleView = (account: Account) => navigate(`/accounts/${account.id}`);
  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Deactivate "${account.name}"? This is a soft delete.`)) return;
    try {
      await deleteAccount(account.id).unwrap();
      toast.success(`Account "${account.name}" has been deactivated`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate account');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

  const singularLabel = isAggregated ? 'account' : (activeConfig?.label?.slice(0, -1) ?? 'Account');

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Accounts</h1>
            </div>
          </div>
        </div>

        <div className="p-8 bg-background space-y-6">
          {/* Type selector */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto">
            {SECTION_CONFIG.map(({ path, label, icon: Icon }) => {
              const isSelected = selectedSection === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => handleSectionSelect(path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shrink-0 ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20'
                      : 'border-border hover:border-brand-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-brand-primary' : 'text-card-foreground'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Overview section */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              {isAggregated ? 'Aggregate totals' : 'Financial overview'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAggregated ? (
                <>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Accounts Payable</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(overview.payableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Money you owe</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Accounts Receivable</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(overview.receivableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Money owed to you</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                        <PieChart className="h-6 w-6 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Aggregate (Net)</p>
                        <p className={`text-xl font-semibold ${overview.aggregateNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {formatCurrency(overview.aggregateNet)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {overview.aggregateNet >= 0 ? 'Net receivable' : 'Net payable'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accounts Payable</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(overview.payableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Money you owe</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accounts Receivable</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(overview.receivableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Money owed to you</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                        <p className="text-xl font-semibold text-card-foreground">{overview.overdueCount}</p>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Accounts list */}
          <div>
            <Card className="shadow-sm bg-card border-border">
              <CardContent className="p-0">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-muted-foreground">
                    {!isLoading && (
                      <span className="font-medium">
                        {accounts.length} {accounts.length === 1 ? singularLabel : isAggregated ? 'accounts' : (activeConfig?.label ?? 'accounts')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-[200px] min-w-[140px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type="text"
                        placeholder={isAggregated ? 'Search accounts...' : `Search ${activeConfig?.label?.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="bg-brand-primary hover:bg-brand-primary-hover"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
                    </div>
                  ) : error ? (
                    <div className="py-16 text-center text-destructive">Failed to load accounts.</div>
                  ) : accounts.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary/10 rounded-full mb-4">
                        <Users className="h-10 w-10 text-brand-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        No {isAggregated ? 'accounts' : (activeConfig?.label ?? 'accounts')} Yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first {singularLabel.toLowerCase()}.
                      </p>
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary-hover"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add {singularLabel}
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px]">ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.map((acc) => (
                          <TableRow
                            key={acc.id}
                            className="hover:bg-muted/30 cursor-pointer"
                            onClick={() => handleView(acc)}
                          >
                            <TableCell className="font-mono text-sm text-muted-foreground">{acc.id}</TableCell>
                            <TableCell className="font-medium">{acc.name}</TableCell>
                            <TableCell className="text-muted-foreground">{acc.account_code || '-'}</TableCell>
                            <TableCell>{acc.primary_contact_person || '-'}</TableCell>
                            <TableCell>{acc.primary_email || '-'}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 mr-1 text-brand-primary hover:bg-brand-primary/10"
                                      onClick={() => handleEdit(acc)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDelete(acc)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Deactivate</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddAccountDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultTagCode={tagCode}
      />
      <EditAccountDialog
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        account={editingAccount}
      />
    </div>
  );
};

export default AccountsLandingPage;
