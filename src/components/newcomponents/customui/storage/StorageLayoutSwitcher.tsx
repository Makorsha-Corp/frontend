import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutGrid, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STORAGE_LAYOUT_OPTIONS,
  getStorageLayoutOption,
  type StorageLayoutMode,
} from './storageLayoutModes';
import {
  STORAGE_TAB_SWITCHER_STYLE_OPTIONS,
  STORAGE_TAB_SWITCHER_PLACEMENT_OPTIONS,
  getStorageTabSwitcherStyleOption,
  getStorageTabSwitcherPlacementOption,
  type StorageTabSwitcherStyle,
  type StorageTabSwitcherPlacement,
} from './storageTabSwitcherStyles';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';

interface StorageLayoutSwitcherProps {
  value: StorageLayoutMode;
  onChange: (mode: StorageLayoutMode) => void;
  tabSwitcherStyle?: StorageTabSwitcherStyle;
  onTabSwitcherStyleChange?: (style: StorageTabSwitcherStyle) => void;
  tabSwitcherPlacement?: StorageTabSwitcherPlacement;
  onTabSwitcherPlacementChange?: (placement: StorageTabSwitcherPlacement) => void;
}

const StorageLayoutSwitcher: React.FC<StorageLayoutSwitcherProps> = ({
  value,
  onChange,
  tabSwitcherStyle,
  onTabSwitcherStyleChange,
  tabSwitcherPlacement,
  onTabSwitcherPlacementChange,
}) => {
  const active = getStorageLayoutOption(value);
  const ActiveIcon = active.icon;
  const activeSwitcherStyle = tabSwitcherStyle
    ? getStorageTabSwitcherStyleOption(tabSwitcherStyle)
    : null;
  const activeSwitcherPlacement = tabSwitcherPlacement
    ? getStorageTabSwitcherPlacementOption(tabSwitcherPlacement)
    : null;
  const showSwitcherOptions = onTabSwitcherStyleChange && tabSwitcherStyle != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('gap-2 bg-background', appShellHeaderControlClass)}
          aria-label="Change storage page layout"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
          <ActiveIcon className="h-4 w-4 shrink-0 text-brand-primary" />
          <span className="hidden sm:inline">{active.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(70vh,28rem)] w-72 overflow-y-auto overflow-x-hidden"
      >
        <DropdownMenuLabel>Page layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {STORAGE_LAYOUT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = option.id === value;
          return (
            <DropdownMenuItem
              key={option.id}
              className={cn('flex items-start gap-3 py-2.5', selected && 'bg-accent/70')}
              onSelect={(e) => {
                e.preventDefault();
                onChange(option.id);
              }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-none">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
              </div>
              {selected && <Check className="h-4 w-4 shrink-0 text-brand-primary" />}
            </DropdownMenuItem>
          );
        })}

        {showSwitcherOptions && (
          <>
            {onTabSwitcherPlacementChange && tabSwitcherPlacement != null && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span>Switcher placement</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Where Storage / Products tabs appear (Tabs layout)
                  </span>
                </DropdownMenuLabel>
                {STORAGE_TAB_SWITCHER_PLACEMENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = option.id === tabSwitcherPlacement;
                  return (
                    <DropdownMenuItem
                      key={option.id}
                      className={cn('flex items-start gap-3 py-2.5', selected && 'bg-accent/70')}
                      onSelect={(e) => {
                        e.preventDefault();
                        onTabSwitcherPlacementChange(option.id);
                      }}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none">{option.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {selected && <Check className="h-4 w-4 shrink-0 text-brand-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span>Section switcher style</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Visual design of the Storage / Products control
              </span>
            </DropdownMenuLabel>
            {STORAGE_TAB_SWITCHER_STYLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = option.id === tabSwitcherStyle;
              return (
                <DropdownMenuItem
                  key={option.id}
                  className={cn('flex items-start gap-3 py-2.5', selected && 'bg-accent/70')}
                  onSelect={(e) => {
                    e.preventDefault();
                    onTabSwitcherStyleChange(option.id);
                  }}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none">{option.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    <SwitcherStylePreview variant={option.id} active={selected} />
                  </div>
                  {selected && <Check className="h-4 w-4 shrink-0 text-brand-primary" />}
                </DropdownMenuItem>
              );
            })}
            {value !== 'tabs' && (activeSwitcherStyle || activeSwitcherPlacement) && (
              <p className="px-2 pb-2 text-[11px] text-muted-foreground">
                Switch to Tabs layout to use these switcher settings.
              </p>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Tiny inline mockup so users can compare switcher styles in the menu. */
const SwitcherStylePreview: React.FC<{ variant: StorageTabSwitcherStyle; active: boolean }> = ({
  variant,
  active,
}) => {
  const bar = (filled: boolean) => (
    <span
      className={cn(
        'inline-block h-2 rounded-sm',
        filled ? 'bg-brand-primary/80' : 'bg-muted-foreground/25',
        variant === 'compact' ? 'w-3' : 'w-5'
      )}
    />
  );

  return (
    <div
      className={cn(
        'mt-2 flex items-center gap-1 rounded-md p-1.5',
        variant === 'segmented' && 'bg-muted',
        variant === 'underline' && 'border-b border-border bg-transparent pb-0.5',
        variant === 'ghost' && 'bg-transparent',
        variant === 'outline' && 'gap-1.5 bg-transparent',
        variant === 'compact' && 'bg-muted/60',
        active && 'ring-1 ring-brand-primary/20'
      )}
      aria-hidden
    >
      {variant === 'outline' ? (
        <>
          <span className="inline-flex h-4 w-8 items-center justify-center rounded border border-brand-primary/40 bg-brand-primary/10" />
          <span className="inline-flex h-4 w-8 items-center justify-center rounded border border-border" />
        </>
      ) : (
        <>
          {bar(true)}
          {bar(false)}
        </>
      )}
    </div>
  );
};

export default StorageLayoutSwitcher;
