import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { Users, Pencil, Loader2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import toast, { Toaster } from 'react-hot-toast';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const accountId = id ? parseInt(id, 10) : null;
  const { data: account, isLoading, error } = useGetAccountByIdQuery(accountId!, {
    skip: !accountId || isNaN(accountId),
  });
  const { data: invoices = [] } = useGetAccountInvoicesQuery(
    { account_id: accountId!, limit: 50 },
    { skip: !accountId || isNaN(accountId) }
  );

  if (!accountId || isNaN(accountId)) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">
          Invalid account ID. <Link to="/accounts" className="underline">Back to accounts</Link>
        </p>
      </div>
    );
  }

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
                    <BreadcrumbPage>{account ? account.name : 'Account'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="h-6 w-px bg-border" />
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                {account ? account.name : 'Account'}
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              disabled={!account}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="p-8 bg-background space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
            </div>
          ) : error || !account ? (
            <div className="py-16 text-center text-destructive">
              Failed to load account. <Link to="/accounts" className="underline">Back to accounts</Link>
            </div>
          ) : (
            <>
              <Card className="shadow-sm bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div className="text-card-foreground">{account.name}</div>
                  </div>
                  {account.account_code && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Account Code</div>
                      <div className="font-mono text-card-foreground">{account.account_code}</div>
                    </div>
                  )}
                  {account.primary_contact_person && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Primary Contact</div>
                      <div className="text-card-foreground">{account.primary_contact_person}</div>
                    </div>
                  )}
                  {account.primary_email && (
                    <div className="space-y-2 flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Email</div>
                        <a href={`mailto:${account.primary_email}`} className="text-brand-primary hover:underline">
                          {account.primary_email}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.primary_phone && (
                    <div className="space-y-2 flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Phone</div>
                        <a href={`tel:${account.primary_phone}`} className="text-brand-primary hover:underline">
                          {account.primary_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.address && (
                    <div className="space-y-2 flex items-start gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Address</div>
                        <div className="text-card-foreground">
                          {[account.address, account.city, account.postal_code, account.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  {account.payment_terms && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Payment Terms</div>
                      <div className="text-card-foreground">{account.payment_terms}</div>
                    </div>
                  )}
                  {account.tags && account.tags.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {account.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-md text-xs font-medium"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : undefined,
                              color: tag.color || undefined,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoices ({invoices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No invoices for this account yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {invoices.slice(0, 10).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div>
                            <span className="font-medium">{inv.invoice_number || `#${inv.id}`}</span>
                            <span className="text-muted-foreground ml-2">
                              {inv.invoice_type} • {inv.payment_status}
                            </span>
                          </div>
                          <div className="text-sm">
                            {inv.invoice_amount.toLocaleString()} {inv.paid_amount > 0 && `(paid: ${inv.paid_amount})`}
                          </div>
                        </div>
                      ))}
                      {invoices.length > 10 && (
                        <p className="text-sm text-muted-foreground pt-2">
                          + {invoices.length - 10} more invoices
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <EditAccountDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        account={account ?? null}
      />
    </div>
  );
};

export default AccountDetailPage;
