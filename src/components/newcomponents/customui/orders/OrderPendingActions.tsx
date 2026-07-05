import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight, Check } from 'lucide-react';

export interface PendingActionItem {
  id: string | number;
  label: string;
  sublabel?: string;
}

export interface PendingActionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  count: number;
  items: PendingActionItem[];
  colorClass: string;
  bgClass: string;
}

export interface OrderPendingActionsProps {
  title?: string;
  titleIcon?: React.ReactNode;
  sections: PendingActionSection[];
  onSelectItem: (id: string | number) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

const OrderPendingActions: React.FC<OrderPendingActionsProps> = ({
  title = 'Needs Attention',
  titleIcon,
  sections,
  onSelectItem,
  emptyTitle = 'All clear!',
  emptyMessage = 'No pending actions at the moment',
  className,
}) => {
  const visibleSections = sections.filter((s) => s.count > 0);
  const allClear = visibleSections.length === 0;

  return (
    <Card className={`border-border flex flex-col min-h-0 ${className ?? ''}`}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {titleIcon ?? <AlertCircle className="h-4 w-4 text-muted-foreground" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {allClear ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-card-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center ${section.bgClass}`}
                  >
                    <span className={section.colorClass}>{section.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {section.title}
                  </span>
                  <span
                    className={`ml-auto text-xs font-semibold px-1.5 py-0.5 rounded ${section.bgClass} ${section.colorClass}`}
                  >
                    {section.count}
                  </span>
                </div>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      className="w-full max-w-none justify-between h-auto py-2 px-2.5 text-left rounded-lg border border-border/60 bg-background hover:bg-muted/40 hover:text-foreground"
                      onClick={() => onSelectItem(item.id)}
                    >
                      <span className="text-sm truncate">
                        <span className="font-medium">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-muted-foreground ml-2">
                            {item.sublabel}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </Button>
                  ))}
                  {section.count > section.items.length && (
                    <p className="text-xs text-muted-foreground">
                      +{section.count - section.items.length} more
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderPendingActions;
