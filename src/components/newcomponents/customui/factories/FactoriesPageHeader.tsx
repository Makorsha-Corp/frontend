import React from 'react';
import { LayoutDashboard, Plus, Users } from 'lucide-react';

import AppShellHeader, {
  AppShellHeaderIconAction,
  AppShellHeaderRow,
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Factory } from '@/types/factory';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';

export interface FactoriesPageHeaderProps {
  factories: Factory[];
  factoryLocationValue: MachinesLocationFilterSlice;
  onFactoryLocationChange: (slice: Partial<MachinesLocationFilterSlice>) => void;
  onOpenDepartments: () => void;
  onAddFactory: () => void;
}

const FactoriesPageHeader: React.FC<FactoriesPageHeaderProps> = ({
  factories,
  factoryLocationValue,
  onFactoryLocationChange,
  onOpenDepartments,
  onAddFactory,
}) => {
  const factoryFilterProps = {
    which: 'factories' as const,
    variant: 'toolbar' as const,
    value: factoryLocationValue,
    onChange: onFactoryLocationChange,
    factories,
    sections: [] as Array<{ id: number; name: string; factory_id: number }>,
  };

  return (
    <AppShellHeader sticky>
      {/* Mobile — single row */}
      <AppShellHeaderRow className="lg:hidden">
        <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
          <div className={appShellHeaderIconTileClass}>
            <LayoutDashboard className="h-5 w-5 text-brand-primary" />
          </div>
          <h1 className={cn(appShellHeaderTitleClass, 'shrink-0')}>Factories</h1>
          <MachinesInlineLocationFilters
            {...factoryFilterProps}
            selectionMode="single"
            compact
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AppShellHeaderIconAction
            icon={Users}
            variant="outline"
            onClick={onOpenDepartments}
            ariaLabel="Manage departments"
          />
          <AppShellHeaderIconAction icon={Plus} onClick={onAddFactory} ariaLabel="Add factory" />
        </div>
      </AppShellHeaderRow>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
            <div className={appShellHeaderIconTileClass}>
              <LayoutDashboard className="h-5 w-5 text-brand-primary" />
            </div>
            <h1 className={appShellHeaderTitleClass}>Factories Overview</h1>
            <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
            <MachinesInlineLocationFilters {...factoryFilterProps} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={appShellHeaderControlClass}
              onClick={onOpenDepartments}
            >
              <Users className="mr-2 h-4 w-4" />
              Departments
            </Button>
            <Button
              onClick={onAddFactory}
              className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Factory
            </Button>
          </div>
        </div>
      </div>
    </AppShellHeader>
  );
};

export default FactoriesPageHeader;
