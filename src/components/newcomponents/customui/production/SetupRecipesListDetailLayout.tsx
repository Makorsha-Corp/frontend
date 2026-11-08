import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductionRoute } from '@/types/production';
import { Plus } from 'lucide-react';

export interface SetupRecipesListDetailLayoutProps {
  routes: ProductionRoute[];
  selectedRouteId: number | null;
  onSelectRoute: (routeId: number) => void;
  onCreateRouteClick: () => void;
  processRouteSection: React.ReactNode;
  recipesSection: React.ReactNode;
}

const sectionTitleClass = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

const SetupRecipesListDetailLayout: React.FC<SetupRecipesListDetailLayoutProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onCreateRouteClick,
  processRouteSection,
  recipesSection,
}) => {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="w-[min(240px,38vw)] shrink-0 overflow-y-auto border-r border-border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={sectionTitleClass}>Routes</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={onCreateRouteClick}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add route
          </Button>
        </div>
        {routes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No routes yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {routes.map((route) => {
              const selected = route.id === selectedRouteId;
              return (
                <Button
                  key={route.id}
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'ghost'}
                  className={cn(
                    'h-auto justify-start py-2 text-left',
                    selected && 'bg-brand-primary hover:bg-brand-primary-hover',
                  )}
                  onClick={() => onSelectRoute(route.id)}
                >
                  <span className="truncate">{route.name}</span>
                </Button>
              );
            })}
          </div>
        )}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border px-4 py-2">
          <p className="text-sm font-medium text-foreground">Route setup</p>
          <p className="text-xs text-muted-foreground">Path and recipes for the selected route.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-0 lg:p-0">
          <section className="min-w-0 space-y-3 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-border lg:p-4">
            <p className={sectionTitleClass}>Path</p>
            {processRouteSection}
          </section>
          <section className="mt-6 min-w-0 space-y-3 lg:mt-0 lg:min-h-0 lg:overflow-y-auto lg:p-4">
            {recipesSection}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SetupRecipesListDetailLayout;
