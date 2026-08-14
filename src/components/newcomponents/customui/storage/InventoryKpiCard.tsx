import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface InventoryKpiCardProps {
  title: string;
  value: React.ReactNode;
  footer?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
}

const InventoryKpiCard: React.FC<InventoryKpiCardProps> = ({
  title,
  value,
  footer,
  icon,
  isLoading,
  onClick,
}) => {
  const card = (
    <Card
      className={
        onClick
          ? 'border-border bg-card shadow-sm transition-colors hover:border-brand-primary/30'
          : 'border-border bg-card shadow-sm'
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className="text-muted-foreground/70">{icon}</span>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : value}
        </p>
        {footer ? <p className="mt-1 text-xs text-muted-foreground">{footer}</p> : null}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="cursor-pointer text-left transition-opacity hover:opacity-90"
        onClick={onClick}
        aria-label={title}
      >
        {card}
      </button>
    );
  }

  return card;
};

export const inventoryKpiGridClass =
  'grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';

export default InventoryKpiCard;
