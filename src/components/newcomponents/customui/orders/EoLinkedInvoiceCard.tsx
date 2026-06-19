import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ExternalLink, FileText, Loader2, Plus } from 'lucide-react';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { SectionConfirmActions } from './PoSectionConfirmButton';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseOrderEvent } from '@/types/expenseOrder';
import { formatInvLabel } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';

export interface EoLinkedInvoiceCardProps {
  order: ExpenseOrder;
  invoice: AccountInvoice | undefined;
  events?: ExpenseOrderEvent[];
  accountName: string | null;
  invoiceConfirmed: boolean;
  confirmReadiness: { ok: boolean; reason?: string };
  finalizeReadiness: { ok: boolean; reason?: string };
  isCreatingInvoice?: boolean;
  isConfirmingInvoice?: boolean;
  isConfirmingSection?: boolean;
  onCreateInvoice: () => void;
  onFinalizeInvoice: () => void;
  onToggleInvoiceConfirm: () => void;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
}

const EoLinkedInvoiceCard: React.FC<EoLinkedInvoiceCardProps> = ({
  order,
  invoice,
  accountName,
  invoiceConfirmed,
  confirmReadiness,
  finalizeReadiness,
  isCreatingInvoice = false,
  isConfirmingInvoice = false,
  isConfirmingSection = false,
  onCreateInvoice,
  onFinalizeInvoice,
  onToggleInvoiceConfirm,
  highlighted = false,
  onHighlightDismiss,
}) => {
  const navigate = useNavigate();
  const invoiceId = order.invoice_id;
  const hasInvoice = invoiceId != null;
  const isDraft = invoice?.invoice_status === 'draft';
  const isFinalized = invoice?.invoice_status === 'confirmed' || invoice?.invoice_status === 'locked';
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
      className={cn('scroll-mt-6', invoiceConfirmed && 'border-muted-foreground/15 bg-muted/20')}
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
          <div className="flex shrink-0 items-center gap-2">
            {isFinalized && (
              <Badge variant="outline" className="status-badge status-badge--confirmed">
                Finalized
              </Badge>
            )}
            <SectionConfirmActions
              id="eo-confirm-invoice"
              confirmed={invoiceConfirmed}
              onToggle={onToggleInvoiceConfirm}
              isLoading={isConfirmingSection}
              label="linked invoice"
              highlighted={highlighted}
              onHighlightDismiss={onHighlightDismiss}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasInvoice ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center space-y-3">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Create a payable invoice from this expense order when approvals are ready
            </p>
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
          </div>
        ) : (
          <>
            <div className={cn(invoiceConfirmed && 'opacity-[0.88] saturate-[0.92]')}>
              <AccountInvoiceOverviewPanel
                invoiceId={invoiceId!}
                invoice={invoice}
                accountName={accountName}
                linkedOrderNumber={order.expense_number}
                showOrderSummary={false}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-border/60">
              {isDraft && (
                <BlockedActionButton
                  id="eo-finalize-invoice-btn"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                  blocked={!finalizeReadiness.ok}
                  blockedHint={
                    !finalizeReadiness.ok
                      ? {
                          title: 'Cannot finalize yet',
                          reason: finalizeReadiness.reason ?? 'Complete required steps first',
                        }
                      : undefined
                  }
                  isBusy={isConfirmingInvoice}
                  onAction={onFinalizeInvoice}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Finalize Invoice
                </BlockedActionButton>
              )}
              {isFinalized && (
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
              )}
            </div>

            {isFinalized && !invoiceConfirmed && (
              <p className="text-xs text-muted-foreground">
                Invoice is finalized — confirm the linked invoice section above when ready
              </p>
            )}
            {isDraft && confirmReadiness.ok === false && confirmReadiness.reason && (
              <p className="text-xs text-muted-foreground">{confirmReadiness.reason}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EoLinkedInvoiceCard;
