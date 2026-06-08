import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useGetAccountInvoiceByIdQuery } from '@/features/accountInvoices/accountInvoicesApi';
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from '@/components/newcomponents/customui/accounts/accountInvoiceFormatters';
import type { PoVoidedInvoiceRef } from './poVoidedInvoiceUtils';

interface VoidedInvoiceRowProps {
  entry: PoVoidedInvoiceRef;
  accountId: number | null;
}

function VoidedInvoiceRow({ entry, accountId }: VoidedInvoiceRowProps) {
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError } = useGetAccountInvoiceByIdQuery(entry.invoiceId);

  const handleView = () => {
    if (!accountId) return;
    navigate(`/accounts/${accountId}?invoiceId=${entry.invoiceId}`);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invoice #{entry.invoiceId}…
        </div>
      ) : isError || !invoice ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-card-foreground">Invoice #{entry.invoiceId}</p>
          <p className="text-xs text-muted-foreground">{entry.eventDescription}</p>
          <p className="text-xs text-muted-foreground">
            Voided {formatInvoiceDate(entry.voidedAt)}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-card-foreground">
                {invoice.invoice_number ? `#${invoice.invoice_number}` : `Invoice #${invoice.id}`}
              </p>
              {invoice.description ? (
                <p className="text-xs text-muted-foreground line-clamp-2">{invoice.description}</p>
              ) : null}
            </div>
            <Badge variant="outline" className="status-badge shrink-0 border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300">
              Voided
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium tabular-nums text-card-foreground">
                {formatInvoiceCurrency(invoice.invoice_amount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Voided</dt>
              <dd className="font-medium text-card-foreground">
                {formatInvoiceDate(entry.voidedAt)}
              </dd>
            </div>
          </dl>
          {invoice.void_note ? (
            <p className="text-xs text-muted-foreground rounded-md border border-border/60 bg-background/60 px-3 py-2">
              {invoice.void_note}
            </p>
          ) : null}
          {accountId ? (
            <div className="flex justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleView}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View on account
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export interface PoVoidedInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voidedInvoices: PoVoidedInvoiceRef[];
  accountId: number | null;
  poNumber: string;
}

const PoVoidedInvoicesDialog: React.FC<PoVoidedInvoicesDialogProps> = ({
  open,
  onOpenChange,
  voidedInvoices,
  accountId,
  poNumber,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Voided invoices</DialogTitle>
        <DialogDescription>
          Previous invoices voided for purchase order {poNumber}.
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[min(60dvh,420px)] space-y-3 overflow-y-auto pr-1">
        {voidedInvoices.map((entry) => (
          <VoidedInvoiceRow key={entry.invoiceId} entry={entry} accountId={accountId} />
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export default PoVoidedInvoicesDialog;
