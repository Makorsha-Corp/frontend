import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetAccountsQuery, useDeleteAccountMutation } from '@/features/accounts/accountsApi';
import type { Account } from '@/types/account';
import { Search, Plus, Loader2, Pencil, Trash2, Users } from 'lucide-react';
import AddAccountDialog from '@/components/newcomponents/customui/AddAccountDialog';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import toast, { Toaster } from 'react-hot-toast';

const SECTION_CONFIG: Record<string, { label: string; tagCode: string }> = {
  suppliers: { label: 'Suppliers', tagCode: 'supplier' },
  vendors: { label: 'Vendors', tagCode: 'vendor' },
  customers: { label: 'Customers', tagCode: 'client' },
  utilities: { label: 'Utilities', tagCode: 'utility' },
  payroll: { label: 'Payroll', tagCode: 'payroll' },
};

interface AccountsListPageProps {
  section: string;
}

const AccountsListPage: React.FC<AccountsListPageProps> = ({ section }) => {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const config = section ? SECTION_CONFIG[section] : null;
  const tagCode = config?.tagCode;

  const { data: accounts = [], isLoading, error } = useGetAccountsQuery(
    {
      skip: 0,
      limit: 100,
      search: searchQuery || undefined,
      tag_code: tagCode,
    },
    { skip: !tagCode }
  );
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
  };

  const handleView = (account: Account) => {
    navigate(`/accounts/${account.id}`);
  };

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

  if (!section || !config) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">
          Invalid section. <Link to="/accounts" className="underline">Back to accounts</Link>
        </p>
      </div>
    );
  }

  const singularLabel = config.label.slice(0, -1);

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/accounts">Accounts</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{config.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="h-6 w-px bg-border" />
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                {config.label}
              </h1>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add {singularLabel}
            </Button>
          </div>
        </div>

        <div className="p-8 bg-background">
          <Card className="shadow-sm bg-card border-border">
            <CardContent className="p-0">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  {!isLoading && (
                    <span className="font-medium">
                      {accounts.length} {accounts.length === 1 ? singularLabel : config.label}
                    </span>
                  )}
                </div>
                <div className="relative w-[200px] min-w-[140px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder={`Search ${config.label.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
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
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">No {config.label} Yet</h3>
                    <p className="text-muted-foreground mb-4">Add your first {singularLabel.toLowerCase()}.</p>
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

export default AccountsListPage;
