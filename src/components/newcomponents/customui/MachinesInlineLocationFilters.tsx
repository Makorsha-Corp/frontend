import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import {
  computeToggleFactory,
  computeToggleSection,
  isFactoryRowChecked,
  isSectionRowChecked,
  locationFilterLabels,
  selectAllFactories,
  selectAllSections,
  visibleSectionsForSlice,
  type MachinesLocationFilterSlice,
} from '@/lib/machinesLocationFilters';
import { cn } from '@/lib/utils';

export interface MachinesInlineLocationFiltersProps {
  which: 'factories' | 'sections';
  variant?: 'toolbar' | 'breadcrumb';
  baseline?: 'default' | 'lowered';
  value: MachinesLocationFilterSlice;
  onChange: (next: MachinesLocationFilterSlice) => void;
  factories: Array<{ id: number; name: string; abbreviation: string }>;
  sections: Array<{ id: number; name: string; factory_id: number }>;
  className?: string;
}

const MachinesInlineLocationFilters: React.FC<MachinesInlineLocationFiltersProps> = ({
  which,
  variant = 'toolbar',
  baseline = 'default',
  value,
  onChange,
  factories,
  sections,
  className,
}) => {
  const allFactoryIds = React.useMemo(() => factories.map((f) => f.id), [factories]);

  const visibleSections = React.useMemo(
    () => visibleSectionsForSlice(value, allFactoryIds, sections),
    [sections, value.factory_ids, allFactoryIds]
  );

  const { factoryDropdownLabel, sectionDropdownLabel } = locationFilterLabels(
    value,
    allFactoryIds,
    visibleSections,
    factories,
    sections
  );

  const isBreadcrumb = variant === 'breadcrumb';
  const breadcrumbBaseClass =
    baseline === 'lowered'
      ? 'h-7 max-w-[min(242px,44vw)] justify-start gap-1 border-none bg-transparent px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground shadow-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      : 'h-8 max-w-[min(242px,44vw)] justify-start gap-1 border-none bg-transparent px-1.5 text-[15px] font-medium text-card-foreground dark:text-foreground shadow-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  const triggerClassName = isBreadcrumb
    ? breadcrumbBaseClass
    : 'h-9 max-w-[min(200px,32vw)] justify-between gap-1 px-2.5 text-xs sm:text-sm focus-visible:ring-inset';
  const chevronClassName = isBreadcrumb
    ? 'h-3.5 w-3.5 shrink-0 text-muted-foreground/80'
    : 'h-4 w-4 shrink-0 opacity-70';

  if (which === 'factories') {
    return (
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant={isBreadcrumb ? 'ghost' : 'outline'} className={triggerClassName}>
              <span className="truncate text-card-foreground dark:text-foreground">{factoryDropdownLabel}</span>
              <ChevronDown className={chevronClassName} aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
            align="start"
          >
            <DropdownMenuLabel>Factories</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onChange(selectAllFactories(value, allFactoryIds, sections));
              }}
              className={cn(value.factory_ids.length === 0 && 'bg-accent/70')}
            >
              All factories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {factories.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No factories</div>
            ) : (
              factories.map((f) => (
                <DropdownMenuCheckboxItem
                  key={f.id}
                  checked={isFactoryRowChecked(value, f.id)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => onChange(computeToggleFactory(value, f.id, allFactoryIds, sections))}
                >
                  {f.name} <span className="ml-1 text-muted-foreground">({f.abbreviation})</span>
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant={isBreadcrumb ? 'ghost' : 'outline'} className={triggerClassName}>
            <span className="truncate text-card-foreground dark:text-foreground">{sectionDropdownLabel}</span>
            <ChevronDown className={chevronClassName} aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
          align="start"
        >
          <DropdownMenuLabel>Sections</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onChange(selectAllSections(value));
            }}
            className={cn(value.section_ids.length === 0 && 'bg-accent/70')}
          >
            All sections
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {visibleSections.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No sections for this filter</div>
          ) : (
            visibleSections.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.id}
                checked={isSectionRowChecked(value, s.id)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() =>
                  onChange({ ...value, ...computeToggleSection(value, s.id, allFactoryIds, sections) })
                }
              >
                {s.name}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MachinesInlineLocationFilters;
