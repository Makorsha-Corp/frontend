import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface OrderOverviewKpiCardProps {
  title: string;
  value: React.ReactNode;
  footer: string;
}

/** Shared KPI tile for order hub overview panels (PO, TR, etc.). */
export function OrderOverviewKpiCard({ title, value, footer }: OrderOverviewKpiCardProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={footer}>
          {footer}
        </p>
      </CardContent>
    </Card>
  );
}
