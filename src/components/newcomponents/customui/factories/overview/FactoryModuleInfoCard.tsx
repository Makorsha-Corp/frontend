import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FactoryModuleInfoCardVariant =
  | 'primary'
  | 'primaryHover'
  | 'accent'
  | 'accentLight';

const variantStyles: Record<
  FactoryModuleInfoCardVariant,
  {
    card: string;
    title: string;
    headline: string;
    subtitle: string;
    badge: string;
    chevron: string;
    bodyLabel: string;
    bodyValue: string;
    bodyMuted: string;
    bodySectionLabel: string;
    bodyListItem: string;
  }
> = {
  primary: {
    card: 'border-transparent bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover',
    title: 'text-white/90',
    headline: 'text-white',
    subtitle: 'text-white/75',
    badge: 'border-white/30 bg-white/10 text-white hover:bg-white/10',
    chevron: 'text-white/60 group-hover:text-white',
    bodyLabel: 'text-white/70',
    bodyValue: 'text-white',
    bodyMuted: 'text-white/70',
    bodySectionLabel: 'text-white/65',
    bodyListItem: 'border-white/10 bg-white/5 text-white',
  },
  primaryHover: {
    card: 'border-transparent bg-brand-primary-hover text-white shadow-sm hover:opacity-95',
    title: 'text-white/90',
    headline: 'text-white',
    subtitle: 'text-white/75',
    badge: 'border-white/30 bg-white/10 text-white hover:bg-white/10',
    chevron: 'text-white/60 group-hover:text-white',
    bodyLabel: 'text-white/70',
    bodyValue: 'text-white',
    bodyMuted: 'text-white/70',
    bodySectionLabel: 'text-white/65',
    bodyListItem: 'border-white/10 bg-white/5 text-white',
  },
  accent: {
    card: 'border-transparent bg-brand-accent text-card-foreground shadow-sm hover:opacity-95 dark:text-accent-foreground',
    title: 'text-card-foreground/70 dark:text-accent-foreground/80',
    headline: 'text-card-foreground dark:text-accent-foreground',
    subtitle: 'text-card-foreground/70 dark:text-accent-foreground/70',
    badge:
      'border-card-foreground/15 bg-background/60 text-card-foreground dark:border-accent-foreground/20 dark:bg-secondary/80 dark:text-foreground',
    chevron: 'text-card-foreground/60 group-hover:text-brand-primary dark:text-accent-foreground/60',
    bodyLabel: 'text-card-foreground/65 dark:text-accent-foreground/70',
    bodyValue: 'text-card-foreground dark:text-accent-foreground',
    bodyMuted: 'text-card-foreground/65 dark:text-accent-foreground/65',
    bodySectionLabel: 'text-card-foreground/60 dark:text-accent-foreground/65',
    bodyListItem:
      'border-card-foreground/10 bg-background/40 text-card-foreground dark:border-accent-foreground/15 dark:bg-secondary/60 dark:text-foreground',
  },
  accentLight: {
    card: 'border-transparent bg-brand-accent-light text-card-foreground shadow-sm hover:opacity-95 dark:text-accent-foreground',
    title: 'text-card-foreground/70 dark:text-accent-foreground/80',
    headline: 'text-card-foreground dark:text-accent-foreground',
    subtitle: 'text-card-foreground/70 dark:text-accent-foreground/70',
    badge:
      'border-card-foreground/15 bg-background/50 text-card-foreground dark:border-accent-foreground/20 dark:bg-secondary/80 dark:text-foreground',
    chevron: 'text-card-foreground/60 group-hover:text-brand-primary dark:text-accent-foreground/60',
    bodyLabel: 'text-card-foreground/65 dark:text-accent-foreground/70',
    bodyValue: 'text-card-foreground dark:text-accent-foreground',
    bodyMuted: 'text-card-foreground/65 dark:text-accent-foreground/65',
    bodySectionLabel: 'text-card-foreground/60 dark:text-accent-foreground/65',
    bodyListItem:
      'border-card-foreground/10 bg-background/35 text-card-foreground dark:border-accent-foreground/15 dark:bg-secondary/60 dark:text-foreground',
  },
};

interface FactoryModuleInfoCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  scopeLabel: string;
  headline: React.ReactNode;
  subtitle?: string;
  alertHint?: string;
  variant?: FactoryModuleInfoCardVariant;
  hasAlert?: boolean;
  className?: string;
  children?: React.ReactNode;
  compactHeader?: boolean;
}

export function factoryModuleInfoCardBodyClasses(
  variant: FactoryModuleInfoCardVariant
): Pick<
  (typeof variantStyles)[FactoryModuleInfoCardVariant],
  'bodyLabel' | 'bodyValue' | 'bodyMuted' | 'bodySectionLabel' | 'bodyListItem'
> {
  const s = variantStyles[variant];
  return {
    bodyLabel: s.bodyLabel,
    bodyValue: s.bodyValue,
    bodyMuted: s.bodyMuted,
    bodySectionLabel: s.bodySectionLabel,
    bodyListItem: s.bodyListItem,
  };
}

const FactoryModuleInfoCard: React.FC<FactoryModuleInfoCardProps> = ({
  title,
  icon: Icon,
  href,
  scopeLabel,
  headline,
  subtitle,
  alertHint,
  variant = 'primary',
  hasAlert = false,
  className,
  children,
  compactHeader = false,
}) => {
  const navigate = useNavigate();
  const s = variantStyles[variant];

  const handleCardClick = () => {
    navigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`${title}, open ${title.toLowerCase()} page`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex h-full min-h-0 cursor-pointer flex-col transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        s.card,
        hasAlert &&
          (variant === 'primary' || variant === 'primaryHover') &&
          'ring-1 ring-amber-300/30',
        hasAlert &&
          (variant === 'accent' || variant === 'accentLight') &&
          'ring-1 ring-amber-400/40',
        className
      )}
    >
      <CardHeader className={cn('shrink-0 pb-2', compactHeader ? 'space-y-2' : 'space-y-3')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className={cn('flex items-center gap-2 text-sm font-medium', s.title)}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasAlert && alertHint ? (
              <Badge
                variant="outline"
                className={cn(
                  'border-amber-400/60 text-amber-800 dark:text-amber-300',
                  (variant === 'primary' || variant === 'primaryHover') &&
                    'border-amber-200/50 bg-amber-400/20 text-white'
                )}
              >
                {alertHint}
              </Badge>
            ) : null}
            <Badge variant="outline" className={s.badge}>
              {scopeLabel}
            </Badge>
            <ChevronRight
              className={cn('h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100', s.chevron)}
              aria-hidden
            />
          </div>
        </div>
        <div>
          <p
            className={cn(
              'font-bold tabular-nums',
              compactHeader ? 'text-2xl' : 'text-3xl',
              s.headline
            )}
          >
            {headline}
          </p>
          {subtitle ? <p className={cn('mt-1 text-xs', s.subtitle)}>{subtitle}</p> : null}
        </div>
      </CardHeader>

      {children ? (
        <CardContent className={cn('flex min-h-0 flex-1 flex-col overflow-hidden pt-0', compactHeader ? 'gap-2' : 'gap-3')}>
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
};

export default FactoryModuleInfoCard;
