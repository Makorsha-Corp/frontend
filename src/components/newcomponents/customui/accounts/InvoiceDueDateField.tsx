import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { useUpdateAccountInvoiceMutation } from '@/features/accountInvoices/accountInvoicesApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { formatInvoiceDate } from './accountInvoiceFormatters';
import { InvoiceDueDateEditDialog } from './InvoiceLifecycleDialogs';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export interface InvoiceDueDateFieldProps {
  invoice: AccountInvoice;
  /** When true, due date is display-only (e.g. finalized invoice on a PO). */
  readOnly?: boolean;
  /** Nested under a summary card label — no extra top margin. */
  compact?: boolean;
}

const InvoiceDueDateField: React.FC<InvoiceDueDateFieldProps> = ({
  invoice,
  readOnly = false,
  compact = false,
}) => {
  const valueMargin = compact ? '' : 'mt-0.5';
  const displayValueClass = cn(
    'text-card-foreground',
    compact ? 'text-base font-semibold tabular-nums leading-tight' : 'text-sm'
  );
  const isDraft = invoice.invoice_status === 'draft';
  const isConfirmed = invoice.invoice_status === 'confirmed';
  const [draft, setDraft] = useState(() => toDateInputValue(invoice.due_date));
  const [editOpen, setEditOpen] = useState(false);
  const [confirmedDraft, setConfirmedDraft] = useState(() => toDateInputValue(invoice.due_date));
  const [updateInvoice, { isLoading }] = useUpdateAccountInvoiceMutation();

  useEffect(() => {
    setDraft(toDateInputValue(invoice.due_date));
    setConfirmedDraft(toDateInputValue(invoice.due_date));
  }, [invoice.due_date, invoice.id]);

  const handleSave = async (next: string) => {
    const current = toDateInputValue(invoice.due_date);
    if (next === current) return;

    try {
      await updateInvoice({
        id: invoice.id,
        data: { due_date: next || null },
      }).unwrap();
      toast.success('Due date updated');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update due date');
      setDraft(current);
      setConfirmedDraft(current);
    }
  };

  const handleConfirmedSave = async () => {
    const current = toDateInputValue(invoice.due_date);
    if (confirmedDraft === current) {
      setEditOpen(false);
      return;
    }
    await handleSave(confirmedDraft);
    setEditOpen(false);
  };

  const openConfirmedEdit = () => {
    setConfirmedDraft(toDateInputValue(invoice.due_date));
    setEditOpen(true);
  };

  if (readOnly || !isDraft) {
    if (isConfirmed && !readOnly) {
      return (
        <>
          <div className={cn('flex items-center gap-2', valueMargin)}>
            <p className={displayValueClass}>{formatInvoiceDate(invoice.due_date)}</p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={openConfirmedEdit}
              aria-label="Edit due date"
              title="Edit due date"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <InvoiceDueDateEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            currentDueDate={invoice.due_date}
            draftDueDate={confirmedDraft}
            onDraftDueDateChange={setConfirmedDraft}
            onConfirm={handleConfirmedSave}
            isSaving={isLoading}
          />
        </>
      );
    }

    return (
      <p className={cn(displayValueClass, valueMargin)}>{formatInvoiceDate(invoice.due_date)}</p>
    );
  }

  return (
    <div className={cn('relative max-w-[11rem]', valueMargin)}>
      <Input
        type="date"
        value={draft}
        disabled={isLoading}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void handleSave(draft)}
        className={cn('h-9 bg-background pr-8', compact && 'text-base')}
        aria-label="Due date"
      />
      {isLoading ? (
        <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
};

export default InvoiceDueDateField;
