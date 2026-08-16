import React from 'react';
import {
  Search,
  Pencil,
  Trash2,
  Factory as FactoryIcon,
  ChevronRight,
  Cog,
  Warehouse,
  Package,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Factory } from '@/types/factory';
import type { FactoryCardSnapshot } from '@/pages/newpages/factories/factoriesOverviewData';
import { brandIconGlyphClass, brandIconTileClass } from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';

interface FactoryOverviewCardProps {
  factory: Factory;
  snapshot: FactoryCardSnapshot;
  isSelected?: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const FactoryOverviewCard: React.FC<FactoryOverviewCardProps> = ({
  factory,
  snapshot,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  isDeleting,
}) => (
  <Card
    className={cn(
      'group flex h-full cursor-pointer flex-col transition-all',
      isSelected
        ? 'border-brand-primary/40 bg-brand-primary/[0.06] ring-1 ring-brand-primary/25 shadow-sm'
        : 'border-border hover:border-brand-primary/30 hover:shadow-md'
    )}
    onClick={onSelect}
  >
    <CardHeader className="space-y-0 p-4 pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className={brandIconTileClass} aria-hidden>
            <FactoryIcon className={brandIconGlyphClass} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base font-semibold leading-snug text-card-foreground">
              {factory.name}
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                {factory.abbreviation}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">#{factory.id}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-primary" />
      </div>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col justify-end space-y-3 p-4 pt-0">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="gap-1 border-border bg-muted/30 text-xs font-normal">
          <Cog className="h-3 w-3 shrink-0" aria-hidden />
          {snapshot.running}/{snapshot.totalMachines} running
        </Badge>
        <Badge variant="outline" className="gap-1 border-border bg-muted/30 text-xs font-normal">
          <Warehouse className="h-3 w-3 shrink-0" aria-hidden />
          {snapshot.storageSkus} SKUs
        </Badge>
        <Badge variant="outline" className="gap-1 border-border bg-muted/30 text-xs font-normal">
          <Package className="h-3 w-3 shrink-0" aria-hidden />
          {snapshot.productionInProgress} in progress
        </Badge>
        {snapshot.overdueCount > 0 ? (
          <Badge
            variant="outline"
            className="gap-1 border-red-400/50 bg-red-400/10 text-xs font-normal text-red-800 dark:text-red-300"
          >
            <Wrench className="h-3 w-3 shrink-0" aria-hidden />
            {snapshot.overdueCount} overdue
          </Badge>
        ) : null}
        {snapshot.upcomingCount > 0 ? (
          <Badge
            variant="outline"
            className="gap-1 border-amber-400/50 bg-amber-400/10 text-xs font-normal text-amber-800 dark:text-amber-300"
          >
            <Wrench className="h-3 w-3 shrink-0" aria-hidden />
            {snapshot.upcomingCount} due (7d)
          </Badge>
        ) : null}
      </div>
      <div
        className="flex items-center justify-end border-t border-border pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary-hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit factory</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deactivate factory</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface FactoriesShrunkGridProps {
  factories: Factory[];
  factoryCardSnapshots: Map<number, FactoryCardSnapshot>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFactoryId?: number | null;
  onSelect: (factory: Factory) => void;
  onEdit: (factory: Factory) => void;
  onDelete: (factory: Factory) => void;
  isDeleting: boolean;
  isLoading?: boolean;
}

const emptySnapshot: FactoryCardSnapshot = {
  running: 0,
  totalMachines: 0,
  storageSkus: 0,
  productionInProgress: 0,
  overdueCount: 0,
  upcomingCount: 0,
};

const FactoriesShrunkGrid: React.FC<FactoriesShrunkGridProps> = ({
  factories,
  factoryCardSnapshots,
  searchQuery,
  onSearchChange,
  selectedFactoryId,
  onSelect,
  onEdit,
  onDelete,
  isDeleting,
  isLoading,
}) => (
  <Card className="flex h-auto flex-col overflow-hidden border-border bg-card shadow-sm lg:h-full lg:min-h-0">
    <CardContent className="flex flex-col p-0 lg:min-h-0 lg:flex-1">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {!isLoading && (
            <span className="font-medium">
              {factories.length} {factories.length === 1 ? 'factory' : 'factories'}
            </span>
          )}
        </div>
        <div className="relative w-[min(220px,40vw)] min-w-[160px] shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search factories..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 bg-background pl-9"
          />
        </div>
      </div>
      <div className="bg-background p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {factories.map((factory) => (
            <FactoryOverviewCard
              key={factory.id}
              factory={factory}
              snapshot={factoryCardSnapshots.get(factory.id) ?? emptySnapshot}
              isSelected={selectedFactoryId === factory.id}
              onSelect={() => onSelect(factory)}
              onEdit={() => onEdit(factory)}
              onDelete={() => onDelete(factory)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default FactoriesShrunkGrid;
