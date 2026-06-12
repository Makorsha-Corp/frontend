import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarClock, Wrench, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAttentionItem } from './useDashboardData';

const KIND_ICONS = {
  overdue_order: AlertCircle,
  project_deadline: CalendarClock,
  maintenance: Wrench,
} as const;

const KIND_COLORS = {
  overdue_order: 'text-destructive',
  project_deadline: 'text-amber-600 dark:text-amber-500',
  maintenance: 'text-brand-primary',
} as const;

interface DashboardAttentionPanelProps {
  items: DashboardAttentionItem[];
  isLoading?: boolean;
}

const DashboardAttentionPanel: React.FC<DashboardAttentionPanelProps> = ({ items, isLoading }) => {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Needs attention</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex py-12 items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Nothing urgent right now</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const Icon = KIND_ICONS[item.kind];
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex items-center justify-between py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${KIND_COLORS[item.kind]}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-card-foreground truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardAttentionPanel;
