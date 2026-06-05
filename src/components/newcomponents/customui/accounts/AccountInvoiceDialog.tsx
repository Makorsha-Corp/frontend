import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import AccountInvoiceOverviewPanel from './AccountInvoiceOverviewPanel';
import { formatInvLabel, formatOrderLabel } from './invoiceDisplayUtils';
import { useGetAccountInvoiceByIdQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';

export interface AccountInvoiceDialogProps {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When known, skips waiting on invoice fetch for navigation. */
  accountId?: number | null;
  /** When known, shown immediately in the panel header. */
  accountName?: string | null;
  linkedOrderNumber?: string | null;
  showOrderSummary?: boolean;
}

const AccountInvoiceDialog: React.FC<AccountInvoiceDialogProps> = ({
  invoiceId,
  open,
  onOpenChange,
  accountId: accountIdProp,
  accountName: accountNameProp,
  linkedOrderNumber,
  showOrderSummary = true,
}) => {
  const navigate = useNavigate();
  const { data: invoice } = useGetAccountInvoiceByIdQuery(invoiceId!, {
    skip: !invoiceId || !open,
  });

  const accountId = accountIdProp ?? invoice?.account_id ?? null;
  const { data: account } = useGetAccountByIdQuery(accountId!, {
    skip: !accountId || !open || accountNameProp != null,
  });
  const accountName = accountNameProp ?? account?.name ?? null;

  const handleViewOnAccount = () => {
    if (!accountId || invoiceId == null) return;
    onOpenChange(false);
    navigate(`/accounts/${accountId}?invoiceId=${invoiceId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(44rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {invoiceId != null ? (
              <>
                <span>
                  {formatInvLabel({
                    id: invoiceId,
                    invoice_number: invoice?.invoice_number ?? null,
                  })}
                </span>
                {linkedOrderNumber ? (
                  <span className="text-muted-foreground font-normal">
                    · {formatOrderLabel(linkedOrderNumber)}
                  </span>
                ) : null}
              </>
            ) : (
              'Invoice'
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {invoiceId != null ? (
            <AccountInvoiceOverviewPanel
              invoiceId={invoiceId}
              invoice={invoice}
              accountName={accountName}
              linkedOrderNumber={linkedOrderNumber}
              showOrderSummary={showOrderSummary}
            />
          ) : null}
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleViewOnAccount}
            disabled={!accountId || invoiceId == null}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountInvoiceDialog;
