import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AccountsHubSectionCardDetail {
  label: string;
  value: React.ReactNode;
}

export interface AccountsHubSectionCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  footer?: string;
  details?: AccountsHubSectionCardDetail[];
  icon?: LucideIcon;
  iconContainerClassName?: string;
  iconClassName?: string;
  tintClassName?: string;
  selected?: boolean;
  onClick: () => void;
  'aria-label'?: string;
}

/** Clickable KPI tile for Accounts hub section navigation (Overview / Payable / Receivable). */
const AccountsHubSectionCard: React.FC<AccountsHubSectionCardProps> = ({
  title,
  value,
  subtitle,
  footer,
  details,
  icon: Icon,
  iconContainerClassName,
  iconClassName,
  tintClassName,
  selected = false,
  onClick,
  'aria-label': ariaLabel,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel ?? title}
    aria-pressed={selected}
    className="h-full w-full text-left"
  >
    <Card
      className={cn(
        'h-full border-border bg-card transition-all hover:border-brand-primary/40',
        tintClassName,
        selected
          ? 'border-brand-primary ring-1 ring-brand-primary/30 bg-brand-primary/5 dark:bg-brand-primary/10'
          : 'hover:bg-muted/20'
      )}
    >
      <CardContent className="flex h-full items-start gap-4 p-4">
        {Icon ? (
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
              iconContainerClassName ?? 'bg-muted'
            )}
          >
            <Icon className={cn('h-6 w-6', iconClassName ?? 'text-muted-foreground')} />
          </div>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-0.5 min-h-[1.25rem]">
            {subtitle ? (
              <p className="line-clamp-1 text-xs text-muted-foreground/80" title={subtitle}>
                {subtitle}
              </p>
            ) : (
              <span className="block text-xs" aria-hidden="true">
                &nbsp;
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {details && details.length > 0 ? (
            <div
              className={cn(
                'mt-3 grid gap-x-4 gap-y-1 border-t border-border pt-3',
                details.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'
              )}
            >
              {details.map((detail) => (
                <div key={detail.label} className="min-w-0">
                  <p className="text-xs text-muted-foreground">{detail.label}</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">{detail.value}</p>
                </div>
              ))}
            </div>
          ) : footer ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={footer}>
              {footer}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  </button>
);

export default AccountsHubSectionCard;
