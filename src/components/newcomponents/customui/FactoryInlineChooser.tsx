import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FactoryInlineChooserItem = {
  id: number;
  name: string;
  abbreviation?: string | null;
};

/** Default classes for schedule / in-tab factory pick — override via props or `classNames`. */
export const factoryInlineChooserDefaults = {
  root: 'flex min-h-0 flex-1 flex-col p-4 sm:p-6',
  panel:
    'flex w-full max-w-3xl flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6',
  header: 'space-y-1',
  title: 'text-base font-semibold tracking-tight text-foreground',
  description: 'text-sm text-muted-foreground',
  body: 'flex flex-col gap-4',
  list: 'flex flex-wrap gap-3',
  tile:
    'h-auto min-h-[4rem] min-w-[10rem] max-w-[16rem] flex-col gap-1 whitespace-normal px-4 py-3 text-center shadow-sm hover:border-brand-primary/40 hover:bg-accent/50',
  tileName: 'font-semibold leading-snug',
  tileAbbrev: 'text-xs text-muted-foreground',
} as const;

export interface FactoryInlineChooserClassNames {
  root?: string;
  panel?: string;
  header?: string;
  title?: string;
  description?: string;
  body?: string;
  list?: string;
  tile?: string;
  tileName?: string;
  tileAbbrev?: string;
}

export interface FactoryInlineChooserProps {
  factories: FactoryInlineChooserItem[];
  onSelect: (factoryId: number) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  emptyMessage?: string;
  /** Top-aligned under toolbar (default) vs vertically centered in panel. */
  align?: 'top' | 'center';
  /** Merged with defaults; per-slot overrides for page-specific styling. */
  classNames?: FactoryInlineChooserClassNames;
  /** Extra classes on root (after `classNames.root`). */
  className?: string;
}

const FactoryInlineChooser: React.FC<FactoryInlineChooserProps> = ({
  factories,
  onSelect,
  isLoading = false,
  title,
  description,
  emptyMessage,
  align = 'top',
  classNames,
  className,
}) => {
  const { t } = useTranslation('factories');
  const resolvedTitle = title ?? t('chooseFactoryTitle');
  const resolvedDescription = description ?? t('chooseFactoryDescription');
  const resolvedEmpty = emptyMessage ?? t('noFactoriesYet');
  const c = {
    root: cn(factoryInlineChooserDefaults.root, classNames?.root, className),
    panel: cn(factoryInlineChooserDefaults.panel, classNames?.panel),
    header: cn(factoryInlineChooserDefaults.header, classNames?.header),
    title: cn(factoryInlineChooserDefaults.title, classNames?.title),
    description: cn(factoryInlineChooserDefaults.description, classNames?.description),
    body: cn(factoryInlineChooserDefaults.body, classNames?.body),
    list: cn(
      factoryInlineChooserDefaults.list,
      align === 'center' && 'justify-center',
      classNames?.list,
    ),
    tile: cn(factoryInlineChooserDefaults.tile, classNames?.tile),
    tileName: cn(factoryInlineChooserDefaults.tileName, classNames?.tileName),
    tileAbbrev: cn(factoryInlineChooserDefaults.tileAbbrev, classNames?.tileAbbrev),
  };

  return (
    <div
      className={cn(
        c.root,
        align === 'center' ? 'items-center justify-center' : 'items-start justify-start',
      )}
      data-component="factory-inline-chooser"
    >
      <div className={cn(c.panel, align === 'center' && 'text-center')}>
        <header className={c.header}>
          <p className={c.title}>{resolvedTitle}</p>
          {resolvedDescription ? <p className={c.description}>{resolvedDescription}</p> : null}
        </header>

        <div className={c.body}>
          {isLoading ? (
            <Loader2
              className="h-8 w-8 animate-spin text-brand-primary"
              aria-label={t('loadingFactoriesAria')}
            />
          ) : factories.length === 0 ? (
            <p className={c.description}>{resolvedEmpty}</p>
          ) : (
            <div className={c.list} role="list">
              {factories.map((factory) => (
                <Button
                  key={factory.id}
                  type="button"
                  variant="outline"
                  role="listitem"
                  className={c.tile}
                  onClick={() => onSelect(factory.id)}
                >
                  <span className={c.tileName}>{factory.name}</span>
                  {factory.abbreviation ? (
                    <span className={c.tileAbbrev}>{factory.abbreviation}</span>
                  ) : null}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryInlineChooser;
