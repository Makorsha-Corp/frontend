import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setFactory, clearFactory } from '@/features/auth/authSlice';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { Factory } from '@/types/factory';

export interface GlobalFactoryHoverPickerProps {
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

const GlobalFactoryHoverPicker: React.FC<GlobalFactoryHoverPickerProps> = ({
  className,
  side = 'right',
  align = 'start',
}) => {
  const { t } = useTranslation('factories');
  const dispatch = useAppDispatch();
  const selectedFactory = useAppSelector((state) => state.auth.factory);
  const [open, setOpen] = useState(false);
  const { data: factories = [], isLoading } = useGetFactoriesQuery(
    { skip: 0, limit: 100 },
    { skip: !open },
  );

  const handleSelect = (factory: Factory) => {
    dispatch(setFactory(factory));
    setOpen(false);
  };

  const handleClear = () => {
    dispatch(clearFactory());
    setOpen(false);
  };

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          title={t('globalFactoryChangeAria')}
          aria-label={t('globalFactoryChangeAria')}
          className={cn(
            'p-1.5 rounded-md shrink-0 hover:bg-white/10 dark:hover:bg-white/10 transition-colors',
            className,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <ArrowLeftRight size={18} />
        </button>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className="z-[200] w-72 border-border bg-popover p-0 text-popover-foreground shadow-lg"
        >
          <div className="space-y-2 border-b border-border px-3 py-3">
            <p className="text-sm font-semibold text-foreground">{t('globalFactoryTitle')}</p>
            <p className="text-xs leading-snug text-muted-foreground">{t('globalFactoryHint')}</p>
            {selectedFactory ? (
              <p className="text-xs text-foreground">
                {t('globalFactoryCurrent', {
                  name: selectedFactory.name,
                  abbr: selectedFactory.abbreviation,
                })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('globalFactoryNone')}</p>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : factories.length > 0 ? (
              <div className="space-y-1">
                {selectedFactory ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start text-muted-foreground"
                    onClick={handleClear}
                  >
                    {t('globalFactoryClear')}
                  </Button>
                ) : null}
                {factories.map((factory) => (
                  <Button
                    key={factory.id}
                    type="button"
                    variant={selectedFactory?.id === factory.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-full justify-start"
                    onClick={() => handleSelect(factory)}
                  >
                    <span className="truncate font-medium">{factory.name}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">({factory.abbreviation})</span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="px-1 py-3 text-center text-xs text-muted-foreground">
                {t('globalFactoryEmpty')}
              </p>
            )}
          </div>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
};

export default GlobalFactoryHoverPicker;
