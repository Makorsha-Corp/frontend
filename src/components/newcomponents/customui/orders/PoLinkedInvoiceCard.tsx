import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Check,
  ExternalLink,
  FileText,
  History,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';
import InvoiceLockedBadge from '@/components/newcomponents/customui/accounts/InvoiceLockedBadge';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { PurchaseOrderEvent } from '@/types/purchaseOrder';
import type { PoLinkedInvoiceStatus, PoSectionConfirmKey } from './purchaseOrderMilestones';
import { canVoidPoInvoice } from './purchaseOrderMilestones';
import type { PurchaseOrderItem } from '@/types/purchaseOrder';
import PoVoidedInvoicesDialog from './PoVoidedInvoicesDialog';
import { getVoidedInvoicesFromPoEvents } from './poVoidedInvoiceUtils';
import { formatInvLabel } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';

export interface PoLinkedInvoiceCardProps {
  invoiceId: number | null;
  invoice: AccountInvoice | undefined;
  invoiceStatus: PoLinkedInvoiceStatus;
  invoiceLocked: boolean;
  hasSupplier: boolean;
  isSyncingDraft?: boolean;
  accountName: string | null;
  accountId?: number | null;
  linkedOrderNumber: string;
  poNumber: string;
  events?: PurchaseOrderEvent[];
  confirmReadiness: { ok: boolean; reason?: string };
  poItems?: PurchaseOrderItem[];
  isConfirming?: boolean;
  isVoiding?: boolean;
  onConfirmInvoice: () => void;
  onVoidInvoice: () => void;
  onOpenFullView: () => void;
  highlightedTarget?: PoSectionConfirmKey | 'approvals' | 'finalize' | null;
  onHighlightDismiss?: () => void;
}

const PoLinkedInvoiceCard: React.FC<PoLinkedInvoiceCardProps> = ({
  invoiceId,
  invoice,
  invoiceStatus,
  invoiceLocked,
  hasSupplier,
  isSyncingDraft = false,
  accountName,
  accountId: accountIdProp,
  linkedOrderNumber,
  poNumber,
  events = [],
  confirmReadiness,
  poItems = [],
  isConfirming = false,
  isVoiding = false,
  onConfirmInvoice,
  onVoidInvoice,
  onOpenFullView,
  highlightedTarget = null,
  onHighlightDismiss,
}) => {
  const [voidedDialogOpen, setVoidedDialogOpen] = useState(false);
  const voidedInvoices = useMemo(() => getVoidedInvoicesFromPoEvents(events), [events]);
  const hasDraft = invoiceStatus === 'draft' && invoiceId != null;
  const isConfirmed = invoiceStatus === 'confirmed' && invoiceId != null;
  const isLocked = invoiceStatus === 'locked' && invoiceId != null;
  const isFinalized = isConfirmed || isLocked;
  const hasInvoice = hasDraft || isFinalized;
  const voidReadiness = canVoidPoInvoice(invoiceStatus, poItems);
  const navigate = useNavigate();
  const accountId = accountIdProp ?? invoice?.account_id ?? null;
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

  const voidedInvoicesButton =
    voidedInvoices.length > 0 ? (
      <Button
        type="button"
        size="sm"
        className="shrink-0 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500"
        onClick={() => setVoidedDialogOpen(true)}
      >
        <History className="h-3.5 w-3.5 mr-1.5" />
        Voided invoices ({voidedInvoices.length})
      </Button>
    ) : null;

  const invoiceActionsBar = (actions: React.ReactNode) => (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 pt-1 border-t border-border/60',
        voidedInvoices.length > 0 ? 'justify-between' : 'justify-end'
      )}
    >
      {voidedInvoicesButton}
      <div className="flex flex-wrap items-center justify-end gap-3">{actions}</div>
    </div>
  );

  return (
    <Card id="po-section-invoice" className="scroll-mt-6">
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
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isConfirmed && (
              <Badge variant="outline" className="status-badge status-badge--confirmed">
                Finalized
              </Badge>
            )}
            {isLocked && <InvoiceLockedBadge />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasInvoice ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center space-y-2">
            {isSyncingDraft ? (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing draft invoice…
              </p>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mx-auto text-muted-foreground/60" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  {hasSupplier
                    ? 'Draft invoice will sync from this order when saved'
                    : 'Assign a supplier — draft invoice auto-syncs supplier and line items'}
                </p>
                {voidedInvoices.length > 0 ? (
                  <div className="flex justify-center pt-2">{voidedInvoicesButton}</div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <>
            <div className={cn(invoiceLocked && 'opacity-[0.88] saturate-[0.92]')}>
              <AccountInvoiceOverviewPanel
                invoiceId={invoiceId!}
                invoice={invoice}
                accountName={accountName}
                linkedOrderNumber={linkedOrderNumber}
                showOrderSummary={false}
              />
            </div>

            {hasDraft &&
              invoiceActionsBar(
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={onOpenFullView}
                  >
                    Open full view
                  </Button>
                  <BlockedActionButton
                    id="po-finalize-invoice-btn"
                    size="sm"
                    className={cn(
                      'bg-green-600 hover:bg-green-700 text-white shrink-0 scroll-mt-24',
                      highlightedTarget === 'finalize' && 'po-scroll-target-highlight'
                    )}
                    onMouseEnter={() => {
                      if (highlightedTarget === 'finalize') onHighlightDismiss?.();
                    }}
                    blocked={!confirmReadiness.ok}
                    blockedHint={
                      !confirmReadiness.ok
                        ? {
                            title: 'Cannot finalize yet',
                            reason: confirmReadiness.reason ?? 'Complete the required steps first',
                          }
                        : undefined
                    }
                    isBusy={isConfirming}
                    onAction={onConfirmInvoice}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Finalize Invoice
                  </BlockedActionButton>
                </>
              )}

            {isFinalized &&
              invoiceActionsBar(
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleViewInAccounts}
                    disabled={!accountId || invoiceId == null}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View on Account
                  </Button>
                  <BlockedActionButton
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10"
                    blocked={!voidReadiness.ok}
                    blockedHint={
                      !voidReadiness.ok
                        ? {
                            title: 'Cannot void anymore',
                            reason:
                              voidReadiness.reason ??
                              'Receiving has started — this invoice can no longer be voided',
                          }
                        : undefined
                    }
                    isBusy={isVoiding}
                    onAction={onVoidInvoice}
                  >
                    {isVoiding ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Void invoice
                  </BlockedActionButton>
                </>
              )}
          </>
        )}
      </CardContent>
      <PoVoidedInvoicesDialog
        open={voidedDialogOpen}
        onOpenChange={setVoidedDialogOpen}
        voidedInvoices={voidedInvoices}
        accountId={accountId}
        poNumber={poNumber}
      />
    </Card>
  );
};

export default PoLinkedInvoiceCard;
