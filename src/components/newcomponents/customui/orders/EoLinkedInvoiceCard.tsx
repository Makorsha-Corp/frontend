import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ExternalLink, FileText, Loader2, Plus } from 'lucide-react';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseApprovalSummary } from '@/types/expenseOrder';
import type { ExpenseOrderEvent } from '@/types/expenseOrder';
import { formatInvLabel } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';

export interface EoLinkedInvoiceCardProps {
  order: ExpenseOrder;
  invoice: AccountInvoice | undefined;
  events?: ExpenseOrderEvent[];
  accountName: string | null;
  approvalSummary: ExpenseApprovalSummary;
  isCreatingInvoice?: boolean;
  onCreateInvoice: () => void;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
}

const EoLinkedInvoiceCard: React.FC<EoLinkedInvoiceCardProps> = ({
  order,
  invoice,
  accountName,
  approvalSummary,
  isCreatingInvoice = false,
  onCreateInvoice,
  highlighted = false,
  onHighlightDismiss,
}) => {
  const navigate = useNavigate();
  const invoiceId = order.invoice_id;
  const hasInvoice = invoiceId != null;
  const isFinalized = invoice?.invoice_status === 'confirmed';
  const accountId = order.account_id ?? invoice?.account_id ?? null;

  const linkedInvoiceLabel =
    invoiceId != null
      ? invoice
        ? formatInvLabel(invoice)
        : `Inv #${invoiceId}`
      : null;

  const handleViewInAccounts = () => {
    if (!accountId || invoiceId == null) return;
    navigate(`/accounts/${accountId}?invoiceId=${invoiceId}`);
  };

  return (
    <Card
      id="eo-section-invoice"
      className={cn('scroll-mt-6', highlighted && 'po-scroll-target-highlight')}
      onMouseEnter={() => {
        if (highlighted) onHighlightDismiss?.();
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              Linked Invoice
              {linkedInvoiceLabel ? (
                <span className="font-normal text-muted-foreground"> · {linkedInvoiceLabel}</span>
              ) : null}
            </span>
          </CardTitle>
          {isFinalized && (
            <Badge variant="outline" className="status-badge status-badge--confirmed shrink-0">
              Finalized
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasInvoice ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center space-y-3">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {approvalSummary.met
                ? 'Create a payable invoice from this expense order'
                : 'Invoice will be created automatically once approvals are met'}
            </p>
            {approvalSummary.met && (
              <BlockedActionButton
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                blocked={false}
                isBusy={isCreatingInvoice}
                onAction={onCreateInvoice}
              >
                {isCreatingInvoice ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating invoice…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create invoice
                  </>
                )}
              </BlockedActionButton>
            )}
          </div>
        ) : (
          <>
            <AccountInvoiceOverviewPanel
              invoiceId={invoiceId!}
              invoice={invoice}
              accountName={accountName}
              linkedOrderNumber={order.expense_number}
              showOrderSummary={false}
            />

            {isFinalized && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-border/60">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={handleViewInAccounts}
                  disabled={!accountId}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View on Account
                </Button>
              </div>
            )}

            {!isFinalized && (
              <p className="text-xs text-muted-foreground">
                Invoice is in draft — completing the order will finalize it
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EoLinkedInvoiceCard;
