import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import PoSectionConfirmButton from './PoSectionConfirmButton';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { PoLinkedInvoiceStatus } from './purchaseOrderMilestones';

export interface PoLinkedInvoiceCardProps {
  invoiceId: number | null;
  invoice: AccountInvoice | undefined;
  invoiceStatus: PoLinkedInvoiceStatus;
  invoiceConfirmed: boolean;
  invoiceLocked: boolean;
  hasSupplier: boolean;
  isSyncingDraft?: boolean;
  accountName: string | null;
  accountId?: number | null;
  linkedOrderNumber: string;
  invoiceSectionReadiness: { ok: boolean; reason?: string };
  confirmReadiness: { ok: boolean; reason?: string };
  isConfirming?: boolean;
  isVoiding?: boolean;
  isConfirmingInvoiceSection?: boolean;
  onToggleInvoiceConfirm: () => void;
  onConfirmInvoice: () => void;
  onVoidInvoice: () => void;
  onOpenFullView: () => void;
  finalizeFlashing?: boolean;
  onFinalizeFlashEnd?: () => void;
  invoiceConfirmFlashing?: boolean;
  onInvoiceConfirmFlashEnd?: () => void;
}

const PoLinkedInvoiceCard: React.FC<PoLinkedInvoiceCardProps> = ({
  invoiceId,
  invoice,
  invoiceStatus,
  invoiceConfirmed,
  invoiceLocked,
  hasSupplier,
  isSyncingDraft = false,
  accountName,
  accountId: accountIdProp,
  linkedOrderNumber,
  invoiceSectionReadiness,
  confirmReadiness,
  isConfirming = false,
  isVoiding = false,
  isConfirmingInvoiceSection = false,
  onToggleInvoiceConfirm,
  onConfirmInvoice,
  onVoidInvoice,
  onOpenFullView,
  finalizeFlashing = false,
  onFinalizeFlashEnd,
  invoiceConfirmFlashing = false,
  onInvoiceConfirmFlashEnd,
}) => {
  const hasDraft = invoiceStatus === 'draft' && invoiceId != null;
  const isConfirmed = invoiceStatus === 'confirmed' && invoiceId != null;
  const hasInvoice = hasDraft || isConfirmed;
  const navigate = useNavigate();
  const accountId = accountIdProp ?? invoice?.account_id ?? null;

  const handleViewInAccounts = () => {
    if (!accountId || invoiceId == null) return;
    navigate(`/accounts/${accountId}?invoiceId=${invoiceId}`);
  };

  return (
    <Card id="po-section-invoice" className="scroll-mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Linked Invoice
            {hasInvoice && !invoiceLocked && invoiceConfirmed && (
              <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                Confirmed
              </Badge>
            )}
            {hasInvoice && isConfirmed && (
              <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                Finalized
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {hasInvoice && (
              <>
                {hasDraft && !invoiceLocked && (
                  <Badge
                    variant="outline"
                    className="font-normal text-amber-600 border-amber-600/30"
                  >
                    Draft
                  </Badge>
                )}
                {invoiceLocked ? (
                  <PoSectionConfirmButton confirmed label="draft invoice" variant="system" />
                ) : hasDraft ? (
                  <PoSectionConfirmButton
                    id="po-confirm-invoice"
                    confirmed={invoiceConfirmed}
                    onToggle={onToggleInvoiceConfirm}
                    isLoading={isConfirmingInvoiceSection}
                    label="draft invoice"
                    flashing={invoiceConfirmFlashing}
                    onFlashEnd={onInvoiceConfirmFlashEnd}
                  />
                ) : null}
              </>
            )}
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
              </>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                invoiceConfirmed && !invoiceLocked && 'opacity-[0.88] saturate-[0.92]'
              )}
            >
              <AccountInvoiceOverviewPanel
                invoiceId={invoiceId!}
                invoice={invoice}
                accountName={accountName}
                linkedOrderNumber={linkedOrderNumber}
                showOrderSummary={false}
              />
            </div>

            {hasDraft && !invoiceSectionReadiness.ok && !invoiceConfirmed && (
              <p className="text-xs text-muted-foreground">{invoiceSectionReadiness.reason}</p>
            )}

            {hasDraft && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-border/60">
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
                    finalizeFlashing && 'po-flash-highlight-3'
                  )}
                  onAnimationEnd={(event) => {
                    if (finalizeFlashing && event.animationName === 'po-flash-highlight-3') {
                      onFinalizeFlashEnd?.();
                    }
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
              </div>
            )}

            {isConfirmed && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-border/60">
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
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={isVoiding}
                  onClick={onVoidInvoice}
                >
                  {isVoiding ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Void invoice
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PoLinkedInvoiceCard;
