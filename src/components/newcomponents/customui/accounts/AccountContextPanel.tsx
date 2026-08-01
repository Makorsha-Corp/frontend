import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Account } from '@/types/account';

export interface AccountContextPanelProps {
  account: Account;
  /** When false (default), supplier details start collapsed. */
  defaultOpen?: boolean;
}

const DetailBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="mt-0.5 text-sm text-card-foreground">{children}</div>
  </div>
);

function supplierDetailsSummary(account: Account): string {
  const contact =
    account.primary_email?.trim() ||
    account.primary_phone?.trim() ||
    account.primary_contact_person?.trim();
  return [account.name, contact].filter(Boolean).join(' · ');
}

const AccountContextPanel: React.FC<AccountContextPanelProps> = ({
  account,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const locationLine = [account.city, account.country, account.postal_code].filter(Boolean).join(', ');

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="space-y-0"
      data-testid="account-context-panel"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground group-hover:text-foreground">
              Supplier details
            </p>
            {!open ? (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {supplierDetailsSummary(account)}
              </p>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4">
        <div className="grid gap-6 md:grid-cols-3 md:gap-0">
          <div className="space-y-3 md:border-r md:border-border md:pr-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Account profile
            </p>
            <DetailBlock label="Name">{account.name}</DetailBlock>
            <DetailBlock label="Account code">
              <span className="font-mono">{account.account_code || '—'}</span>
            </DetailBlock>
            <DetailBlock label="Invoicing">
              {account.allow_invoices ? 'Enabled' : 'Disabled for this account'}
            </DetailBlock>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              {account.account_tags && account.account_tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {account.account_tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                        color: tag.color || undefined,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">No tags</p>
              )}
            </div>
          </div>

          <div className="space-y-3 md:border-r md:border-border md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Contact
            </p>
            <DetailBlock label="Primary contact">{account.primary_contact_person || '—'}</DetailBlock>
            <DetailBlock label="Primary email">{account.primary_email || '—'}</DetailBlock>
            <DetailBlock label="Primary phone">{account.primary_phone || '—'}</DetailBlock>
            {account.secondary_contact_person || account.secondary_email || account.secondary_phone ? (
              <>
                <DetailBlock label="Secondary contact">{account.secondary_contact_person || '—'}</DetailBlock>
                <DetailBlock label="Secondary email">{account.secondary_email || '—'}</DetailBlock>
                <DetailBlock label="Secondary phone">{account.secondary_phone || '—'}</DetailBlock>
              </>
            ) : null}
          </div>

          <div className="space-y-3 md:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Finance & address
            </p>
            <DetailBlock label="Payment preferences">{account.payment_preferences || '—'}</DetailBlock>
            <DetailBlock label="Bank details">{account.bank_details || '—'}</DetailBlock>
            <DetailBlock label="Address">
              {account.address || '—'}
              <p className="mt-0.5 text-xs text-muted-foreground">{locationLine || '—'}</p>
            </DetailBlock>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AccountContextPanel;
