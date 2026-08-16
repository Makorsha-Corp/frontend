import React from 'react';
import { Card } from '@/components/ui/card';
import type { AccountHubRow } from '@/types/account';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AccountHubRowCardVariant = 'overview' | 'payable' | 'receivable';

export interface AccountHubRowCardProps {
  account: AccountHubRow;
  variant: AccountHubRowCardVariant;
  onView: (account: AccountHubRow) => void;
  formatCurrency: (value: number) => string;
}

function contactLine(account: AccountHubRow): string | null {
  const line = account.primary_contact_person || account.primary_email || account.primary_phone;
  return line || null;
}

const AccountHubRowCard: React.FC<AccountHubRowCardProps> = ({
  account,
  variant,
  onView,
  formatCurrency,
}) => {
  const rollup = account.openBalance;
  const tags = account.account_tags ?? [];

  const balanceParts: string[] = [];
  if (variant === 'overview') {
    if (rollup.payableOutstanding > 0) balanceParts.push(`Pay ${formatCurrency(rollup.payableOutstanding)}`);
    if (rollup.receivableOutstanding > 0) balanceParts.push(`Recv ${formatCurrency(rollup.receivableOutstanding)}`);
  }

  const secondaryMetric =
    variant === 'payable'
      ? rollup.payableOutstanding > 0
        ? formatCurrency(rollup.payableOutstanding)
        : null
      : variant === 'receivable'
        ? rollup.receivableOutstanding > 0
          ? formatCurrency(rollup.receivableOutstanding)
          : null
        : null;

  const invoiceMetric =
    variant === 'payable'
      ? rollup.openPayableCount > 0
        ? `${rollup.openPayableCount} open invoice${rollup.openPayableCount === 1 ? '' : 's'}`
        : null
      : variant === 'receivable'
        ? rollup.openReceivableCount > 0
          ? `${rollup.openReceivableCount} open invoice${rollup.openReceivableCount === 1 ? '' : 's'}`
          : null
        : null;

  const contact = contactLine(account);

  return (
    <Card
      className="cursor-pointer border-border p-3 transition-colors hover:border-brand-primary/25 hover:bg-muted/30"
      onClick={() => onView(account)}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 ring-1 ring-brand-primary/25"
          aria-hidden
        >
          <Building2 className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
            {account.account_code ? (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {account.account_code}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">#{account.id}</p>
          {contact ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{contact}</p>
          ) : null}
          {variant === 'overview' && tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    color: tag.color || undefined,
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 4 ? (
                <span className="text-[10px] text-muted-foreground">+{tags.length - 4}</span>
              ) : null}
            </div>
          ) : null}
          {variant === 'overview' ? (
            <p
              className={cn(
                'mt-2 text-xs tabular-nums',
                balanceParts.length > 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {balanceParts.length > 0 ? balanceParts.join(' · ') : 'No open balances'}
            </p>
          ) : (
            <div className="mt-2 space-y-0.5">
              {secondaryMetric ? (
                <p className="text-sm font-semibold tabular-nums text-foreground">{secondaryMetric}</p>
              ) : (
                <p className="text-xs text-muted-foreground">No open balance</p>
              )}
              {invoiceMetric ? (
                <p className="text-xs text-muted-foreground">{invoiceMetric}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AccountHubRowCard;
