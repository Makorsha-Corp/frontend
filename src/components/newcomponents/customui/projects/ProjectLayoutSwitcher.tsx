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
  PROJECT_LAYOUT_OPTIONS,
  getProjectLayoutOption,
  type ProjectLayoutMode,
} from './projectLayoutModes';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';

interface ProjectLayoutSwitcherProps {
  value: ProjectLayoutMode;
  onChange: (mode: ProjectLayoutMode) => void;
}

const ProjectLayoutSwitcher: React.FC<ProjectLayoutSwitcherProps> = ({ value, onChange }) => {
  const active = getProjectLayoutOption(value);
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('gap-2 bg-background', appShellHeaderControlClass)}
          aria-label="Change projects page layout"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
          <ActiveIcon className="h-4 w-4 shrink-0 text-brand-primary" />
          <span className="hidden sm:inline">{active.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Page layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROJECT_LAYOUT_OPTIONS.map((option) => {
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectLayoutSwitcher;
