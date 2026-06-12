import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type DashboardStatVariant = 'primary' | 'primaryHover' | 'accent' | 'outlined';

const statStyles: Record<
  DashboardStatVariant,
  { card: string; title: string; value: string; icon: string; foot: string }
> = {
  primary: {
    card: 'bg-brand-primary text-white border-transparent shadow-sm',
    title: 'text-white/80',
    value: 'text-white',
    icon: 'text-white/60',
    foot: 'text-white/80',
  },
  primaryHover: {
    card: 'bg-brand-primary-hover text-white border-transparent shadow-sm',
    title: 'text-white/80',
    value: 'text-white',
    icon: 'text-white/60',
    foot: 'text-white/80',
  },
  accent: {
    card: 'bg-brand-accent text-card-foreground dark:text-accent-foreground border-transparent shadow-sm',
    title: 'text-card-foreground/60 dark:text-accent-foreground/70',
    value: 'text-card-foreground dark:text-accent-foreground',
    icon: 'text-card-foreground/60 dark:text-accent-foreground/60',
    foot: 'text-card-foreground/70 dark:text-accent-foreground/70',
  },
  outlined: {
    card: 'bg-card text-card-foreground border-2 border-brand-accent shadow-sm',
    title: 'text-card-foreground/60',
    value: 'text-card-foreground',
    icon: 'text-card-foreground/60',
    foot: 'text-muted-foreground',
  },
};

export interface DashboardStatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  variant: DashboardStatVariant;
  footer?: string;
  isLoading?: boolean;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  variant,
  footer,
  isLoading,
}) => {
  const s = statStyles[variant];
  return (
    <Card className={cn(s.card, 'flex h-full min-h-0 flex-col')}>
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className={cn('text-sm font-medium', s.title)}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-center justify-between">
          <div className={cn('text-3xl font-bold', s.value)}>
            {isLoading ? (
              <span className="inline-block h-9 w-16 animate-pulse rounded bg-current/20" />
            ) : (
              value
            )}
          </div>
          <div className={s.icon}>{icon}</div>
        </div>
        {footer ? <p className={cn('text-xs', s.foot)}>{footer}</p> : null}
      </CardContent>
    </Card>
  );
};

export default DashboardStatCard;
