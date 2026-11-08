import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  compactFactoryDropdownLabel,
  toolbarFactoryDropdownLabel,
  selectAllFactories,
  selectAllSections,
  selectSingleFactory,
  selectSingleSection,
  visibleSectionsForSlice,
  type MachinesLocationFilterSlice,
} from '@/lib/machinesLocationFilters';
import { cn } from '@/lib/utils';
import { SCROLL_TARGET_HIGHLIGHT_CLASS } from '@/lib/scrollTargetHighlight';
import {
  appShellHeaderBoxedControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';

/** Shared factory/section triggers in app-shell toolbar rows. */
const toolbarScopeTriggerClass = cn(
  appShellHeaderBoxedControlClass,
  'h-9 min-h-9 w-[9.5rem] max-w-[9.5rem] shrink-0 justify-between gap-1 px-2.5 text-sm font-normal focus-visible:ring-inset',
  'data-[state=open]:border-brand-primary/40 data-[state=open]:bg-brand-primary/15 dark:data-[state=open]:bg-brand-primary/20',
);

/** Match filter popover surface (purple-tinted popover token, not slate dropdown). */
const scopeMenuContentClass =
  'border-border bg-popover text-popover-foreground shadow-md';

const scopeMenuItemClass =
  'focus:bg-brand-primary/10 dark:focus:bg-brand-primary/15 dark:focus:text-popover-foreground';

/** Active scope row in menu — brand tint like filter panels. */
const selectedScopeMenuItemClass = cn(
  scopeMenuItemClass,
  'font-medium text-foreground bg-brand-primary/10 dark:bg-brand-primary/20',
  'focus:bg-brand-primary/15 dark:focus:bg-brand-primary/28',
);

function toolbarTriggerVariant(
  variant: 'toolbar' | 'breadcrumb',
  _isScoped: boolean,
): 'ghost' | 'outline' {
  if (variant === 'breadcrumb') return 'ghost';
  return 'outline';
}

function toolbarScopeTriggerStateClass(isScoped: boolean): string {
  if (!isScoped) return '';
  return 'border-brand-primary/30 bg-brand-primary/10 dark:bg-brand-primary/15';
}

export interface MachinesInlineLocationFiltersProps {
  which: 'factories' | 'sections';
  variant?: 'toolbar' | 'breadcrumb';
  baseline?: 'default' | 'lowered';
  /** `single` = pick one row (Work Orders header); default `multi` = Machines-style toggles */
  selectionMode?: 'multi' | 'single';
  value: MachinesLocationFilterSlice;
  onChange: (next: MachinesLocationFilterSlice) => void;
  factories: Array<{ id: number; name: string; abbreviation: string }>;
  sections: Array<{ id: number; name: string; factory_id: number }>;
  className?: string;
  /** Controlled open state (factories dropdown only). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Draw attention to the trigger when factory selection is required (PO scroll-target glow). */
  highlight?: boolean;
  onHighlightDismiss?: () => void;
  /** Inline header row: short label + content-width trigger (Factories mobile header). */
  compact?: boolean;
  /** When false, hides the “All factories” row (pages that require a concrete factory). */
  showAllFactoriesOption?: boolean;
}

const MachinesInlineLocationFilters: React.FC<MachinesInlineLocationFiltersProps> = ({
  which,
  variant = 'toolbar',
  baseline = 'default',
  selectionMode = 'multi',
  value,
  onChange,
  factories,
  sections,
  className,
  open,
  onOpenChange,
  highlight = false,
  onHighlightDismiss,
  compact = false,
  showAllFactoriesOption = true,
}) => {
  const [sectionMenuOpen, setSectionMenuOpen] = React.useState(false);
  const allFactoryIds = React.useMemo(() => factories.map((f) => f.id), [factories]);

  const visibleSections = React.useMemo(
    () => visibleSectionsForSlice(value, allFactoryIds, sections),
    [sections, value, allFactoryIds],
  );

  const { factoryDropdownLabel, sectionDropdownLabel } = locationFilterLabels(
    value,
    allFactoryIds,
    visibleSections,
    factories,
    sections,
  );
  const displayFactoryLabel = compact
    ? compactFactoryDropdownLabel(value, factories)
    : variant === 'toolbar'
      ? toolbarFactoryDropdownLabel(value, allFactoryIds, factories)
      : factoryDropdownLabel;

  const factoryTriggerAriaLabel =
    variant === 'toolbar' && value.factory_ids.length === 1
      ? `Factory scope: ${factoryDropdownLabel}`
      : undefined;

  const isBreadcrumb = variant === 'breadcrumb';
  const breadcrumbBaseClass =
    baseline === 'lowered'
      ? 'h-7 max-w-[min(242px,44vw)] justify-start gap-1 border-none bg-transparent px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground shadow-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      : 'h-8 max-w-[min(242px,44vw)] justify-start gap-1 border-none bg-transparent px-1.5 text-[15px] font-medium text-card-foreground dark:text-foreground shadow-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  const triggerClassName = isBreadcrumb
    ? breadcrumbBaseClass
    : compact
      ? cn(
          appShellHeaderBoxedControlClass,
          'h-9 w-auto shrink-0 max-w-[min(120px,28vw)] justify-between gap-1 px-2 text-xs focus-visible:ring-inset',
        )
      : toolbarScopeTriggerClass;
  const chevronClassName = isBreadcrumb
    ? 'h-3.5 w-3.5 shrink-0 text-muted-foreground/80'
    : 'h-4 w-4 shrink-0 opacity-70';

  if (which === 'factories') {
    const factoryScoped = value.factory_ids.length > 0;
    return (
      <div className={cn(compact && 'shrink-0', className)}>
        <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={toolbarTriggerVariant(variant, factoryScoped)}
              className={cn(
                triggerClassName,
                toolbarScopeTriggerStateClass(factoryScoped),
                highlight && SCROLL_TARGET_HIGHLIGHT_CLASS,
              )}
              aria-label={
                compact
                  ? `Factory scope: ${factoryDropdownLabel}`
                  : factoryTriggerAriaLabel
              }
              onMouseEnter={() => {
                if (highlight) onHighlightDismiss?.();
              }}
              onClick={() => {
                if (highlight) onHighlightDismiss?.();
              }}
            >
              <span className="min-w-0 flex-1 truncate text-left text-card-foreground dark:text-foreground">
                {displayFactoryLabel}
              </span>
              <ChevronDown className={chevronClassName} aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(
              scopeMenuContentClass,
              'max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto py-1',
            )}
            align="start"
          >
            {showAllFactoriesOption ? (
              <>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onChange(selectAllFactories(value, allFactoryIds, sections));
                    onOpenChange?.(false);
                  }}
                  className={cn(
                    scopeMenuItemClass,
                    value.factory_ids.length === 0 && selectedScopeMenuItemClass,
                  )}
                >
                  All factories
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {factories.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No factories</div>
            ) : (
              factories.map((f) => {
                const checked = isFactoryRowChecked(value, f.id);
                const label = (
                  <>
                    {f.name} <span className="ml-1 text-muted-foreground">({f.abbreviation})</span>
                  </>
                );
                if (selectionMode === 'single') {
                  return (
                    <DropdownMenuItem
                      key={f.id}
                      className={cn(scopeMenuItemClass, checked && selectedScopeMenuItemClass)}
                      onSelect={(e) => {
                        e.preventDefault();
                        onChange(
                          checked && showAllFactoriesOption
                            ? selectAllFactories(value, allFactoryIds, sections)
                            : selectSingleFactory(value, f.id, allFactoryIds, sections),
                        );
                        onOpenChange?.(false);
                      }}
                    >
                      {label}
                    </DropdownMenuItem>
                  );
                }
                return (
                  <DropdownMenuCheckboxItem
                    key={f.id}
                    checked={checked}
                    className={cn(scopeMenuItemClass, checked && selectedScopeMenuItemClass)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => {
                      onChange(computeToggleFactory(value, f.id, allFactoryIds, sections));
                    }}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const sectionScoped = value.section_ids.length > 0;

  return (
    <div className={className}>
      <DropdownMenu open={sectionMenuOpen} onOpenChange={setSectionMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={toolbarTriggerVariant(variant, sectionScoped)}
            className={cn(triggerClassName, toolbarScopeTriggerStateClass(sectionScoped))}
            aria-label={
              variant === 'toolbar' ? `Section scope: ${sectionDropdownLabel}` : undefined
            }
          >
            <span
              className="min-w-0 flex-1 truncate text-left text-card-foreground dark:text-foreground"
              title={sectionDropdownLabel}
            >
              {sectionDropdownLabel}
            </span>
            <ChevronDown className={chevronClassName} aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            scopeMenuContentClass,
            'max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto py-1',
          )}
          align="start"
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onChange(selectAllSections(value));
              setSectionMenuOpen(false);
            }}
            className={cn(
              scopeMenuItemClass,
              value.section_ids.length === 0 && selectedScopeMenuItemClass,
            )}
          >
            All sections
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {visibleSections.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No sections for this filter</div>
          ) : (
            visibleSections.map((s) => {
              const checked = isSectionRowChecked(value, s.id);
              if (selectionMode === 'single') {
                return (
                  <DropdownMenuItem
                    key={s.id}
                    className={cn(scopeMenuItemClass, checked && selectedScopeMenuItemClass)}
                    onSelect={(e) => {
                      e.preventDefault();
                      onChange(checked ? selectAllSections(value) : selectSingleSection(value, s.id));
                      setSectionMenuOpen(false);
                    }}
                  >
                    {s.name}
                  </DropdownMenuItem>
                );
              }
              return (
                <DropdownMenuCheckboxItem
                  key={s.id}
                  checked={checked}
                  className={cn(scopeMenuItemClass, checked && selectedScopeMenuItemClass)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => {
                    onChange({ ...value, ...computeToggleSection(value, s.id, allFactoryIds, sections) });
                  }}
                >
                  {s.name}
                </DropdownMenuCheckboxItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MachinesInlineLocationFilters;
